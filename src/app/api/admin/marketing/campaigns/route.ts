import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Campaign from '@/models/Campaign';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const campaigns = await Campaign.find().sort({ priority: -1, createdAt: -1 }).lean();
    
    return NextResponse.json({ success: true, campaigns });
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
    
    const newCampaign = await Campaign.create(body);
    return NextResponse.json({ success: true, campaign: newCampaign }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
