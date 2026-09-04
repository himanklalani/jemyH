import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/brevo';
import crypto from 'crypto';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const { action } = body; // 'suspend', 'activate', 'force_reset'

    const user = await User.findById(resolvedParams.id);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    if (action === 'suspend') {
      user.isSuspended = true;
      await user.save();
    } else if (action === 'activate') {
      user.isSuspended = false;
      await user.save();
    } else if (action === 'force_reset') {
      // Generate OTP and trigger reset email
      const otp = crypto.randomInt(100000, 999999).toString();
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await user.save();
      
      sendPasswordResetEmail(user.email, otp).catch(e => console.error(e));
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    await AdminActivityLog.create({
      adminId: auth.adminId, action: `user_${action}`, entityType: 'user', entityId: user._id,
      details: { userEmail: user.email },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: `User ${action} successful` });
  } catch (error: any) {
    console.error('[Admin PATCH User]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
