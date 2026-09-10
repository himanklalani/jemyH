import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear all authentication and session cookies
  res.cookies.set('jemy_token', '', { maxAge: 0, path: '/' });
  res.cookies.set('jemy_refresh', '', { maxAge: 0, path: '/' });
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' });

  return res;
}
