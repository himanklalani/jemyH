import mongoose, { Schema, Document } from 'mongoose';

export interface IRMA extends Document {
  orderId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    reason: string;
    conditionOnArrival?: string;
    actionTaken?: 'restock' | 'write-off' | 'pending';
  }[];
  status: 'requested' | 'approved' | 'received' | 'rejected' | 'processed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RMASchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true }, // e.g. 'Defective', 'Wrong Item', 'Changed Mind'
    conditionOnArrival: { type: String }, // e.g. 'Unopened', 'Damaged', 'Used'
    actionTaken: { type: String, enum: ['restock', 'write-off', 'pending'], default: 'pending' }
  }],
  status: { type: String, enum: ['requested', 'approved', 'received', 'rejected', 'processed'], default: 'requested' },
  adminNotes: { type: String },
}, { timestamps: true });

export default mongoose.models.RMA || mongoose.model<IRMA>('RMA', RMASchema);
