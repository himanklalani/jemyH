import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'open' | 'replied' | 'resolved';
  region?: 'US' | 'IN';
  adminNote?: string;
  repliedAt?: Date;
}

const ContactSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'replied', 'resolved'], default: 'open' },
  region: { type: String, enum: ['US', 'IN'] },
  adminNote: { type: String },
  repliedAt: { type: Date }
}, { timestamps: true });

ContactSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
