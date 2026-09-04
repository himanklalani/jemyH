import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';

    await dbConnect();

    const product = await Product.findOne({ slug })
      .select(`-pricing.${region === 'US' ? 'IN' : 'US'}`) // Exclude the other region's pricing
      .lean();

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('[product slug GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
