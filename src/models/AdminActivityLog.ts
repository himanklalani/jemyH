import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  entityType: 'product' | 'order' | 'user' | 'coupon' | 'prescription' | 'review' | 'inventory';
  entityId?: mongoose.Types.ObjectId;
  details: any;
  ipAddress?: string;
  createdAt: Date;
}

const AdminActivityLogSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "updated_price", "refunded_order", "approved_prescription"
  entityType: { 
    type: String, 
    enum: ['product', 'order', 'user', 'coupon', 'prescription', 'review', 'inventory'],
    required: true 
  },
  entityId: { type: Schema.Types.ObjectId },
  details: { type: Schema.Types.Mixed }, // Arbitrary JSON for what changed (e.g., { oldPrice: 100, newPrice: 120 })
  ipAddress: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Index for fast dashboard querying
AdminActivityLogSchema.index({ adminId: 1, createdAt: -1 });
AdminActivityLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.AdminActivityLog || mongoose.model<IAdminActivityLog>('AdminActivityLog', AdminActivityLogSchema);
