import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = (searchParams.get('region') || 'US').toUpperCase() as 'US' | 'IN';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jemy.shop';

    await dbConnect();

    // Fetch active products
    const products = await Product.find({ stock: { $gt: 0 } }).lean();

    const rssItems = products.map((product: any) => {
      const priceObj = product.pricing[region];
      // Skip if this product isn't priced for this region
      if (!priceObj || !priceObj.amount) return '';

      const currency = region === 'US' ? 'USD' : 'INR';
      const link = `${baseUrl}/shop/${product.category}/${product.slug}`;
      const imageLink = product.images[0] || '';
      
      return `
      <item>
        <g:id>${product._id.toString()}</g:id>
        <g:title>${escapeXml(product.name)}</g:title>
        <g:description>${escapeXml(product.description)}</g:description>
        <g:link>${link}</g:link>
        <g:image_link>${escapeXml(imageLink)}</g:image_link>
        <g:condition>new</g:condition>
        <g:availability>in_stock</g:availability>
        <g:price>${priceObj.amount} ${currency}</g:price>
        <g:brand>Jemy</g:brand>
        <g:identifier_exists>false</g:identifier_exists>
      </item>
      `;
    }).join('');

    const rssFeed = `<?xml version="1.0"?>
    <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
      <channel>
        <title>Jemy ${region === 'US' ? 'US' : 'India'} Product Feed</title>
        <link>${baseUrl}</link>
        <description>Luxury Eyewear and Perfumes</description>
        ${rssItems}
      </channel>
    </rss>`;

    return new NextResponse(rssFeed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('[Google Merchant Feed Error]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
