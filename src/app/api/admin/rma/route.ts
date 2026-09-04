import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import RMA from '@/models/RMA';
import Order from '@/models/Order';
import { checkAdminAuth } from '@/lib/auth';

// GET all RMA requests (Admin)
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [rmas, total] = await Promise.all([
      RMA.find(query)
        .populate('order')
        .populate('user', 'name email')
        .populate('items.product', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RMA.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      rmas,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Admin GET RMA]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST create RMA request
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();
    const { orderId, userId, items } = body;

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const newRMA = await RMA.create({
      orderId,
      userId,
      items,
      status: 'requested',
    });

    return NextResponse.json({ success: true, rma: newRMA }, { status: 201 });
  } catch (error: any) {
    console.error('[POST RMA Error]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
