import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Config from '@/models/Config';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

// Fetch all configurations
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const configs = await Config.find({}).lean();
    
    return NextResponse.json({ success: true, configs });
  } catch (error: any) {
    console.error('[Admin GET Config]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// Update a specific configuration by key
export async function PATCH(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, message: 'Key and value are required' }, { status: 400 });
    }

    const updatedConfig = await Config.findOneAndUpdate(
      { key },
      { value, updatedBy: auth.adminId },
      { new: true, upsert: true }
    );

    // Log the configuration change
    await AdminActivityLog.create({
      adminId: auth.adminId,
      action: 'updated_config',
      entityType: 'inventory', // Not perfect but general category
      details: { key, newValue: value },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error('[Admin PATCH Config]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
