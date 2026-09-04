import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import TempUser from '@/models/TempUser';
import User from '@/models/User';
import { applyRateLimit } from '@/lib/rateLimit';
import { sendOTPEmail } from '@/lib/brevo';

export async function POST(req: NextRequest) {
  // Rate limit OTP requests
  const limited = await applyRateLimit(req, 'otp');
  if (limited) return limited;

  try {
    const { email, password, phone } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if already a verified user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Upsert TempUser (handles re-registration attempts)
    await TempUser.findOneAndUpdate(
      { email },
      { email, password: hashedPassword, phone, otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send OTP via Brevo
    await sendOTPEmail(email, otp);

    return NextResponse.json({ success: true, message: 'OTP sent to your email. Valid for 10 minutes.' }, { status: 200 });
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
