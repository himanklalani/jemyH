import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge-compatible JWT verification using the standard Web Crypto API.
 * Validates HMAC SHA-256 signatures and expiration without Node.js dependencies.
 */
async function verifyJwtEdge(token: string, secret: string): Promise<{ id: string; role: string; exp?: number } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert base64url to Uint8Array
    const sigStr = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (sigStr.length % 4)) % 4;
    const paddedSig = sigStr + '='.repeat(pad);
    const binarySig = Uint8Array.from(atob(paddedSig), c => c.charCodeAt(0));

    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, data);
    if (!isValid) return null;

    // Decode payload
    const payloadStr = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padP = (4 - (payloadStr.length % 4)) % 4;
    const paddedPayload = payloadStr + '='.repeat(padP);
    const payload = JSON.parse(atob(paddedPayload));

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Never allow access to /admin/login - redirect directly to /login
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. Protect all other /admin routes
  const jwtSecret = process.env.JWT_SECRET || '';
  const token = req.cookies.get('admin_session')?.value || req.cookies.get('jemy_token')?.value;

  if (token && jwtSecret) {
    const payload = await verifyJwtEdge(token, jwtSecret);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // If no cookie is present, allow AdminAuthGuard on client to check localStorage session
  // AdminAuthGuard will immediately redirect to /login if the user is not a verified admin in database
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
