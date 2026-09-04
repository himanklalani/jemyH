import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Advertisement from '@/models/Advertisement';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();

    const ad = await Advertisement.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    if (!ad) return NextResponse.json({ success: false, message: 'Advertisement not found' }, { status: 404 });

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'updated_advertisement', entityType: 'advertisement', entityId: ad._id,
      details: { displayLocation: ad.displayLocation },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, advertisement: ad });
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

    const ad = await Advertisement.findByIdAndDelete(resolvedParams.id);
    if (!ad) return NextResponse.json({ success: false, message: 'Advertisement not found' }, { status: 404 });

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'deleted_advertisement', entityType: 'advertisement', entityId: ad._id,
      details: { displayLocation: ad.displayLocation },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: 'Advertisement deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
