import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { Product } from '@/models/Product';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Revenue Split (US vs IN)
    const revenuePipeline = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'pending'] }, orderStatus: { $ne: 'cancelled' } } },
      { 
        $group: { 
          _id: '$region', 
          totalRevenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 } 
        } 
      }
    ]);

    // 2. Low Stock Alerts
    const lowStockThreshold = 10;
    const lowStockCount = await Product.countDocuments({ stock: { $lte: lowStockThreshold } });

    // 3. Prescription Queue Depth
    const pendingRxCount = await Order.countDocuments({
      'items.prescription.verificationStatus': 'pending'
    });

    // 4. Recent Sales Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const salesTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            region: '$region'
          },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.region': 1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        revenue: revenuePipeline,
        lowStockAlerts: lowStockCount,
        prescriptionQueueDepth: pendingRxCount,
        salesTrend
      }
    });
  } catch (error: any) {
    console.error('[Admin KPI Error]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
