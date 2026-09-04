import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  isActive: boolean;
  region?: 'US' | 'IN';
  subscribedAt: Date;
  unsubscribedAt?: Date;
  source?: string; // e.g. 'footer', 'popup', 'checkout'
}

const NewsletterSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  region: { type: String, enum: ['US', 'IN'] },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
  source: { type: String }
});

NewsletterSchema.index({ email: 1 });
NewsletterSchema.index({ isActive: 1, region: 1 });

export default mongoose.models.Newsletter || mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
