import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Advertisement from '@/models/Advertisement';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const advertisements = await Advertisement.find()
      .sort({ priority: -1, createdAt: -1 })
      .populate('linkedCoupon', 'code discountValue discountType')
      .populate('offerId', 'title discountValue')
      .populate('campaignId', 'name')
      .lean();
    
    return NextResponse.json({ success: true, advertisements });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();

    const newAd = await Advertisement.create(body);

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'created_advertisement', entityType: 'advertisement', entityId: newAd._id,
      details: { displayLocation: newAd.displayLocation },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, advertisement: newAd }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
