import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function generateAccessToken(userId: string, role: string) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(userId: string) {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not defined');
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string; iat: number; exp: number };
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not defined');
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string; iat: number; exp: number };
  } catch (error) {
    return null;
  }
}

// Admin Protection Helper for Next.js API Routes
export async function checkAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return { error: NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 }) };
  }

  if (decoded.role !== 'admin') {
    return { error: NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 }) };
  }

  await dbConnect();
  const user = await User.findById(decoded.id).select('role').lean();
  
  if (!user || user.role !== 'admin') {
    return { error: NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 }) };
  }

  return { adminId: decoded.id };
}

// Generic User Protection Helper for Next.js API Routes
export async function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return { error: NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 }) };
  }

  return { userId: decoded.id, role: decoded.role };
}

// Helper to identify the user (logged in or guest session)
export async function getCartIdentifier(req: NextRequest) {
  let userId = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (decoded) userId = decoded.id;
  }

  const sessionId = req.cookies.get('jemy_session')?.value;
  const region: 'US' | 'IN' = req.cookies.get('jemy_region')?.value === 'US' ? 'US' : 'IN';
  const currency = region === 'US' ? 'USD' : 'INR';
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  return { userId, sessionId, region, currency, ipAddress };
}
