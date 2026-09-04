import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Campaign from '@/models/Campaign';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();

    const updated = await Campaign.findByIdAndUpdate(resolvedParams.id, body, { new: true }).lean();
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;

    // Optional: Warn or prevent deletion if linked to ads/merchandising
    const deleted = await Campaign.findByIdAndDelete(resolvedParams.id);
    if (!deleted) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
