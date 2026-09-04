import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Coupon from '@/models/Coupon';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();

    const coupon = await Coupon.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'updated_coupon', entityType: 'coupon', entityId: coupon._id,
      details: { code: coupon.code },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;

    const coupon = await Coupon.findByIdAndDelete(resolvedParams.id);
    if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'deleted_coupon', entityType: 'coupon', entityId: coupon._id,
      details: { code: coupon.code },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
