import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';
import { applyRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    // Build the query
    const query: any = { isPublished: { $ne: false } };

    // Filters
    const category = searchParams.get('category');
    if (category) query.category = category;

    const gender = searchParams.get('gender');
    if (gender) query.gender = gender;

    const requiresPrescription = searchParams.get('requiresPrescription');
    if (requiresPrescription) query.requiresPrescription = requiresPrescription === 'true';

    const shape = searchParams.get('shape');
    if (shape) {
      // Shape can be comma separated
      const shapes = shape.split(',').map(s => s.trim());
      query.frameShape = { $in: shapes.map(s => new RegExp(`^${s}$`, 'i')) };
    }

    const material = searchParams.get('material');
    if (material) {
      const materials = material.split(',').map(s => s.trim());
      query.frameMaterial = { $in: materials.map(s => new RegExp(`^${s}$`, 'i')) };
    }

    const size = searchParams.get('size');
    if (size) {
      const sizes = size.split(',').map(s => s.trim());
      query.frameSize = { $in: sizes.map(s => new RegExp(`^${s}$`, 'i')) };
    }

    // Price range specific to the current region
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    if (minPrice || maxPrice) {
      query[`pricing.${region}.amount`] = {};
      if (minPrice) query[`pricing.${region}.amount`].$gte = parseFloat(minPrice);
      if (maxPrice) query[`pricing.${region}.amount`].$lte = parseFloat(maxPrice);
    }

    let sortObj: any = { createdAt: -1 };
    const sortParam = searchParams.get('sort');
    if (sortParam === 'price_asc') {
      sortObj = { [`pricing.${region}.amount`]: 1 };
    } else if (sortParam === 'price_desc') {
      sortObj = { [`pricing.${region}.amount`]: -1 };
    } else if (sortParam === 'featured') {
      sortObj = { sales: -1 }; // Assuming best sellers are featured
    }

    await dbConnect();

    const [products, total] = await Promise.all([
      Product.find(query)
        .select(`name slug images category pricing.${region} stock requiresPrescription`)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[products GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
