import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulPayment, calculateOrderTotal } from '@/lib/orderProcessing';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';
    
    if (region === 'US') {
      return NextResponse.json({ success: false, message: 'COD is not available in the US region.' }, { status: 400 });
    }

    const { cartId, currency: clientCurrency, couponCode, shippingAddress, billingAddress, customerEmail } = await req.json();

    if (!cartId || !shippingAddress || !customerEmail) {
      return NextResponse.json({ success: false, message: 'Missing required order fields' }, { status: 400 });
    }

    // Extract user/session
    let userId = undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifyAccessToken(authHeader.split(' ')[1]);
      if (decoded) userId = decoded.id;
    }
    const sessionId = req.cookies.get('jemy_session')?.value;

    // Securely calculate total on the server
    const { finalTotal, currency } = await calculateOrderTotal(cartId, region, couponCode);

    // Use our shared unified pipeline!
    const order = await processSuccessfulPayment({
      transactionId: `COD-${Date.now()}`,
      gateway: 'cod',
      cartId,
      userId,
      sessionId,
      region,
      currency,
      totalAmount: finalTotal,
      couponCode,
      shippingAddress,
      billingAddress,
      customerEmail,
    });

    return NextResponse.json({ success: true, orderId: order._id });

  } catch (error: any) {
    console.error('[checkout cod POST]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
