import mongoose, { Schema, Document } from 'mongoose';

const CartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  prescription: { type: Schema.Types.ObjectId, ref: 'User' }, // savedPrescriptionId if already saved
  prescriptionPending: { type: Boolean, default: false }, // deferred to checkout
  
  // Lens Configurator
  lensType: { type: String, enum: ['single-vision', 'progressive', 'non-prescription'] },
  coatings: [{ type: String }],
  rxMethod: { type: String, enum: ['manual', 'upload'] },
  pd: { type: String },
  rxData: {
    od: { sph: String, cyl: String, axis: String, add: String },
    os: { sph: String, cyl: String, axis: String, add: String },
  },
  rxFile: { type: String }, // Base64 or URL

  priceSnapshot: {
    amount: Number,
    currency: String
  }
}, { _id: true });

export interface ICart extends Document {
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: any[];
  region: 'US' | 'IN';
  currency: string;
  updatedAt: Date;
}

const CartSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },
  items: [CartItemSchema],
  region: { type: String, enum: ['US', 'IN'], required: true },
  currency: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
