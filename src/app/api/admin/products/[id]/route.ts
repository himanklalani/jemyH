import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;

    const product = await Product.findById(resolvedParams.id).lean();
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('[Admin GET Product]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();

    let type = 'Product';
    if (body.category === 'eyeglasses') type = 'EyewearProduct';
    if (body.category === 'sunglasses') type = 'SunglassesProduct';

    // We must use a raw collection update to bypass Mongoose's strict discriminator immutability
    const updateResult = await Product.collection.findOneAndUpdate(
      { _id: new (require('mongoose').Types.ObjectId)(resolvedParams.id) },
      { $set: { ...body, __t: type, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    const product = updateResult;
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    // Log the update
    await AdminActivityLog.create({
      adminId: auth.adminId,
      action: 'updated_product',
      entityType: 'product',
      entityId: product._id,
      details: { updatedFields: Object.keys(body) },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('[Admin PATCH Product]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;

    const product = await Product.findByIdAndDelete(resolvedParams.id);
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    // Log the deletion
    await AdminActivityLog.create({
      adminId: auth.adminId,
      action: 'deleted_product',
      entityType: 'product',
      entityId: product._id,
      details: { name: product.name },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('[Admin DELETE Product]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
