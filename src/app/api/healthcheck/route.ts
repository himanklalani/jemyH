import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import { Redis } from '@upstash/redis';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'disconnected';
  let redisStatus = 'skipped';

  try {
    // 1. Check MongoDB
    await dbConnect();
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'error';

    // 2. Check Redis (if configured)
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    if (redisUrl && !redisUrl.includes('your-upstash-url')) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.ping();
      redisStatus = 'connected';
    }

    const isHealthy = dbStatus === 'connected' && (redisStatus === 'connected' || redisStatus === 'skipped');
    const responseTime = Date.now() - start;

    return NextResponse.json(
      {
        success: isHealthy,
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTimeMs: responseTime,
        services: {
          database: dbStatus,
          redis: redisStatus
        }
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: String(error)
      },
      { status: 500 }
    );
  }
}
