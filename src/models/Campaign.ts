import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'inactive' | 'scheduled';
  priority: number;
}

const CampaignSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'scheduled'], default: 'active' },
  priority: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
