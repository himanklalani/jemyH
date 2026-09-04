import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';

export async function GET() {
  try {
    await dbConnect();
    const addons = await Product.find({ isAddon: true }).select('name slug images pricing stock');
    return NextResponse.json({ success: true, addons });
  } catch (error) {
    console.error('[addons GET]', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
