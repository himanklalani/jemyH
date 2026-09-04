import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvertisement extends Document {
  textContent?: string; // Optional now, since banners might just be images
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  altText?: string;
  ctaText?: string;
  linkUrl?: string;
  displayLocation: 'marquee' | 'popup' | 'hero' | 'banner'; // Added banner
  isActive: boolean;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  linkedCoupon?: mongoose.Types.ObjectId;
  offerId?: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  region?: 'US' | 'IN' | 'ALL';
}

const AdvertisementSchema: Schema = new Schema({
  textContent: { type: String },
  title: { type: String },
  subtitle: { type: String },
  imageUrl: { type: String },
  mobileImageUrl: { type: String },
  altText: { type: String },
  ctaText: { type: String },
  linkUrl: { type: String },
  displayLocation: { type: String, enum: ['marquee', 'popup', 'hero', 'banner'], required: true },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  linkedCoupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
  offerId: { type: Schema.Types.ObjectId, ref: 'Offer' },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  region: { type: String, enum: ['US', 'IN', 'ALL'], default: 'ALL' }
}, { timestamps: true });

export default mongoose.models.Advertisement || mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema);
