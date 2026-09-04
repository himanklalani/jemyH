import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Newsletter from '@/models/Newsletter';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();

    const subscribers = await Newsletter.find({ subscribed: true }).sort({ createdAt: -1 }).lean();

    // Generate CSV string
    const headers = ['Email', 'Region', 'Subscribed At'];
    const rows = subscribers.map((sub: any) => [
      `"${sub.email}"`,
      `"${sub.region || 'US'}"`,
      `"${new Date(sub.createdAt).toISOString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=newsletter_subscribers.csv',
      },
    });
  } catch (error: any) {
    console.error('[Export Newsletter]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
