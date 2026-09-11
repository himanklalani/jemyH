import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Category from '@/models/Category';
import { Product } from '@/models/Product';
import { checkAdminAuth } from '@/lib/auth';

export const CORE_SYSTEM_CATEGORIES = [
  {
    name: 'Eyeglasses',
    slug: 'eyeglasses',
    description: 'Prescription frames, optical lenses, blue light blockers, and bespoke reading glasses.',
    displayOrder: 1,
    isSystem: true,
    parentId: null,
    parentSlug: null,
    isActive: true,
  },
  {
    name: 'Sunglasses',
    slug: 'sunglasses',
    description: 'Luxury sunwear, UV400 polarized lenses, tinted aviators, and bold summer silhouettes.',
    displayOrder: 2,
    isSystem: true,
    parentId: null,
    parentSlug: null,
    isActive: true,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Leather protective cases, solid brass eyewear chains, microfiber polishing cloths.',
    displayOrder: 3,
    isSystem: true,
    parentId: null,
    parentSlug: null,
    isActive: true,
  },
  {
    name: 'Add-on & Care',
    slug: 'addon',
    description: 'Care essentials, anti-fog solutions, travel cases, and 1-click cart enhancements.',
    displayOrder: 4,
    isSystem: true,
    parentId: null,
    parentSlug: null,
    isActive: true,
  },
  {
    name: 'Fragrance & Perfume',
    slug: 'perfume',
    description: 'Artisanal scents, bespoke Eau de Parfum, and atmospheric fragrances.',
    displayOrder: 5,
    isSystem: true,
    parentId: null,
    parentSlug: null,
    isActive: true,
  },
];

export async function GET(req: Request) {
  try {
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();

    // Ensure all core system categories exist in the database without overwriting existing customizations
    await Promise.all(
      CORE_SYSTEM_CATEGORIES.map(core =>
        Category.findOneAndUpdate(
          { slug: core.slug },
          { $setOnInsert: core },
          { upsert: true, new: true }
        )
      )
    );

    const categories = await Category.find().sort({ displayOrder: 1, createdAt: 1 }).lean();

    // Aggregate product counts by category and subcategory
    const [catCounts, subcatCounts] = await Promise.all([
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        { $match: { subcategory: { $exists: true, $ne: null } } },
        { $group: { _id: '$subcategory', count: { $sum: 1 } } }
      ])
    ]);

    const catCountMap: Record<string, number> = {};
    catCounts.forEach((item: any) => {
      if (item._id) catCountMap[item._id.toLowerCase()] = item.count;
    });

    const subcatCountMap: Record<string, number> = {};
    subcatCounts.forEach((item: any) => {
      if (item._id) subcatCountMap[item._id.toLowerCase()] = item.count;
    });

    // Attach product counts
    const categoriesWithCounts = categories.map((cat: any) => {
      const slugLower = cat.slug.toLowerCase();
      const productCount = (catCountMap[slugLower] || 0) + (subcatCountMap[slugLower] || 0);
      return {
        ...cat,
        productCount,
      };
    });

    return NextResponse.json({ success: true, categories: categoriesWithCounts });
  } catch (error: any) {
    console.error('[Admin Categories GET]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    // Auto-generate slug if missing
    let slug = body.slug;
    if (!slug) {
      slug = body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    } else {
      slug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    // Check if slug already exists
    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, message: `Slug "${slug}" already exists. Please choose another.` }, { status: 400 });
    }

    let parentSlug = null;
    let parentId = null;

    if (body.parentId) {
      const parent = await Category.findById(body.parentId);
      if (!parent) {
        return NextResponse.json({ success: false, message: 'Selected parent category does not exist' }, { status: 400 });
      }
      parentId = parent._id;
      parentSlug = parent.slug;
    }

    const category = await Category.create({
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || '',
      displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : 0,
      parentId,
      parentSlug,
      isSystem: false,
      isActive: body.isActive !== false,
      image: body.image || '',
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Categories POST]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
