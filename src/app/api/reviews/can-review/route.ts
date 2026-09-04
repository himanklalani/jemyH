import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Review from '@/models/Review';
import { checkAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1. Check Authentication
    const auth = await checkAuth(req);
    if (auth.error) {
      return NextResponse.json({ 
        success: true, 
        canReview: false, 
        reason: 'unauthenticated', 
        message: 'Please login to your account to review' 
      });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, message: 'productId is required' }, { status: 400 });
    }

    await dbConnect();

    // 2. Check if user has purchased this product
    const hasPurchased = await Order.exists({
      user: auth.userId,
      paymentStatus: { $in: ['paid', 'pending'] }, // pending might apply to COD
      orderStatus: { $nin: ['cancelled', 'refunded'] },
      'items.product': productId
    });

    if (!hasPurchased) {
      return NextResponse.json({ 
        success: true, 
        canReview: false, 
        reason: 'not_purchased', 
        message: 'You must purchase this item to review it' 
      });
    }

    // 3. Check if user already reviewed this product
    const alreadyReviewed = await Review.exists({
      user: auth.userId,
      product: productId
    });

    if (alreadyReviewed) {
      return NextResponse.json({ 
        success: true, 
        canReview: false, 
        reason: 'already_reviewed', 
        message: 'You have already reviewed this product' 
      });
    }

    return NextResponse.json({ success: true, canReview: true, reason: null });
  } catch (error: any) {
    console.error('[Can-Review GET]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
