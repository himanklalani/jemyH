import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import { Product } from '@/models/Product';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import { logCartEvent } from '@/lib/cartEventLogger';
// import { sendOrderConfirmationEmail } from '@/lib/brevo'; // We'll assume this exists or create it later

interface ProcessPaymentParams {
  transactionId: string;
  gateway: 'stripe' | 'razorpay' | 'cod';
  cartId: string; // The MongoDB _id of the Cart
  userId?: string; // If logged in
  sessionId?: string; // If guest
  region: 'US' | 'IN';
  currency: string;
  totalAmount: number;
  couponCode?: string;
  shippingAddress: any;
  billingAddress: any;
  customerEmail: string;
}

export async function calculateOrderTotal(cartId: string, region: 'US' | 'IN', couponCode?: string) {
  await dbConnect();
  
  const cart = await Cart.findById(cartId).populate('items.product');
  if (!cart) throw new Error('Cart not found');
  
  const subtotal = cart.items.reduce((acc: number, item: any) => acc + (item.priceSnapshot.amount * item.quantity), 0);
  let finalTotal = subtotal;
  
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon && coupon.isActive) {
      if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
        // Expired, ignore
      } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        // Usage limit reached, ignore
      } else {
        const minOrderValue = coupon.minOrderValue?.[region];
        if (!minOrderValue || subtotal >= minOrderValue) {
          if (coupon.discountType === 'percentage') {
            finalTotal = Math.max(0, subtotal - (subtotal * coupon.discountValue / 100));
          } else if (coupon.discountType === 'fixed') {
            finalTotal = Math.max(0, subtotal - coupon.discountValue);
          }
        }
      }
    }
  }

  return { finalTotal, currency: cart.currency, cart };
}


export async function processSuccessfulPayment(params: ProcessPaymentParams) {
  await dbConnect();
  const session = await mongoose.startSession();

  let newOrder: any = null;

  try {
    await session.withTransaction(async () => {
      // 1. Fetch Cart
      const cart = await Cart.findById(params.cartId).populate('items.product').session(session);
      if (!cart) {
        throw new Error(`Cart ${params.cartId} not found during payment processing`);
      }

      // 2. Create Order
      const parseRx = (val: any) => (val && typeof val === 'string' && val.trim() !== '') ? Number(val) : undefined;
      
      const orderItems = cart.items.map((item: any) => {
        let prescriptionObj = item.prescription;
        
        // If manual entry, construct the object for the order
        if (!prescriptionObj && item.rxData) {
          prescriptionObj = {
            type: item.lensType,
            od: { sphere: parseRx(item.rxData.od?.sph), cylinder: parseRx(item.rxData.od?.cyl), axis: parseRx(item.rxData.od?.axis), add: parseRx(item.rxData.od?.add) },
            os: { sphere: parseRx(item.rxData.os?.sph), cylinder: parseRx(item.rxData.os?.cyl), axis: parseRx(item.rxData.os?.axis), add: parseRx(item.rxData.os?.add) },
            pd: parseRx(item.pd),
            verificationStatus: 'pending',
            verificationMethod: 'manual-entry',
            prescriptionDate: new Date()
          };
        }
        
        return {
          product: item.product._id,
          productSnapshot: {
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.images?.[0] || '',
            category: item.product.category,
            sku: item.product.sku || ''
          },
          quantity: item.quantity,
          priceAtEvent: item.priceSnapshot.amount,
          prescription: prescriptionObj,
          prescriptionPending: item.prescriptionPending,
        };
      });

      const [createdOrder] = await Order.create([{
        user: params.userId || undefined,
        sessionId: params.sessionId,
        items: orderItems,
        totalPrice: params.totalAmount,
        currency: params.currency,
        region: params.region,
        paymentGateway: params.gateway,
        paymentStatus: params.gateway === 'cod' ? 'pending' : 'paid',
        transactionIds: {
          gatewayOrderId: params.transactionId,
        },
        shippingAddress: params.shippingAddress,
        billingAddress: params.billingAddress,
        couponCode: params.couponCode,
        orderStatus: 'processing',
      }], { session });

      newOrder = createdOrder;

      // 3. Atomic Decrement Stock & Increment Sales
      for (const item of cart.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, sales: item.quantity } },
          { session, new: true }
        );

        if (!updatedProduct) {
          throw new Error(`Insufficient stock for product ${item.product.name}`);
        }
      }

      // 4. Increment Coupon Usage
      if (params.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: params.couponCode.toUpperCase() },
          { $inc: { usageCount: 1 } },
          { session }
        );
      }

      // 4.5. User Profile Updates: Save Prescriptions & Activate Membership
      if (params.userId) {
        const userUpdates: any = {};
        const newPrescriptions = [];
        let membershipActivated = false;

        for (const item of cart.items) {
          // Save manual prescriptions to user profile
          if (item.rxMethod === 'manual' && item.rxData) {
            const parseRx = (val: any) => (val && typeof val === 'string' && val.trim() !== '') ? Number(val) : undefined;
            
            newPrescriptions.push({
              type: item.lensType,
              od: { sphere: parseRx(item.rxData.od?.sph), cylinder: parseRx(item.rxData.od?.cyl), axis: parseRx(item.rxData.od?.axis), add: parseRx(item.rxData.od?.add) },
              os: { sphere: parseRx(item.rxData.os?.sph), cylinder: parseRx(item.rxData.os?.cyl), axis: parseRx(item.rxData.os?.axis), add: parseRx(item.rxData.os?.add) },
              pd: parseRx(item.pd),
              verificationStatus: 'pending',
              verificationMethod: 'manual-entry',
              prescriptionDate: new Date()
            });
          }
          
          // Check for membership
          if (item.product.slug === 'jemy-atelier-membership') {
            membershipActivated = true;
          }
        }

        if (newPrescriptions.length > 0) {
          userUpdates.$push = { savedPrescriptions: { $each: newPrescriptions } };
        }

        if (membershipActivated) {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          userUpdates.$set = {
            'membership.isActive': true,
            'membership.plan': 'atelier_annual',
            'membership.startDate': new Date(),
            'membership.expiryDate': expiryDate,
            'membership.activatedViaOrderId': newOrder._id
          };
        }

        if (Object.keys(userUpdates).length > 0) {
          await User.findByIdAndUpdate(params.userId, userUpdates, { session });
        }
      }

      // 5. Clear Cart
      await Cart.findByIdAndDelete(params.cartId, { session });
    }); // End Transaction

    // These happen outside the transaction because we only want them if the transaction fully commits
    logCartEvent({
      user: params.userId,
      sessionId: params.sessionId,
      action: 'clear',
      region: params.region,
      cartSnapshotAfter: [],
    });

    // 6. Trigger Email
    // await sendOrderConfirmationEmail(params.customerEmail, newOrder);

    return newOrder;
  } catch (error) {
    console.error('[orderProcessing] Critical Failure in Post-Payment Pipeline:', error);
    throw error;
  } finally {
    session.endSession();
  }
}
