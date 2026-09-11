import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Category from '@/models/Category';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await req.json();

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // Protect system slug immutability
    if (existingCategory.isSystem && body.slug && body.slug !== existingCategory.slug) {
      return NextResponse.json({ success: false, message: 'Cannot modify slug of core system category' }, { status: 400 });
    }

    // Handle slug formatting if changed for custom category
    if (!existingCategory.isSystem && body.slug) {
      body.slug = body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const duplicate = await Category.findOne({ slug: body.slug, _id: { $ne: id } });
      if (duplicate) {
        return NextResponse.json({ success: false, message: `Slug "${body.slug}" is already in use` }, { status: 400 });
      }
    }

    // Handle parent relationship
    if (body.parentId !== undefined) {
      if (!body.parentId) {
        body.parentId = null;
        body.parentSlug = null;
      } else {
        if (body.parentId === id) {
          return NextResponse.json({ success: false, message: 'A category cannot be its own parent' }, { status: 400 });
        }
        const parent = await Category.findById(body.parentId);
        if (!parent) {
          return NextResponse.json({ success: false, message: 'Parent category not found' }, { status: 400 });
        }
        body.parentId = parent._id;
        body.parentSlug = parent.slug;
      }
    }

    const category = await Category.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('[Admin Categories PATCH]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await checkAdminAuth(req as any);
    if (auth.error) return auth.error;

    await dbConnect();
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    if (category.isSystem) {
      return NextResponse.json({
        success: false,
        message: 'Core system categories (Eyeglasses, Sunglasses, Accessories, Add-ons, Perfume) cannot be deleted. You can toggle their active status if needed.'
      }, { status: 400 });
    }

    // Reparent subcategories if any
    await Category.updateMany(
      { parentId: id },
      { $set: { parentId: null, parentSlug: null } }
    );

    await Category.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('[Admin Categories DELETE]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
