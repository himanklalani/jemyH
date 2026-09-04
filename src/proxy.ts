import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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
