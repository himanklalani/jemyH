import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Category from '@/models/Category';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();
    
    if (body.name && !body.slug) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const category = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!category) return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();
    const category = await Category.findByIdAndDelete(id);
    if (!category) return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
