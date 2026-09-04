/**
 * Server-side GeoIP fallback.
 * Used when the edge platform does NOT provide geo headers (local dev, self-hosted).
 * Results are cached in Redis (if available) to avoid hammering the API on every request.
 */

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const FALLBACK_REGION = 'IN';

async function getRedis() {
  try {
    const { Redis } = await import('@upstash/redis');
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    return null;
  }
}

export async function resolveRegionFromIP(ip: string): Promise<'US' | 'IN'> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    // Local dev — return fallback silently
    return FALLBACK_REGION;
  }

  const cacheKey = `jemy_geo_${ip}`;

  // Try Redis cache first
  const redis = await getRedis();
  if (redis) {
    const cached = await redis.get<string>(cacheKey);
    if (cached === 'US' || cached === 'IN') return cached;
  }

  // Call GeoIP API
  try {
    const apiKey = process.env.GEOIP_FALLBACK_API_KEY;
    if (!apiKey) {
      console.warn('[geoFallback] GEOIP_FALLBACK_API_KEY not set — defaulting to IN');
      return FALLBACK_REGION;
    }

    const res = await fetch(`https://api.ipapi.com/${ip}?access_key=${apiKey}&fields=country_code`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`GeoIP API error: ${res.status}`);

    const data = await res.json();
    const region: 'US' | 'IN' = data.country_code === 'US' ? 'US' : 'IN';

    // Cache the result
    if (redis) {
      await redis.set(cacheKey, region, { ex: CACHE_TTL_SECONDS });
    }

    return region;
  } catch (err) {
    console.error('[geoFallback] Failed to resolve region from IP:', err);
    return FALLBACK_REGION;
  }
}
