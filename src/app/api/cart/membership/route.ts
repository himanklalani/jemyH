import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';
import Cart from '@/models/Cart';
import { getCartIdentifier } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId, region, currency } = await getCartIdentifier(req);
    if (!userId && !sessionId) return NextResponse.json({ success: false, message: 'No session' }, { status: 401 });

    await dbConnect();
    
    // Find or create membership product
    let membership = await Product.findOne({ slug: 'jemy-atelier-membership' });
    if (!membership) {
      membership = await Product.create({
        name: 'Jemy Atelier Membership',
        slug: 'jemy-atelier-membership',
        description: 'Annual membership for exclusive discounts and perks.',
        category: 'addon',
        images: ['/membership-card.jpg'],
        pricing: {
          US: { amount: 99, currency: 'USD' },
          IN: { amount: 999, currency: 'INR' }
        },
        stock: 99999,
        isAddon: true,
        requiresPrescription: false,
        regionAvailability: 'BOTH'
      });
    }

    const priceSnapshot = {
      amount: membership.pricing[region]?.amount || 0,
      currency,
    };

    const cartItemData = {
      product: membership._id,
      quantity: 1,
      priceSnapshot,
      prescriptionPending: false,
    };

    let query = userId ? { user: userId } : { sessionId, user: { $exists: false } };
    let cart = await Cart.findOne(query);

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        sessionId: userId ? undefined : sessionId,
        region,
        currency,
        items: [cartItemData],
      });
    } else {
      const exists = cart.items.some((item: any) => item.product.toString() === membership._id.toString());
      if (!exists) {
        cart.items.push(cartItemData);
        cart.region = region;
        cart.currency = currency;
        await cart.save();
      }
    }

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('[membership POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
