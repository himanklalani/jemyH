import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { EyewearProduct, SunglassesProduct, Product } from '@/models/Product';
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
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const stockStatus = searchParams.get('stockStatus'); // 'in_stock' | 'out_of_stock'

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (stockStatus === 'in_stock') {
      query.stock = { $gt: 0 };
    } else if (stockStatus === 'out_of_stock') {
      query.stock = { $eq: 0 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin GET Products]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();

    let newProduct;
    if (body.category === 'eyeglasses') {
      newProduct = await EyewearProduct.create(body);
    } else if (body.category === 'sunglasses') {
      newProduct = await SunglassesProduct.create(body);
    } else {
      newProduct = await Product.create(body); // Perfumes/Others
    }

    // Log the admin action
    await AdminActivityLog.create({
      adminId: auth.adminId,
      action: 'created_product',
      entityType: 'product',
      entityId: newProduct._id,
      details: { name: newProduct.name, category: newProduct.category },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin POST Product]', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
