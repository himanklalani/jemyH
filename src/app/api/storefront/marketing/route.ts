import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Advertisement from '@/models/Advertisement';
import Merchandising from '@/models/Merchandising';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const now = new Date();
    
    // Base active query with scheduling logic
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

    // Fetch active advertisements
    const advertisements = await Advertisement.find(activeQuery)
      .sort({ priority: -1, createdAt: -1 })
      .populate('linkedCoupon')
      .populate('offerId')
      .lean();
      
    // Fetch active merchandising sections
    const merchandising = await Merchandising.find(activeQuery)
      .sort({ priority: -1, createdAt: -1 })
      .populate('associatedProducts')
      .lean();
      
    // Organize the data
    const payload = {
      flyer: advertisements.find(ad => ad.displayLocation === 'popup'),
      marquees: advertisements.filter(ad => ad.displayLocation === 'marquee'),
      banners: advertisements.filter(ad => ad.displayLocation === 'banner' || ad.displayLocation === 'hero'),
      recommendations: merchandising.filter(m => m.type === 'recommendation'),
      sunCollection: merchandising.filter(m => m.type === 'sunCollection'),
      frameArchive: merchandising.filter(m => m.type === 'frameArchive'),
      editorial: merchandising.filter(m => m.type === 'editorial')
    };
    
    return NextResponse.json({ success: true, ...payload }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
