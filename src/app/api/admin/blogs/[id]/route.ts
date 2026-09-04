import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Blog from '@/models/Blog';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();

    const blog = await Blog.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'updated_blog', entityType: 'blog', entityId: blog._id,
      details: { title: blog.title },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, blog });
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

    const blog = await Blog.findByIdAndDelete(resolvedParams.id);
    if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'deleted_blog', entityType: 'blog', entityId: blog._id,
      details: { title: blog.title },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: 'Blog deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
