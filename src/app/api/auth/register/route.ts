import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import TempUser from '@/models/TempUser';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rateLimit';
import { sendOTPEmail } from '@/lib/brevo';

export async function POST(req: NextRequest) {
  // Rate limit registration requests
  const limited = await applyRateLimit(req, 'otp');
  if (limited) return limited;

  try {
    const { name, email, password, phone } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await dbConnect();

    // Check if already a verified user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const brevoKey = process.env.BREVO_API_KEY;
    const isBrevoConfigured = Boolean(
      brevoKey &&
      !brevoKey.includes('placeholder') &&
      brevoKey !== 'your_brevo_api_key'
    );

    // If Brevo email is configured, attempt sending email OTP
    if (isBrevoConfigured) {
      try {
        const otp = crypto.randomInt(100000, 999999).toString();

        await TempUser.findOneAndUpdate(
          { email },
          { email, password: hashedPassword, phone, otp, attempts: 0, createdAt: new Date() },
          { upsert: true, new: true }
        );

        await sendOTPEmail(email, otp);

        return NextResponse.json(
          {
            success: true,
            requiresOtp: true,
            email,
            message: 'OTP sent to your email. Valid for 10 minutes.',
          },
          { status: 200 }
        );
      } catch (mailError) {
        console.warn('[register] Brevo delivery failed, proceeding with direct verified registration:', mailError);
        // Fall through to direct verified sign-up so the user is never blocked
      }
    }

    // Direct verified sign-up (when email provider is not yet configured or delivery fails)
    const newUser = await User.create({
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      phone,
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

    const accessToken = generateAccessToken(String(newUser._id), newUser.role);
    const refreshToken = generateRefreshToken(String(newUser._id));

    const res = NextResponse.json(
      {
        success: true,
        requiresOtp: false,
        user: { id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role },
        accessToken,
        coupon: couponCode,
        message: 'Account created successfully',
      },
      { status: 201 }
    );

    res.cookies.set('jemy_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    res.cookies.set('jemy_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
