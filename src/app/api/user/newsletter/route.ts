import { NextRequest, NextResponse } from 'next/server';

// POST /api/user/newsletter — basic newsletter signup stub
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });
    // TODO: Integrate with Brevo contact list
    console.log('[newsletter] Signup:', email);
    return NextResponse.json({ success: true, message: 'Subscribed!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
