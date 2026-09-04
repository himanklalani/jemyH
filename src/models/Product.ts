import mongoose, { Schema, Document } from 'mongoose';

const PricingSchema = new Schema({
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  compareAtAmount: { type: Number }
}, { _id: false });

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: 'sunglasses' | 'eyeglasses' | 'perfume' | 'addon';
  images: string[];
  pricing: {
    US?: { amount: number; currency: string; compareAtAmount?: number };
    IN?: { amount: number; currency: string; compareAtAmount?: number };
  };
  stock: number;
  sales: number;
  aesthetics: string[];
  requiresPrescription: boolean;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  regionAvailability: 'US' | 'IN' | 'BOTH';
  isAddon?: boolean;
  tags: string[];
  sku?: string;
  isPublished: boolean;
  brand: string;
  features: string[];
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['sunglasses', 'eyeglasses', 'perfume', 'addon'], required: true },
  images: [{ type: String }],
  pricing: {
    US: PricingSchema,
    IN: PricingSchema
  },
  stock: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  aesthetics: [{ type: String }],
  requiresPrescription: { type: Boolean, default: false },
  gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'] },
  regionAvailability: { type: String, enum: ['US', 'IN', 'BOTH'], default: 'BOTH' },
  isAddon: { type: Boolean, default: false },
  tags: [{ type: String }],
  sku: { type: String },
  isPublished: { type: Boolean, default: true },
  brand: { type: String, default: 'Jemy' },
  features: [{ type: String }]
}, { timestamps: true, discriminatorKey: 'category' });

ProductSchema.index({ category: 1, aesthetics: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

const LensOptionSchema = new Schema({
  type: { type: String, enum: ['single-vision', 'progressive', 'bifocal', 'reading', 'non-prescription'] },
  name: String,
  priceModifierUS: Number,
  priceModifierIN: Number
}, { _id: false });

const RxPowerRangeSchema = new Schema({
  minSphere: { type: Number, default: -20.00 },
  maxSphere: { type: Number, default: 12.00 },
  minCylinder: { type: Number, default: -6.00 },
  maxCylinder: { type: Number, default: 6.00 },
}, { _id: false });

const getEyewearProduct = () => {
  if (mongoose.models.EyewearProduct) return mongoose.models.EyewearProduct;
  if (Product.discriminators && Product.discriminators['eyeglasses']) return Product.discriminators['eyeglasses'];
  return Product.discriminator('eyeglasses', new Schema({
    frameMaterial: String,
    frameShape: String,
    frameColor: String,
    frameSize: { type: String, enum: ['S', 'M', 'L', 'Custom'] },
    dimensions: {
      lensWidth: Number,
      bridgeWidth: Number,
      templeLength: Number
    },
    supportedLensTypes: [LensOptionSchema],
    powerRanges: RxPowerRangeSchema
  }));
};

const getSunglassesProduct = () => {
  if (mongoose.models.SunglassesProduct) return mongoose.models.SunglassesProduct;
  if (Product.discriminators && Product.discriminators['sunglasses']) return Product.discriminators['sunglasses'];
  return Product.discriminator('sunglasses', new Schema({
    frameMaterial: String,
    frameShape: String,
    frameColor: String,
    frameSize: { type: String, enum: ['S', 'M', 'L', 'Custom'] },
    dimensions: {
      lensWidth: Number,
      bridgeWidth: Number,
      templeLength: Number
    },
    supportedLensTypes: [LensOptionSchema],
    powerRanges: RxPowerRangeSchema
  }));
};

export const EyewearProduct = getEyewearProduct();
export const SunglassesProduct = getSunglassesProduct();
