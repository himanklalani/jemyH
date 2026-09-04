import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('jemy_refresh')?.value;

    if (!refreshToken) {
      return NextResponse.json({ success: false, message: 'No refresh token' }, { status: 401 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Refresh token invalid or expired' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(decoded.id).select('_id email role');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 401 });
    }

    const newAccessToken = generateAccessToken(String(user._id), user.role);

    return NextResponse.json({ success: true, accessToken: newAccessToken }, { status: 200 });
  } catch (error) {
    console.error('[refresh]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
