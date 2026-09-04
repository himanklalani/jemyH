import HomePageClient from '@/components/home/HomePageClient';
import dbConnect from '@/lib/mongoose';
import Advertisement from '@/models/Advertisement';
import Merchandising from '@/models/Merchandising';
import { Product } from '@/models/Product';
import { cookies } from 'next/headers';

export const revalidate = 60; // ISR cache every 60 seconds

async function getMarketingConfig() {
  await dbConnect();
  
  const now = new Date();
  
  const activeQuery = {
    isActive: true,
    $or: [
      { startDate: { $exists: false } },
      { startDate: null },
      { startDate: { $lte: now } }
    ],
    $and: [
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      }
    ]
  };

  const advertisements = await Advertisement.find(activeQuery)
    .sort({ priority: -1, createdAt: -1 })
    .populate('linkedCoupon')
    .populate('offerId')
    .lean();
    
  const merchandising = await Merchandising.find(activeQuery)
    .sort({ priority: -1, createdAt: -1 })
    .populate('associatedProducts')
    .lean();
    
  const payload = {
    flyer: advertisements.find((ad: any) => ad.displayLocation === 'popup'),
    marquees: advertisements.filter((ad: any) => ad.displayLocation === 'marquee'),
    banners: advertisements.filter((ad: any) => ad.displayLocation === 'banner' || ad.displayLocation === 'hero'),
    recommendations: merchandising.filter((m: any) => m.type === 'recommendation'),
    sunCollection: merchandising.filter((m: any) => m.type === 'sunCollection'),
    frameArchive: merchandising.filter((m: any) => m.type === 'frameArchive'),
    editorial: merchandising.filter((m: any) => m.type === 'editorial')
  };
  
  // JSON serialization is required because MongoDB ObjectIds cannot be passed directly to Client Components
  return JSON.parse(JSON.stringify(payload));
}

async function getProducts(query: any, sortObj: any, region: string) {
  await dbConnect();
  const products = await Product.find(query)
    .select(`name slug images category pricing.${region} stock requiresPrescription`)
    .sort(sortObj)
    .limit(4)
    .lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const region = cookieStore.get('jemy_region')?.value === 'US' ? 'US' : 'IN';
  
  const marketingConfig = await getMarketingConfig();
  
  const bestsellers = await getProducts({ isPublished: { $ne: false } }, { sales: -1 }, region);
  const recommendations = await getProducts({ isPublished: { $ne: false } }, { createdAt: -1 }, region);
  const sunglasses = await getProducts({ isPublished: { $ne: false }, category: 'sunglasses' }, { createdAt: -1 }, region);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jemy',
    url: 'https://jemy.shop',
    logo: 'https://jemy.shop/images/logo.png',
    sameAs: [
      'https://instagram.com/jemy.shop'
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient 
        marketingConfig={marketingConfig}
        bestsellers={bestsellers}
        recommendations={recommendations}
        sunglasses={sunglasses}
      />
    </>
  );
}
