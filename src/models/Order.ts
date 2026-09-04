import mongoose, { Schema, Document } from 'mongoose';
import { PrescriptionSchema } from './User';

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productSnapshot: {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String },
    category: { type: String, required: true },
    sku: { type: String }
  },
  quantity: { type: Number, required: true },
  priceAtEvent: { type: Number, required: true },
  prescription: PrescriptionSchema
});

const AddressSchema = new Schema({
  firstName: String,
  lastName: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  phone: String
});

const TaxBreakdownSchema = new Schema({
  taxName: String,
  taxAmount: Number,
  taxRate: Number
});

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: any[];
  shippingAddress: any;
  totalPrice: number;
  currency: string;
  region: 'US' | 'IN';
  paymentGateway: 'razorpay' | 'stripe' | 'paypal' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exchange_requested' | 'exchange_approved' | 'exchanged';
  couponCode?: string;
  taxBreakdown?: any[];
  transactionIds: {
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
  };
  shippingDetails?: {
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String },
  items: [OrderItemSchema],
  shippingAddress: AddressSchema,
  totalPrice: { type: Number, required: true },
  currency: { type: String, required: true },
  region: { type: String, enum: ['US', 'IN'], required: true },
  paymentGateway: { type: String, enum: ['razorpay', 'stripe', 'paypal', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'exchange_requested', 'exchange_approved', 'exchanged'], default: 'pending' },
  couponCode: { type: String },
  taxBreakdown: [TaxBreakdownSchema],
  transactionIds: {
    gatewayOrderId: String,
    gatewayPaymentId: String
  },
  shippingDetails: {
    courier: String,
    trackingNumber: String,
    trackingUrl: String
  }
}, { timestamps: true });

OrderSchema.index({ user: 1, orderStatus: 1 });
OrderSchema.index({ region: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
