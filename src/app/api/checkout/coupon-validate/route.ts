import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Coupon from '@/models/Coupon';

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal } = await req.json();
    const region = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';
    
    if (!code || !cartTotal) {
      return NextResponse.json({ success: false, message: 'Code and cartTotal required' }, { status: 400 });
    }

    await dbConnect();
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid coupon code' }, { status: 404 });
    }

    // Validation Rules
    if (!coupon.isActive) {
      return NextResponse.json({ success: false, message: 'Coupon is not active' }, { status: 400 });
    }
    
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json({ success: false, message: 'Coupon has expired' }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ success: false, message: 'Coupon usage limit reached' }, { status: 400 });
    }

    const minOrderValue = coupon.minOrderValue?.[region as 'US' | 'IN'];
    if (minOrderValue && cartTotal < minOrderValue) {
      const currency = region === 'US' ? '$' : '₹';
      return NextResponse.json({ 
        success: false, 
        message: `Minimum order value for this coupon is ${currency}${minOrderValue}` 
      }, { status: 400 });
    }

    // Success - Return the discount type and value so frontend can compute
    return NextResponse.json({ 
      success: true, 
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
    
  } catch (error) {
    console.error('[coupon-validate POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
