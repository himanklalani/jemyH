import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import { protect } from '@/lib/protect';

// DELETE /api/user/account — GDPR/CCPA self-serve account deletion
export async function DELETE(req: NextRequest) {
  const auth = await protect(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();

    const userId = auth.user._id;

    // Check for any active (non-delivered, non-cancelled) orders
    const activeOrders = await Order.findOne({
      user: userId,
      orderStatus: { $nin: ['delivered', 'cancelled'] },
    });

    if (activeOrders) {
      return NextResponse.json(
        {
          success: false,
          message: 'You have active orders. Please wait until they are completed or cancelled before deleting your account.',
        },
        { status: 400 }
      );
    }

    // Anonymize instead of hard-delete to preserve order history integrity
    // (common GDPR-compliant approach)
    await User.findByIdAndUpdate(userId, {
      name: 'Deleted User',
      email: `deleted_${userId}@jemy.deleted`,
      password: undefined,
      phone: undefined,
      wishlist: [],
      savedPrescriptions: [],
      resetPasswordOtp: undefined,
      resetPasswordExpires: undefined,
    });

    // Clear their cart
    await Cart.deleteOne({ user: userId });

    // Clear refresh token cookie
    const res = NextResponse.json(
      { success: true, message: 'Your account has been deleted.' },
      { status: 200 }
    );
    res.cookies.set('jemy_refresh', '', { maxAge: 0, path: '/' });
    res.cookies.set('jemy_region', '', { maxAge: 0, path: '/' });

    return res;
  } catch (error) {
    console.error('[account DELETE]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
