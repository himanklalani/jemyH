import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { applyRateLimit } from '@/lib/rateLimit';

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'Email, OTP and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user || !user.resetPasswordOtp) {
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
    }

    if (user.resetPasswordOtp !== otp) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      if (user.resetPasswordAttempts >= 5) {
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        user.resetPasswordAttempts = 0;
        await user.save();
        return NextResponse.json(
          { success: false, message: 'Too many failed attempts. Please request a new password reset.' },
          { status: 429 }
        );
      }
      await user.save();
      const remaining = 5 - user.resetPasswordAttempts;
      return NextResponse.json(
        { success: false, message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('[reset-password]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
