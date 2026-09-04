import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { protect } from '@/lib/protect';

// GET /api/user/orders — returns all orders for the authenticated user
export async function GET(req: NextRequest) {
  const auth = await protect(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const orders = await Order.find({ user: auth.user._id })
      .populate('items.product', 'name images category slug')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('[user orders GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
