import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  tags: string[];
  category: string;
  isPublished: boolean;
  publishedAt?: Date;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
}

const BlogSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: { type: String },
  author: {
    name: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String }
  },
  tags: [{ type: String }],
  category: { type: String },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  seo: {
    metaTitle: String,
    metaDescription: String,
    canonicalUrl: String
  }
}, { timestamps: true });

BlogSchema.index({ slug: 1 });
BlogSchema.index({ tags: 1, isPublished: 1 });

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
