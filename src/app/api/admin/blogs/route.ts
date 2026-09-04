import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Blog from '@/models/Blog';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;
    
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status'); // published | draft
    const search = searchParams.get('search');

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Blog.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      blogs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
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

    const newBlog = await Blog.create({ 
      ...body, 
      author: body.author || { name: 'JEMY Editors' }
    });

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'created_blog', entityType: 'blog', entityId: newBlog._id,
      details: { title: newBlog.title },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, blog: newBlog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
