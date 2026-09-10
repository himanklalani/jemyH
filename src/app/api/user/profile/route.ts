import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { protect } from '@/lib/protect';

// GET /api/user/profile
export async function GET(req: NextRequest) {
  const auth = await protect(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const user = await User.findById(auth.user._id).select('-password').lean();
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const res = NextResponse.json({ success: true, user });

    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.cookies.get('jemy_token')?.value;
    if (token) {
      res.cookies.set('jemy_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      if (user.role === 'admin') {
        res.cookies.set('admin_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
      }
    }

    return res;
  } catch (error) {
    console.error('[profile GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
