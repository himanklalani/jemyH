import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Cart from '@/models/Cart';
import { Product } from '@/models/Product';
import { verifyAccessToken, getCartIdentifier } from '@/lib/auth';
import { logCartEvent } from '@/lib/cartEventLogger';

// GET /api/cart
export async function GET(req: NextRequest) {
  try {
    const { userId, sessionId, region, currency } = await getCartIdentifier(req);
    if (!userId && !sessionId) return NextResponse.json({ success: false, message: 'No session' }, { status: 401 });

    await dbConnect();
    
    // Find cart by user (if logged in) or by session (if guest)
    let query = userId ? { user: userId } : { sessionId, user: { $exists: false } };
    let cart = await Cart.findOne(query).populate('items.product', 'name slug images pricing stock requiresPrescription category');

    // If no cart exists, return empty structure instead of 404
    if (!cart) {
      return NextResponse.json({ success: true, cart: { items: [], region, currency } });
    }

    // Auto-sync Cart Pricing on Region Switch
    if (cart.region !== region) {
      let cartUpdated = false;
      for (const item of cart.items) {
        if (!item.product) continue;
        
        let baseAmount = item.product.pricing?.[region as 'US' | 'IN']?.amount || 0;
        
        // Add lens package pricing based on saved coatings
        if (item.coatings?.includes('essential')) {
          baseAmount += region === 'US' ? 12 : 500;
        } else if (item.coatings?.includes('anti-glare-pro')) {
          baseAmount += region === 'US' ? 28 : 1500;
        } else if (item.coatings?.includes('blue-cut-ultra')) {
          baseAmount += region === 'US' ? 45 : 2500;
        }

        if (item.priceSnapshot.amount !== baseAmount || item.priceSnapshot.currency !== currency) {
          item.priceSnapshot.amount = baseAmount;
          item.priceSnapshot.currency = currency;
          cartUpdated = true;
        }
      }

      if (cartUpdated || cart.region !== region || cart.currency !== currency) {
        cart.region = region;
        cart.currency = currency;
        await cart.save();
      }
    }

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('[cart GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST /api/cart - Add Item
export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId, region, currency, ipAddress } = await getCartIdentifier(req);
    if (!userId && !sessionId) return NextResponse.json({ success: false, message: 'No session' }, { status: 401 });

    const { productId, quantity = 1, savedPrescriptionId = null, config = {} } = await req.json();
    if (!productId) return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });

    await dbConnect();
    const product = await Product.findById(productId);
    
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    if (product.stock < quantity) return NextResponse.json({ success: false, message: 'Not enough stock' }, { status: 400 });

    let baseAmount = product.pricing[region]?.amount || 0;
    
    // Add lens package pricing
    if (config.coatings?.includes('essential')) {
      baseAmount += region === 'US' ? 12 : 500;
    } else if (config.coatings?.includes('anti-glare-pro')) {
      baseAmount += region === 'US' ? 28 : 1500;
    } else if (config.coatings?.includes('blue-cut-ultra')) {
      baseAmount += region === 'US' ? 45 : 2500;
    }

    const priceSnapshot = {
      amount: baseAmount,
      currency,
    };

    const prescriptionPending = product.requiresPrescription && 
                                config.lensType !== 'non-prescription' &&
                                !savedPrescriptionId && 
                                config.prescriptionMethod !== 'manual';

    const cartItemData = {
      product: productId,
      quantity,
      priceSnapshot,
      prescriptionPending,
      prescription: savedPrescriptionId,
      lensType: config.lensType,
      coatings: config.coatings,
      rxMethod: config.prescriptionMethod,
      pd: config.pd,
      rxData: config.rxData,
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
      // Check if product already in cart with EXACT SAME config
      const itemIndex = cart.items.findIndex((item: any) => 
        item.product.toString() === productId && 
        item.lensType === config.lensType && 
        JSON.stringify(item.coatings) === JSON.stringify(config.coatings)
      );
      
      if (itemIndex > -1) {
        if (product.stock < cart.items[itemIndex].quantity + quantity) {
          return NextResponse.json({ success: false, message: 'Not enough stock to add more' }, { status: 400 });
        }
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push(cartItemData);
      }
      // Ensure region matches current (if they added an item in a new region, reset cart region)
      cart.region = region;
      cart.currency = currency;
      await cart.save();
    }

    // Fire & Forget CartEvent Logger
    logCartEvent({
      user: userId || undefined,
      sessionId,
      action: 'add',
      product: productId,
      newQty: quantity,
      region,
      cartSnapshotAfter: cart.items,
      ipAddress,
    });

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('[cart POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/cart - Update Quantity
export async function PATCH(req: NextRequest) {
  try {
    const { userId, sessionId, region, ipAddress } = await getCartIdentifier(req);
    const { productId, quantity } = await req.json();
    
    if (quantity < 1) return NextResponse.json({ success: false, message: 'Use DELETE to remove items' }, { status: 400 });

    await dbConnect();
    const product = await Product.findById(productId);
    if (!product || product.stock < quantity) {
      return NextResponse.json({ success: false, message: 'Not enough stock' }, { status: 400 });
    }

    let query = userId ? { user: userId } : { sessionId, user: { $exists: false } };
    
    // Update specific item using array filters
    const updatedCart = await Cart.findOneAndUpdate(
      { ...query, 'items.product': productId },
      { $set: { 'items.$.quantity': quantity } },
      { new: true }
    );

    if (!updatedCart) return NextResponse.json({ success: false, message: 'Item not in cart' }, { status: 404 });

    logCartEvent({
      user: userId || undefined,
      sessionId,
      action: 'update_qty',
      product: productId,
      newQty: quantity,
      region,
      cartSnapshotAfter: updatedCart.items,
      ipAddress,
    });

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('[cart PATCH]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/cart - Remove Item
export async function DELETE(req: NextRequest) {
  try {
    const { userId, sessionId, region, ipAddress } = await getCartIdentifier(req);
    const { productId } = await req.json();

    await dbConnect();
    let query = userId ? { user: userId } : { sessionId, user: { $exists: false } };

    const updatedCart = await Cart.findOneAndUpdate(
      query,
      { $pull: { items: { product: productId } } },
      { new: true }
    );

    if (!updatedCart) return NextResponse.json({ success: false, message: 'Cart not found' }, { status: 404 });

    logCartEvent({
      user: userId || undefined,
      sessionId,
      action: 'remove',
      product: productId,
      region,
      cartSnapshotAfter: updatedCart.items,
      ipAddress,
    });

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('[cart DELETE]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
