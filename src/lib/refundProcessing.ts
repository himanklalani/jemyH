import Stripe from 'stripe';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { Product } from '@/models/Product';

export async function processRefund(orderId: string, reason: string = 'Requested by customer') {
  await dbConnect();

  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.status === 'refunded' || order.paymentStatus === 'refunded') {
    throw new Error('Order is already refunded');
  }

  // 1. Gateway Refund Routing
  if (order.paymentGateway === 'stripe') {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' });
    
    // Stripe expects PaymentIntent ID which we saved in transactionIds
    const paymentIntentId = order.transactionIds?.gatewayPaymentId || order.transactionIds?.gatewayOrderId;
    if (!paymentIntentId) throw new Error('Stripe transaction ID missing');
    
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    });
  } else if (order.paymentGateway === 'razorpay') {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay is not configured');
    }
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // We need to fetch the payment associated with the Razorpay Order ID to refund it
    const razorpayOrderId = order.transactionIds?.gatewayOrderId || order.transactionIds?.gatewayPaymentId;
    if (!razorpayOrderId) throw new Error('Razorpay transaction ID missing');
    
    const payments = await razorpay.orders.fetchPayments(razorpayOrderId);
    if (payments.items.length === 0) throw new Error('No payments found for this Razorpay Order');
    
    const successfulPayment = payments.items.find(p => p.status === 'captured');
    if (!successfulPayment) throw new Error('No captured payment found for this Razorpay Order');

    await razorpay.payments.refund(successfulPayment.id, {
      amount: order.totalPrice * 100, // refund full amount in paise
      notes: { reason },
    });
  } else if (order.paymentGateway === 'cod' || order.paymentMethod === 'cod') {
    // For COD, just mark it refunded/cancelled in our DB. No gateway API call needed.
    // If they already paid cash at the door, the business handles manual bank transfer.
  }

  // 2. Database State Update
  order.orderStatus = 'refunded';
  order.paymentStatus = 'refunded';
  await order.save();

  // 3. Increment Stock & Decrement Sales (Restocking)
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sales: -item.quantity }
    });
  }

  return order;
}
