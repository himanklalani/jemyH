import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: mongoose.Types.ObjectId | string | null;
  parentSlug?: string | null;
  isSystem?: boolean;
  isActive: boolean;
  displayOrder: number;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  parentSlug: { type: String, default: null },
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ parentSlug: 1 });
CategorySchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

