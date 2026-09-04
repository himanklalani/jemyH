import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const { stockAdjustment, reason } = body; 

    if (typeof stockAdjustment !== 'number' || !reason) {
      return NextResponse.json({ success: false, message: 'stockAdjustment (number) and reason (string) are required' }, { status: 400 });
    }

    const product = await Product.findById(resolvedParams.id);
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    const oldStock = product.stock;
    const newStock = Math.max(0, oldStock + stockAdjustment); // Prevent negative stock

    product.stock = newStock;
    await product.save();

    // The critical manual inventory audit log
    await AdminActivityLog.create({
      adminId: auth.adminId,
      action: 'manual_stock_adjustment',
      entityType: 'inventory',
      entityId: product._id,
      details: {
        productName: product.name,
        oldStock,
        newStock,
        adjustment: stockAdjustment,
        reason
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, product, message: `Stock adjusted by ${stockAdjustment}` });
  } catch (error: any) {
    console.error('[Admin PATCH Stock]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
