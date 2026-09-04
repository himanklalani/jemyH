import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Lazily initialise so the module doesn't crash in environments without the env vars
let rateLimiters: Record<string, Ratelimit> | null = null;

function getRateLimiters() {
  if (rateLimiters) return rateLimiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url.includes('your-upstash-url') || token.includes('your_upstash')) {
    console.warn('[rateLimit] Upstash env vars missing or placeholder — rate limiting is disabled');
    return null;
  }

  const redis = new Redis({
    url,
    token,
  });

  rateLimiters = {
    // Auth routes: 10 attempts per 10 minutes
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'),
      prefix: 'jemy_rl_auth',
    }),
    // OTP requests: 3 per 10 minutes (prevent OTP flooding)
    otp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '10 m'),
      prefix: 'jemy_rl_otp',
    }),
    // Coupon validation: 20 per minute (prevent farming)
    coupon: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      prefix: 'jemy_rl_coupon',
    }),
  };

  return rateLimiters;
}

type LimiterKey = 'auth' | 'otp' | 'coupon';

/**
 * Apply rate limiting to an API route.
 * Returns a 429 NextResponse if the limit is exceeded, or null if allowed.
 */
export async function applyRateLimit(
  req: NextRequest,
  limiterKey: LimiterKey
): Promise<NextResponse | null> {
  const limiters = getRateLimiters();
  if (!limiters) return null; // gracefully skip if not configured

  const limiter = limiters[limiterKey];
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';

  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }
  } catch (err) {
    console.warn('[rateLimit] Error executing rate limiter, bypassing:', err);
    return null;
  }

  return null;
}

