import mongoose, { Schema, Document } from 'mongoose';

export const PrescriptionSchema = new Schema({
  type: { type: String, enum: ['single-vision', 'bifocal', 'progressive', 'reading', 'non-prescription'] },
  od: {
    sphere: Number, cylinder: Number, axis: Number, add: Number
  },
  os: {
    sphere: Number, cylinder: Number, axis: Number, add: Number
  },
  pd: Number,
  prescriptionFileUrl: String,
  doctorName: String,
  clinicName: String,
  prescriptionDate: Date,
  expiryDate: Date,
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected', 'passive-verified'], default: 'pending' },
  verificationMethod: { type: String, enum: ['manual-entry', 'file-upload', 'passive-verification'] },
  verifiedBy: Schema.Types.ObjectId,
  verifiedAt: Date
}, { _id: true });

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'user' | 'admin' | 'store_manager';
  region?: 'US' | 'IN';
  wishlist: mongoose.Types.ObjectId[];
  savedPrescriptions: any[];
  resetPasswordOtp?: string;
  resetPasswordExpires?: Date;
  isSuspended?: boolean;
  membership?: {
    isActive: boolean;
    plan: 'atelier_annual';
    startDate?: Date;
    expiryDate?: Date;
    activatedViaOrderId?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional if Google OAuth
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin', 'store_manager'], default: 'user' },
  region: { type: String, enum: ['US', 'IN'] },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  savedPrescriptions: [PrescriptionSchema],
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  isSuspended: { type: Boolean, default: false },
  membership: {
    isActive: { type: Boolean, default: false },
    plan: { type: String, enum: ['atelier_annual'], default: 'atelier_annual' },
    startDate: { type: Date },
    expiryDate: { type: Date },
    activatedViaOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
