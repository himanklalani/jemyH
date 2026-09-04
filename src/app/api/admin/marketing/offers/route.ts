import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Offer from '@/models/Offer';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const offers = await Offer.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, offers });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();
    const newOffer = await Offer.create(body);
    return NextResponse.json({ success: true, offer: newOffer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
