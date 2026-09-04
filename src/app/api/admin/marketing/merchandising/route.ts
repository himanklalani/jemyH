import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Merchandising from '@/models/Merchandising';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    // Use query param ?type=xyz if present
    const type = req.nextUrl.searchParams.get('type');
    const query = type ? { type } : {};

    const items = await Merchandising.find(query).sort({ priority: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, items });
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
    const newItem = await Merchandising.create(body);
    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
