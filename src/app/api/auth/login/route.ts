import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth');
  if (limited) return limited;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    const res = NextResponse.json(
      {
        success: true,
        user: { id: user._id, email: user.email, name: user.name, role: user.role, region: user.region },
        accessToken,
      },
      { status: 200 }
    );

    res.cookies.set('jemy_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('[login]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
