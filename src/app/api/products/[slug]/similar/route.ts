import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';

    await dbConnect();

    // Find the original product first
    const originalProduct = await Product.findOne({ slug }).lean();
    if (!originalProduct) {
      return NextResponse.json({ success: false, message: 'Original product not found' }, { status: 404 });
    }

    // Extract matchable features
    const { _id, category, frameShape, frameColor, frameSize, aesthetics } = originalProduct;

    // Build similarity conditions
    const orConditions: any[] = [];
    
    // Exact shape match (highest relevance)
    if (frameShape) {
      orConditions.push({ frameShape });
    }
    
    // Exact color match
    if (frameColor) {
      orConditions.push({ frameColor });
    }
    
    // Shared aesthetics
    if (aesthetics && aesthetics.length > 0) {
      orConditions.push({ aesthetics: { $in: aesthetics } });
    }

    const query: any = {
      _id: { $ne: _id },
      category // Must be same category (sunglasses vs eyeglasses)
    };

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // Find similar products
    const similarProducts = await Product.find(query)
      .select(`name slug images category pricing stock requiresPrescription`)
      .limit(8)
      .lean();

    // If we didn't find enough, backfill with same category
    if (similarProducts.length < 4) {
      const existingIds = similarProducts.map(p => p._id);
      existingIds.push(_id);
      
      const backfill = await Product.find({
        _id: { $nin: existingIds },
        category
      })
        .select(`name slug images category pricing stock requiresPrescription`)
        .limit(8 - similarProducts.length)
        .lean();
        
      similarProducts.push(...backfill);
    }

    return NextResponse.json({ success: true, products: similarProducts });
  } catch (error) {
    console.error('[similar products GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
