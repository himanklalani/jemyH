import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CartEvent from '@/models/CartEvent';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // In a real app, you'd pull the session/user ID from cookies or a token.
    // Here we'll just generate a basic payload for the event.
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';
    const currency = region === 'US' ? 'USD' : 'INR';
    
    const newEvent = new CartEvent({
      action: body.action || 'add',
      product: body.productId || null,
      region,
      currency,
      sessionId: req.cookies.get('session_id')?.value || 'anonymous',
      device: {
        userAgent: req.headers.get('user-agent') || 'unknown'
      },
      cartSnapshotAfter: body.cartSnapshot || [],
      timestamp: new Date()
    });

    await newEvent.save();

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    console.error('[Cart Event Log Error]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
