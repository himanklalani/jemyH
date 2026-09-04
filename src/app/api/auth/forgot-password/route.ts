import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/brevo';
import { applyRateLimit } from '@/lib/rateLimit';

// POST /api/auth/forgot-password — Send reset OTP
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'otp');
  if (limited) return limited;

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    // Always return success to prevent email enumeration attacks
    const user = await User.findOne({ email });
    if (user) {
      const otp = crypto.randomInt(100000, 999999).toString();
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await user.save();
      await sendPasswordResetEmail(email, otp);
    }

    return NextResponse.json(
      { success: true, message: 'If that email exists, a reset OTP has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[forgot-password]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
