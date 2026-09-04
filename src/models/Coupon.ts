import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  isActive: boolean;
  expiryDate: Date;
  usageLimit: number;
  perUserLimit: number;
  usageCount: number;
  minOrderValueUS: number;
  minOrderValueIN: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  offerIds?: mongoose.Types.ObjectId[];
  campaignIds?: mongoose.Types.ObjectId[];
}

const CouponSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number }, 
  perUserLimit: { type: Number, default: 1 },
  usageCount: { type: Number, default: 0 },
  minOrderValueUS: { type: Number, default: 0 },
  minOrderValueIN: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  offerIds: [{ type: Schema.Types.ObjectId, ref: 'Offer' }],
  campaignIds: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }]
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
