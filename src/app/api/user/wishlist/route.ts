import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { protect } from '@/lib/protect';

// GET /api/user/wishlist
export async function GET(req: NextRequest) {
  const auth = await protect(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const user = await User.findById(auth.user._id).populate('wishlist', 'name slug images pricing');
    return NextResponse.json({ success: true, wishlist: user?.wishlist ?? [] }, { status: 200 });
  } catch (error) {
    console.error('[wishlist GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST /api/user/wishlist — Add product
export async function POST(req: NextRequest) {
  const auth = await protect(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ success: false, message: 'productId is required' }, { status: 400 });
    }

    await dbConnect();
    await User.findByIdAndUpdate(auth.user._id, { $addToSet: { wishlist: productId } });
    return NextResponse.json({ success: true, message: 'Added to wishlist' }, { status: 200 });
  } catch (error) {
    console.error('[wishlist POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/user/wishlist — Remove product
export async function DELETE(req: NextRequest) {
  const auth = await protect(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ success: false, message: 'productId is required' }, { status: 400 });
    }

    await dbConnect();
    await User.findByIdAndUpdate(auth.user._id, { $pull: { wishlist: productId } });
    return NextResponse.json({ success: true, message: 'Removed from wishlist' }, { status: 200 });
  } catch (error) {
    console.error('[wishlist DELETE]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT /api/user/wishlist — Toggle (add if absent, remove if present)
export async function PUT(req: NextRequest) {
  const auth = await protect(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ success: false, message: 'productId is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Check if the product is already in the wishlist
    const userWithProduct = await User.findOne({ _id: auth.user._id, wishlist: productId });
    const isInWishlist = !!userWithProduct;

    if (isInWishlist) {
      await User.findByIdAndUpdate(auth.user._id, { $pull: { wishlist: productId } });
    } else {
      await User.findByIdAndUpdate(auth.user._id, { $addToSet: { wishlist: productId } });
    }

    return NextResponse.json(
      { success: true, inWishlist: !isInWishlist, message: isInWishlist ? 'Removed' : 'Added' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[wishlist PUT]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
