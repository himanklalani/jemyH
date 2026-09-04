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
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[profile GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
