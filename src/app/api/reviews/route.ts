import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Review from '@/models/Review';
import Order from '@/models/Order';
import { checkAuth } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const query: any = {};
    if (productId) query.product = productId;

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(query).populate('user', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, reviews, pagination: { total, page, limit } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Authentication Check
    const auth = await checkAuth(req);
    if (auth.error) return NextResponse.json({ success: false, message: 'Please login to your account to review' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { productId, rating, title, comment, images } = body;

    if (!productId || !rating || !title || !comment) {
      return NextResponse.json({ success: false, message: 'Missing required review fields' }, { status: 400 });
    }

    // 2. Strict Purchase Check (Including past guest orders)
    const userObj = await User.findById(auth.userId);
    const hasPurchased = await Order.exists({
      $or: [{ user: auth.userId }, { customerEmail: userObj?.email }],
      paymentStatus: { $in: ['paid', 'pending'] }, // COD is 'pending' payment
      orderStatus: { $nin: ['cancelled', 'refunded'] },
      'items.product': productId
    });

    if (!hasPurchased) {
      return NextResponse.json({ success: false, message: 'You must purchase this item to review it' }, { status: 403 });
    }

    // 3. Create Review (Genuine by default since verified)
    const newReview = await Review.create({
      product: productId,
      user: auth.userId,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedBuyer: true // Auto true since we checked Order table
    });

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'You have already reviewed this product' }, { status: 400 });
    }
    console.error('[POST Review]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
