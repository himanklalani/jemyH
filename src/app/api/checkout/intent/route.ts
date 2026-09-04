import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { calculateOrderTotal } from '@/lib/orderProcessing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';
    const { cartId, couponCode, currency: clientCurrency } = body;
    
    if (!cartId) {
      return NextResponse.json({ success: false, message: 'Cart ID required' }, { status: 400 });
    }

    // Securely calculate total on the server
    const { finalTotal, currency } = await calculateOrderTotal(cartId, region, couponCode);

    if (finalTotal <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid cart total' }, { status: 400 });
    }

    // 1. Stripe Path (US Region)
    if (region === 'US') {
      if (!process.env.STRIPE_SECRET_KEY) {
        // Graceful fallback for missing credentials
        return NextResponse.json({ 
          success: false, 
          gatewayNotConfigured: true,
          message: 'Stripe is not configured in the environment variables.' 
        }, { status: 200 }); // Returning 200 so UI can handle it cleanly
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' as any });
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalTotal * 100), // Stripe expects cents
        currency: currency.toLowerCase(),
        metadata: { 
          region: 'US',
          cartId: body.cartId,
          userId: body.userId || '',
          sessionId: body.sessionId || '',
          couponCode: body.couponCode || '',
          shippingAddress: JSON.stringify(body.shippingAddress || {}),
          billingAddress: JSON.stringify(body.billingAddress || {})
        },
      });

      return NextResponse.json({ success: true, clientSecret: paymentIntent.client_secret, gateway: 'stripe' });
    } 
    
    // 2. Razorpay Path (IN Region)
    else {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // Graceful fallback for missing credentials
        return NextResponse.json({ 
          success: false, 
          gatewayNotConfigured: true,
          message: 'Razorpay is not configured in the environment variables.' 
        }, { status: 200 }); 
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: Math.round(finalTotal * 100), // Razorpay expects paise
        currency: currency.toUpperCase(),
        receipt: `receipt_${Date.now()}`,
        notes: {
          cartId: body.cartId,
          userId: body.userId || '',
          sessionId: body.sessionId || '',
          couponCode: body.couponCode || '',
          shippingAddress: JSON.stringify(body.shippingAddress || {}),
          billingAddress: JSON.stringify(body.billingAddress || {})
        }
      };

      const order = await razorpay.orders.create(options);
      
      return NextResponse.json({ success: true, orderId: order.id, gateway: 'razorpay', keyId: process.env.RAZORPAY_KEY_ID });
    }

  } catch (error: any) {
    console.error('[checkout intent POST]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
