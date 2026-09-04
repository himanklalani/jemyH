import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CartEvent from '@/models/CartEvent';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 1. Overall Cart Metrics (Aggregation)
    // Find how many unique carts existed vs how many successfully checked out ('clear' action usually indicates checkout/cleared)
    const totalEvents = await CartEvent.countDocuments();
    
    const uniqueCarts = await CartEvent.distinct('cartId');
    const checkedOutCarts = await CartEvent.distinct('cartId', { action: 'clear' });
    
    const totalCarts = uniqueCarts.length;
    const completedCarts = checkedOutCarts.length;
    const abandonmentRate = totalCarts > 0 ? ((totalCarts - completedCarts) / totalCarts) * 100 : 0;

    // 2. Recent Events Feed
    const recentEvents = await CartEvent.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalEvents,
          totalUniqueCarts: totalCarts,
          completedCarts,
          abandonmentRate: abandonmentRate.toFixed(2) + '%'
        },
        recentFeed: recentEvents
      }
    });
  } catch (error: any) {
    console.error('[Admin Cart Audit Error]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
