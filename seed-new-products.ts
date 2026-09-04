import mongoose, { Schema } from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jemy').then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Inline schema definition to bypass Next.js alias resolution issues
const PricingSchema = new Schema({
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  compareAtAmount: { type: Number }
}, { _id: false });

const ProductSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['sunglasses', 'eyeglasses', 'perfume', 'addon'], required: true },
  images: [{ type: String }],
  pricing: { US: PricingSchema, IN: PricingSchema },
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

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

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

const EyewearProduct = Product.discriminators && Product.discriminators['eyeglasses'] ? Product.discriminators['eyeglasses'] : Product.discriminator('eyeglasses', new Schema({
  frameMaterial: String,
  frameShape: String,
  frameColor: String,
  frameSize: { type: String, enum: ['S', 'M', 'L', 'Custom'] },
  dimensions: { lensWidth: Number, bridgeWidth: Number, templeLength: Number },
  supportedLensTypes: [LensOptionSchema],
  powerRanges: RxPowerRangeSchema
}));

const SunglassesProduct = Product.discriminators && Product.discriminators['sunglasses'] ? Product.discriminators['sunglasses'] : Product.discriminator('sunglasses', new Schema({
  frameMaterial: String,
  frameShape: String,
  frameColor: String,
  frameSize: { type: String, enum: ['S', 'M', 'L', 'Custom'] },
  lensColor: String,
  lensType: { type: String, enum: ['Polarized', 'Tinted', 'Gradient', 'Mirrored', 'Photochromic'] },
  dimensions: { lensWidth: Number, bridgeWidth: Number, templeLength: Number },
  supportedLensTypes: [LensOptionSchema],
  powerRanges: RxPowerRangeSchema
}));

async function seedProducts() {
  const newProducts = [
    {
      name: 'Titanium Geo',
      slug: 'titanium-geo',
      description: 'High-end luxury sunglasses featuring a geometric shape and titanium frame.',
      category: 'sunglasses',
      images: ['/artifacts/geo_titanium_sunglasses.png'],
      pricing: { US: { amount: 395, currency: 'USD' }, IN: { amount: 32000, currency: 'INR' } },
      stock: 50, sales: 0,
      aesthetics: ['geometric', 'luxury', 'modern'],
      requiresPrescription: true, gender: 'unisex', regionAvailability: 'BOTH', isAddon: false,
      tags: ['titanium', 'geometric'], sku: 'SG-GEO-TIT-01', isPublished: true, brand: 'Jemy',
      features: ['Titanium Frame', 'Polarized Lenses', 'Geometric Design'],
      frameMaterial: 'Titanium', frameShape: 'Geometric', frameColor: 'Silver', frameSize: 'M',
      lensColor: 'Dark Grey', lensType: 'Polarized'
    },
    {
      name: 'Classic Tortoiseshell',
      slug: 'classic-tortoiseshell',
      description: 'Premium acetate eyeglasses with a round shape in a classic tortoiseshell color.',
      category: 'eyeglasses',
      images: ['/artifacts/round_acetate_eyeglasses.png'],
      pricing: { US: { amount: 245, currency: 'USD' }, IN: { amount: 18000, currency: 'INR' } },
      stock: 75, sales: 0,
      aesthetics: ['classic', 'vintage', 'round'],
      requiresPrescription: true, gender: 'unisex', regionAvailability: 'BOTH', isAddon: false,
      tags: ['acetate', 'round', 'tortoiseshell'], sku: 'EG-RND-TRT-01', isPublished: true, brand: 'Jemy',
      features: ['Acetate Frame', 'Round Shape', 'Vintage Style'],
      frameMaterial: 'Acetate', frameShape: 'Round', frameColor: 'Tortoiseshell', frameSize: 'M',
      dimensions: { lensWidth: 48, bridgeWidth: 20, templeLength: 145 }
    },
    {
      name: 'Onyx Cat-Eye',
      slug: 'onyx-cat-eye',
      description: 'Modern cat-eye sunglasses with a thick black frame and tinted lenses.',
      category: 'sunglasses',
      images: ['/artifacts/cat_eye_sunglasses.png'],
      pricing: { US: { amount: 285, currency: 'USD' }, IN: { amount: 22000, currency: 'INR' } },
      stock: 60, sales: 0,
      aesthetics: ['modern', 'bold', 'cat-eye'],
      requiresPrescription: true, gender: 'women', regionAvailability: 'BOTH', isAddon: false,
      tags: ['acetate', 'cat-eye', 'black'], sku: 'SG-CAT-BLK-01', isPublished: true, brand: 'Jemy',
      features: ['Thick Acetate Frame', 'Cat-Eye Shape', 'Bold Style'],
      frameMaterial: 'Acetate', frameShape: 'Cat-Eye', frameColor: 'Black', frameSize: 'L',
      lensColor: 'Black', lensType: 'Tinted'
    }
  ];

  try {
    for (const p of newProducts) {
      const existing = await Product.findOne({ slug: p.slug });
      if (!existing) {
        if (p.category === 'sunglasses') {
          await SunglassesProduct.create(p);
        } else {
          await EyewearProduct.create(p);
        }
        console.log(`Created ${p.name}`);
      } else {
        console.log(`${p.name} already exists`);
      }
    }
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedProducts();
