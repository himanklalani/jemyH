import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';
import { sendPrescriptionStatusEmail } from '@/lib/brevo';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string, itemId: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const { status, rejectionReason } = body; // 'verified', 'rejected', 'passive-verified'

    if (!['verified', 'rejected', 'passive-verified'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const order = await Order.findById(resolvedParams.orderId);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const item = order.items.id(resolvedParams.itemId);
    if (!item || !item.prescription) {
      return NextResponse.json({ success: false, message: 'Prescription item not found in order' }, { status: 404 });
    }

    item.prescription.verificationStatus = status;
    item.prescription.verifiedBy = auth.adminId;
    item.prescription.verifiedAt = new Date();
    // In a real system, you might save adminNotes to the prescription object if the schema supports it.
    
    await order.save();

    await AdminActivityLog.create({
      adminId: auth.adminId, 
      action: `prescription_${status}`, 
      entityType: 'prescription', 
      entityId: order._id, // Logging against the order
      details: { itemId: item._id, rejectionReason },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    // Trigger Brevo email to customer
    if (['verified', 'rejected'].includes(status)) {
      const customerEmail = (order.user as any)?.email || order.shippingAddress?.email;
      const customerName = (order.user as any)?.name || order.shippingAddress?.firstName || 'Valued Customer';
      if (customerEmail) {
        sendPrescriptionStatusEmail(customerEmail, customerName, status as 'verified' | 'rejected', order._id.toString())
          .catch(err => console.error('[Brevo Prescription Email Error]', err));
      }
    }

    return NextResponse.json({ success: true, message: `Prescription marked as ${status}` });
  } catch (error: any) {
    console.error('[Admin PATCH Prescription]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
