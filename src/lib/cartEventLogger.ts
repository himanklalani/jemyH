import dbConnect from './mongoose';
import CartEvent from '@/models/CartEvent';

type CartAction = 'add' | 'remove' | 'update_qty' | 'clear';

interface LogCartEventParams {
  user?: string; // MongoDB ObjectId string
  sessionId?: string;
  action: CartAction;
  product?: string; // MongoDB ObjectId string
  oldQty?: number;
  newQty?: number;
  region: 'US' | 'IN';
  cartSnapshotAfter: any;
  ipAddress?: string;
}

/**
 * A non-blocking utility to log cart mutations for the Phase 9 Audit Tool.
 * It's fire-and-forget so it doesn't slow down the main API response.
 */
export function logCartEvent(params: LogCartEventParams) {
  // Fire and forget - do not await
  (async () => {
    try {
      await dbConnect();
      
      // Hash IP address if present for privacy
      let ipHash;
      if (params.ipAddress) {
        const crypto = await import('crypto');
        ipHash = crypto.createHash('sha256').update(params.ipAddress).digest('hex');
      }

      await CartEvent.create({
        user: params.user,
        sessionId: params.sessionId,
        action: params.action,
        product: params.product,
        oldQty: params.oldQty,
        newQty: params.newQty,
        region: params.region,
        cartSnapshotAfter: params.cartSnapshotAfter,
        ipHash,
      });
    } catch (error) {
      console.error('[cartEventLogger] Failed to log cart event:', error);
    }
  })();
}
