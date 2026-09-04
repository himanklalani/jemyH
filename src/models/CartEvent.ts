import mongoose, { Schema, Document } from 'mongoose';

export interface ICartEvent extends Document {
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  action: 'add' | 'remove' | 'update_qty' | 'clear';
  product?: mongoose.Types.ObjectId;
  previousQty?: number;
  newQty?: number;
  cartSnapshotAfter: any[];
  region: 'US' | 'IN';
  currency: string;
  device?: { type: string; userAgent: string };
  ipHash?: string;
  createdAt: Date;
}

const CartEventSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String },
  action: { type: String, enum: ['add', 'remove', 'update_qty', 'clear'], required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  previousQty: { type: Number },
  newQty: { type: Number },
  cartSnapshotAfter: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    qty: Number,
    priceAtEvent: Number
  }],
  region: { type: String, enum: ['US', 'IN'], required: true },
  currency: { type: String, required: true },
  device: {
    type: { type: String },
    userAgent: { type: String }
  },
  ipHash: { type: String },
  createdAt: { type: Date, default: Date.now }
});

CartEventSchema.index({ createdAt: -1 });
CartEventSchema.index({ user: 1, createdAt: -1 });
CartEventSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.models.CartEvent || mongoose.model<ICartEvent>('CartEvent', CartEventSchema);
