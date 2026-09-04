import { NextResponse } from 'next/server';

// GET /api/healthcheck
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      region: process.env.NEXT_PUBLIC_SITE_URL ?? 'jemy.shop',
    },
    { status: 200 }
  );
}
