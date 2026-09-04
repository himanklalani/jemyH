import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();

    const products = await Product.find().lean();

    // Generate CSV string
    const headers = ['ID', 'Name', 'Category', 'Stock', 'Sales', 'Price (US)', 'Price (IN)', 'Requires Rx'];
    const rows = products.map((p: any) => [
      `"${p._id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.stock,
      p.sales,
      p.pricing?.US?.amount || 0,
      p.pricing?.IN?.amount || 0,
      p.requiresPrescription ? 'Yes' : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=jemy_products_catalog.csv',
      },
    });
  } catch (error: any) {
    console.error('[Export Products]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
