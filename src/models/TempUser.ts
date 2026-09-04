import mongoose, { Schema, Document } from 'mongoose';

export interface ITempUser extends Document {
  email: string;
  password?: string;
  phone?: string;
  otp: string;
  createdAt: Date;
}

const TempUserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '10m' }
});

export default mongoose.models.TempUser || mongoose.model<ITempUser>('TempUser', TempUserSchema);
