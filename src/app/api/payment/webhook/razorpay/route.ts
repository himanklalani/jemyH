import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processSuccessfulPayment } from '@/lib/orderProcessing';

export async function POST(req: NextRequest) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ success: false, message: 'Razorpay webhook not configured' }, { status: 500 });
  }

  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ success: false, message: 'No razorpay signature found' }, { status: 400 });
    }

    // Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error(`⚠️ Razorpay Webhook signature mismatch.`);
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    switch (event.event) {
      case 'payment.captured':
      case 'order.paid':
        const paymentData = event.payload.payment.entity;
        
        // Normally, you'd pass metadata via Razorpay notes
        const notes = paymentData.notes || {};
        
        if (notes.cartId) {
          await processSuccessfulPayment({
            transactionId: paymentData.id,
            gateway: 'razorpay',
            cartId: notes.cartId,
            userId: notes.userId,
            sessionId: notes.sessionId,
            region: 'IN', // Razorpay is IN only
            currency: paymentData.currency,
            totalAmount: paymentData.amount / 100, // Convert paise back to INR
            couponCode: notes.couponCode,
            shippingAddress: JSON.parse(notes.shippingAddress || '{}'),
            billingAddress: JSON.parse(notes.billingAddress || '{}'),
            customerEmail: paymentData.email || 'unknown@example.com',
          });
        }
        break;
      case 'payment.failed':
        console.log(`Payment failed for Razorpay ID: ${event.payload.payment.entity.id}`);
        break;
      default:
        console.log(`Unhandled event type ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]', error);
    return NextResponse.json({ success: false, message: 'Server error during webhook processing' }, { status: 500 });
  }
}
