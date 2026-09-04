import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import RMA from '@/models/RMA';
import { Product } from '@/models/Product';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

// PATCH update RMA request status and execute restocking decision
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const { status, adminNotes, actionTaken } = body; // status: 'approved'|'received'|'rejected'|'processed', actionTaken: 'restock'|'write-off'

    const rma = await RMA.findById(resolvedParams.id);
    if (!rma) return NextResponse.json({ success: false, message: 'RMA request not found' }, { status: 404 });

    if (status) rma.status = status;
    if (adminNotes) rma.adminNotes = adminNotes;

    // Handle restocking logic if items are received and approved for restock
    if (actionTaken === 'restock' && rma.status !== 'processed') {
      for (const item of rma.items) {
        item.actionTaken = 'restock';
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity, sales: -item.quantity }
        });
      }
    } else if (actionTaken === 'write-off') {
      for (const item of rma.items) {
        item.actionTaken = 'write-off';
      }
    }

    await rma.save();

    await AdminActivityLog.create({
      adminId: auth.adminId,
      action: `rma_${rma.status}`,
      entityType: 'order',
      entityId: rma.orderId,
      details: { rmaId: rma._id, actionTaken, adminNotes },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, rma });
  } catch (error: any) {
    console.error('[Admin PATCH RMA]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
