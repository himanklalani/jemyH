import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Category from '@/models/Category';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();
    const categories = await Category.find().sort({ displayOrder: 1, createdAt: -1 });
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();
    
    // Auto-generate slug if missing
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const category = await Category.create(body);
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
