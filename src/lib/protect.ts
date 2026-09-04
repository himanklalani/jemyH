import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './auth';
import dbConnect from './mongoose';
import User from '@/models/User';

export type AuthenticatedRequest = NextRequest & {
  user?: any;
};

/**
 * Verifies the Bearer token and attaches the user to the request context.
 * Returns a NextResponse error if invalid, or null if successful.
 */
export async function protect(req: NextRequest): Promise<{ user: any } | NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Not authorized, no token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Not authorized, token invalid or expired' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(decoded.id).select('-password -resetPasswordOtp');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 401 });
    }

    return { user };
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error in auth middleware' }, { status: 500 });
  }
}

/**
 * Role-based access control middleware.
 * Must be chained AFTER protect().
 * Usage: const auth = await protect(req); if (auth instanceof NextResponse) return auth;
 *        const roleCheck = requireRole(['admin'], auth.user); if (roleCheck) return roleCheck;
 */
export function requireRole(allowedRoles: string[], user: any): NextResponse | null {
  if (!user || !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { success: false, message: `Access denied. Required role: ${allowedRoles.join(' or ')}` },
      { status: 403 }
    );
  }
  return null;
}
