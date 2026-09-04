import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';
    
    await dbConnect();

    // Fetch top 12 bestsellers with stock > 0
    const bestsellers = await Product.find({ stock: { $gt: 0 } })
      .sort({ sales: -1 })
      .limit(12)
      .select(`name slug images category pricing.${region} stock requiresPrescription`)
      .lean();

    // Setup cache control for edge caching
    const res = NextResponse.json({ success: true, products: bestsellers });
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return res;
  } catch (error) {
    console.error('[products bestsellers]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
