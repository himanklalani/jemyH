import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    
    // Find orders that have at least one item with a pending prescription
    const ordersWithPendingRx = await Order.find({
      'items.prescription.verificationStatus': 'pending'
    })
    .populate('user', 'name email')
    .populate('items.product', 'name category images')
    .sort({ createdAt: 1 }) // oldest first (queue style)
    .lean();

    // Flatten it into a queue of individual prescription tasks
    const queue: any[] = [];
    ordersWithPendingRx.forEach((order: any) => {
      order.items.forEach((item: any) => {
        if (item.prescription && item.prescription.verificationStatus === 'pending') {
          queue.push({
            orderId: order._id,
            itemId: item._id, // This requires item._id to be populated by Mongoose by default for subdocuments
            customer: order.user,
            product: item.product,
            prescription: item.prescription,
            orderDate: order.createdAt
          });
        }
      });
    });

    return NextResponse.json({ success: true, queue });
  } catch (error: any) {
    console.error('[Admin GET Prescription Queue]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
