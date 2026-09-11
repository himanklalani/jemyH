import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Cart from '@/models/Cart';
import User from '@/models/User';
import { Product } from '@/models/Product';
import Order from '@/models/Order';
import CartEvent from '@/models/CartEvent';
import { checkAdminAuth } from '@/lib/auth';
import { sendAbandonedCartEmail, AbandonedCartItem } from '@/lib/brevo';

/**
 * POST /api/admin/cart-audit/recover
 * Triggered manually from Admin Dashboard or automatically via Vercel Cron.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authorization: Allow either Admin JWT or CRON_SECRET header
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization') || '';
    const cronHeader = req.headers.get('x-cron-secret');

    const isCronAuthorized = cronSecret && (cronHeader === cronSecret || authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthorized) {
      const auth = await checkAdminAuth(req);
      if (auth.error) return auth.error;
    }

    await dbConnect();

    // 2. Window definitions (e.g. carts untouched between 2 hours and 7 days ago)
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 3. Find candidate abandoned carts
    const abandonedCarts = await Cart.find({
      'items.0': { $exists: true }, // Has at least 1 item
      updatedAt: { $lte: twoHoursAgo, $gte: sevenDaysAgo },
      $or: [
        { abandonedEmailSentAt: { $exists: false } },
        { abandonedEmailSentAt: null }
      ]
    })
    .populate('items.product', 'name slug images pricing')
    .sort({ updatedAt: -1 })
    .limit(50); // Process in batches of 50 to avoid timeout

    let sentCount = 0;
    let skippedCount = 0;
    const details: any[] = [];

    for (const cart of abandonedCarts) {
      let recipientEmail = cart.guestEmail;
      let recipientName = cart.guestName || 'Atelier Collector';

      // Look up logged-in user if available
      if (!recipientEmail && cart.user) {
        const userDoc = await User.findById(cart.user).lean();
        if (userDoc?.email) {
          recipientEmail = userDoc.email;
          recipientName = userDoc.name || recipientName;
        }
      }

      // If no customer contact info was found on the cart, skip
      if (!recipientEmail) {
        skippedCount++;
        continue;
      }

      // Verify customer hasn't completed an order since this cart update
      const orderQuery: any = {
        createdAt: { $gte: cart.updatedAt }
      };
      if (cart.user) {
        orderQuery.user = cart.user;
      } else if (cart.sessionId) {
        orderQuery.sessionId = cart.sessionId;
      }

      const recentOrder = await Order.findOne(orderQuery).lean();
      if (recentOrder) {
        // Customer already completed an order, mark cart to prevent re-scanning
        cart.abandonedEmailSentAt = new Date();
        await cart.save();
        skippedCount++;
        continue;
      }

      // Prepare item snapshots
      const itemsList: AbandonedCartItem[] = cart.items
        .filter((item: any) => item.product)
        .map((item: any) => {
          const p = item.product;
          const price = p.pricing?.[cart.region]?.amount || item.priceSnapshot?.amount || 0;
          const currency = cart.currency || 'USD';
          return {
            name: p.name || 'Jemy Designer Frame',
            image: p.images?.[0] || '/images/glasses_studio_1787493089248.png',
            priceFormatted: `${currency} ${price}`,
            quantity: item.quantity || 1,
          };
        });

      if (itemsList.length === 0) {
        skippedCount++;
        continue;
      }

      // Dispatch Brevo email (gracefully falls back if BREVO_API_KEY is not set yet)
      const emailResult = await sendAbandonedCartEmail({
        email: recipientEmail,
        name: recipientName,
        items: itemsList,
        discountCode: 'JEMY10',
      });

      // Mark cart as contacted
      cart.abandonedEmailSentAt = new Date();
      cart.recoveryDiscountCode = 'JEMY10';
      await cart.save();

      // Log recovery event
      await CartEvent.create({
        user: cart.user,
        sessionId: cart.sessionId,
        action: 'abandoned_recovery_sent',
        region: cart.region,
        currency: cart.currency,
        cartSnapshotAfter: cart.items.map((i: any) => ({
          product: i.product?._id || i.product,
          qty: i.quantity,
          priceAtEvent: i.priceSnapshot?.amount || 0
        })),
        createdAt: new Date(),
      });

      sentCount++;
      details.push({
        cartId: cart._id,
        email: recipientEmail,
        name: recipientName,
        itemsCount: itemsList.length,
        status: emailResult.success ? 'sent' : (emailResult.pendingConfig ? 'logged_pending_key' : 'failed'),
      });
    }

    return NextResponse.json({
      success: true,
      scanned: abandonedCarts.length,
      sentCount,
      skippedCount,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Cart Recovery Automation Error]', error);
    return NextResponse.json({ success: false, message: error.message || 'Recovery process failed' }, { status: 500 });
  }
}

/**
 * GET /api/admin/cart-audit/recover
 * Proxy to POST for compatibility with Vercel Cron schedules.
 */
export async function GET(req: NextRequest) {
  return POST(req);
}
