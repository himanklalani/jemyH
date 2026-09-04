import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { processSuccessfulPayment } from '@/lib/orderProcessing';

// Stripe requires the raw body for signature verification, but Next.js App Router parses it.
// We must read it as an ArrayBuffer and convert to Buffer.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ success: false, message: 'Stripe webhook not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' });
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ success: false, message: 'No stripe signature found' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`⚠️ Stripe Webhook signature verification failed.`, err.message);
    return NextResponse.json({ success: false, message: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // In a full implementation, we'd pull the cartId and user details from the paymentIntent.metadata
        // For this foundation, we ensure the pipeline can be called.
        if (paymentIntent.metadata?.cartId) {
          await processSuccessfulPayment({
            transactionId: paymentIntent.id,
            gateway: 'stripe',
            cartId: paymentIntent.metadata.cartId,
            userId: paymentIntent.metadata.userId,
            sessionId: paymentIntent.metadata.sessionId,
            region: 'US', // Stripe is US only in our architecture
            currency: paymentIntent.currency.toUpperCase(),
            totalAmount: paymentIntent.amount / 100, // Convert cents back to dollars
            couponCode: paymentIntent.metadata.couponCode,
            shippingAddress: paymentIntent.shipping?.address, // Assuming shipping is collected via Stripe Elements
            billingAddress: paymentIntent.shipping?.address, // Fallback
            customerEmail: paymentIntent.receipt_email || 'unknown@example.com',
          });
        }
        break;
      case 'payment_intent.payment_failed':
        // Here we could explicitly roll back any held stock if we had a stock reservation system
        console.log(`Payment failed for Intent: ${(event.data.object as Stripe.PaymentIntent).id}`);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook Error processing event]', error);
    return NextResponse.json({ success: false, message: 'Server error during webhook processing' }, { status: 500 });
  }
}
