import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin route protection & redirects
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/admin')) {
    const jwtSecret = process.env.JWT_SECRET || '';
    const token = request.cookies.get('admin_session')?.value || request.cookies.get('jemy_token')?.value;

    if (token && jwtSecret) {
      const payload = await verifyJwtEdge(token, jwtSecret);
      if (!payload || payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // 2. Region handling
  const cookieOverride = request.cookies.get('jemy_region')?.value;
  // request.geo is injected by Vercel's edge runtime (not in the standard type definition)
  const edgeCountry = (request as any).geo?.country as string | undefined;
  
  let region = cookieOverride;
  if (!region) {
    if (edgeCountry === 'US') {
      region = 'US';
    } else if (edgeCountry === 'IN') {
      region = 'IN';
    }
  }

  // Fallback to IN if we couldn't resolve
  const resolvedRegion = region ?? 'IN';

  const response = NextResponse.next();
  
  // Only set the cookie if it wasn't already set or if it's changing
  if (cookieOverride !== resolvedRegion) {
    response.cookies.set('jemy_region', resolvedRegion, { maxAge: 60 * 60 * 24 * 30 });
  }

  // Generate a guest session ID if one doesn't exist (for cart tracking)
  const sessionId = request.cookies.get('jemy_session')?.value;
  if (!sessionId) {
    response.cookies.set('jemy_session', crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
