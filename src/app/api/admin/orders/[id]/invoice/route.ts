import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { checkAdminAuth } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const order = await Order.findById(resolvedParams.id).populate('items.product', 'name category').lean();

    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    // Generate PDF Invoice
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const isIndian = order.region === 'IN';
    const currencySym = isIndian ? 'INR ' : '$';

    // Header
    doc.fontSize(20).text(`INVOICE`, { align: 'right' });
    doc.fontSize(10).text(`Order ID: ${order._id}`, { align: 'right' });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Company Info
    doc.fontSize(16).text('Jemy Eyewear', 50, 50);
    doc.fontSize(10).text('123 Luxury Avenue');
    if (isIndian) {
      doc.text('Mumbai, MH 400001');
      doc.text('GSTIN: 27AABCJ1234D1Z5');
    } else {
      doc.text('New York, NY 10001');
    }
    doc.moveDown();

    // Billing To
    doc.fontSize(12).text('Billed To:');
    doc.fontSize(10).text(`${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`);
    doc.text(`${order.shippingAddress?.addressLine1 || ''}`);
    doc.text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.postalCode || ''}`);
    doc.text(`${order.shippingAddress?.country || ''}`);
    doc.moveDown(2);

    // Items Table Header
    const tableTop = 250;
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Quantity', 300, tableTop, { width: 90, align: 'right' });
    doc.text('Unit Price', 400, tableTop, { width: 90, align: 'right' });
    doc.text('Line Total', 0, tableTop, { align: 'right' });
    doc.font('Helvetica');

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Items
    let y = tableTop + 25;
    order.items.forEach((item: any) => {
      doc.text(item.product?.name || 'Unknown Product', 50, y);
      doc.text(item.quantity.toString(), 300, y, { width: 90, align: 'right' });
      doc.text(`${currencySym}${item.priceAtEvent.toFixed(2)}`, 400, y, { width: 90, align: 'right' });
      doc.text(`${currencySym}${(item.quantity * item.priceAtEvent).toFixed(2)}`, 0, y, { align: 'right' });
      y += 20;
    });

    doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();
    y += 20;

    // Totals
    doc.font('Helvetica-Bold');
    if (order.couponCode) {
      doc.text(`Coupon (${order.couponCode}) Applied`, 300, y, { width: 90, align: 'right' });
      y += 20;
    }

    doc.text('Total Amount', 300, y, { width: 90, align: 'right' });
    doc.text(`${currencySym}${order.totalPrice.toFixed(2)}`, 0, y, { align: 'right' });

    if (isIndian) {
      y += 20;
      doc.font('Helvetica-Oblique').fontSize(8).text('Total includes 18% GST as per Indian regulations.', 300, y, { width: 250, align: 'right' });
    }

    doc.end();

    // Wait for the PDF to finish generating
    await new Promise((resolve) => doc.on('end', resolve));

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${order._id}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('[Admin PDF Invoice]', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
