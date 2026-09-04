import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchandising extends Document {
  type: 'editorial'; // Restricted to only editorial slide functionality
  title: string;
  subtitle?: string;
  description?: string;
  images: string[];
  altText?: string;
  ctaText?: string;
  linkUrl?: string;
  associatedProducts?: mongoose.Types.ObjectId[];
  priority: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  campaignId?: mongoose.Types.ObjectId;
}

const MerchandisingSchema: Schema = new Schema({
  type: { type: String, enum: ['editorial'], required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  images: [{ type: String }],
  altText: { type: String },
  ctaText: { type: String },
  linkUrl: { type: String },
  associatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  priority: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date },
  endDate: { type: Date },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' }
}, { timestamps: true });

export default mongoose.models.Merchandising || mongoose.model<IMerchandising>('Merchandising', MerchandisingSchema);
