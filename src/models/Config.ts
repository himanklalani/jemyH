import mongoose, { Schema, Document } from 'mongoose';

export interface IConfig extends Document {
  key: string;
  value: any;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const ConfigSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema);
