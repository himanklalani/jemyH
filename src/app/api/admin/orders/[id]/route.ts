import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';
import { processRefund } from '@/lib/refundProcessing';
import { sendShippingUpdateEmail } from '@/lib/brevo';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const { action, courier, trackingNumber, trackingUrl, reason } = body;

    const order = await Order.findById(resolvedParams.id).populate('user', 'email name');
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    if (action === 'shipped') {
      order.orderStatus = 'shipped';
      order.shippingDetails = { courier, trackingNumber, trackingUrl };
      await order.save();

      await AdminActivityLog.create({
        adminId: auth.adminId, action: 'marked_shipped', entityType: 'order', entityId: order._id,
        details: { courier, trackingNumber },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
      });
      
      // Dispatch email notification asynchronously (catch errors safely)
      const customerEmail = (order.user as any)?.email || order.shippingAddress?.email;
      const customerName = (order.user as any)?.name || order.shippingAddress?.firstName || 'Valued Customer';
      
      if (customerEmail) {
        sendShippingUpdateEmail(customerEmail, customerName, order._id.toString(), trackingNumber || 'N/A', courier || 'Standard Shipping')
          .catch(err => console.error('[Brevo Email Error]', err));
      }
    } 
    else if (action === 'delivered') {
      order.orderStatus = 'delivered';
      await order.save();
      
      await AdminActivityLog.create({
        adminId: auth.adminId, action: 'marked_delivered', entityType: 'order', entityId: order._id,
        details: {},
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
      });
    }
    else if (action === 'refund') {
      // Process Full Refund using the helper utility
      await processRefund(order._id.toString(), reason || 'Admin requested refund');

      await AdminActivityLog.create({
        adminId: auth.adminId, action: 'processed_refund', entityType: 'order', entityId: order._id,
        details: { reason },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
      });
    }
    else if (action === 'cancel') {
      order.orderStatus = 'cancelled';
      await order.save();

      await AdminActivityLog.create({
        adminId: auth.adminId, action: 'cancelled_order', entityType: 'order', entityId: order._id,
        details: { reason },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
      });
    }
    else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('[Admin PATCH Order]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
