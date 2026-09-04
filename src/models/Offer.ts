import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableProducts?: mongoose.Types.ObjectId[];
  applicableCategories?: string[];
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  campaignId?: mongoose.Types.ObjectId;
}

const OfferSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: String }],
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' }
}, { timestamps: true });

export default mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);
