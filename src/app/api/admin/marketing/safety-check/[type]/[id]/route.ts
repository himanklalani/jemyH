import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Advertisement from '@/models/Advertisement';
import { checkAdminAuth } from '@/lib/auth';

/** Check if a campaign/coupon is linked to any active ads before deletion */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const { type, id } = await params;

    let query: Record<string, any> = {};
    if (type === 'campaign')  query = { campaignId: id };
    if (type === 'coupon')    query = { linkedCoupon: id };
    if (type === 'offer')     query = { offerId: id };

    const linkedAds = await Advertisement.find({ ...query, isActive: true })
      .select('title displayLocation')
      .lean();

    return NextResponse.json({
      success: true,
      safe: linkedAds.length === 0,
      linkedCount: linkedAds.length,
      linkedAds,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
