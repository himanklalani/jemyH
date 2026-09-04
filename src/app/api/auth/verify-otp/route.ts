import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import TempUser from '@/models/TempUser';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    await dbConnect();

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return NextResponse.json(
        { success: false, message: 'OTP expired or not found. Please register again.' },
        { status: 400 }
      );
    }

    if (tempUser.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    // Promote TempUser → User
    const newUser = await User.create({
      email: tempUser.email,
      password: tempUser.password,
      phone: tempUser.phone,
      role: 'user',
    });

    // Auto-generate FIRST10 coupon for the new user (first-order incentive)
    const couponCode = process.env.FIRST_ORDER_COUPON_CODE ?? 'FIRST10';
    const existingCoupon = await Coupon.findOne({ code: couponCode });
    if (!existingCoupon) {
      await Coupon.create({
        code: couponCode,
        isActive: true,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 days
        usageLimit: 1000,
        perUserLimit: 1,
        usageCount: 0,
        minOrderValueUS: 0,
        minOrderValueIN: 0,
        discountType: 'percentage',
        discountValue: 10,
      });
    }

    // Delete TempUser
    await TempUser.deleteOne({ email });

    // Issue tokens
    const accessToken = generateAccessToken(String(newUser._id), newUser.role);
    const refreshToken = generateRefreshToken(String(newUser._id));

    const res = NextResponse.json(
      {
        success: true,
        message: 'Account verified successfully',
        user: { id: newUser._id, email: newUser.email, role: newUser.role },
        accessToken,
        coupon: couponCode,
      },
      { status: 201 }
    );

    res.cookies.set('jemy_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('[verify-otp]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
