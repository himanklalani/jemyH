import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongoose';
import { Product } from '@/models/Product';
// import Blog from '@/models/Blog'; // Uncomment when Blog model is created

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jemy.shop';
  
  await dbConnect();
  
  // Fetch active products
  const products = await Product.find({ stock: { $gt: 0 } }).select('slug category updatedAt').lean();
  
  // Static Routes
  const staticRoutes = ['', '/about', '/contact', '/shop/sunglasses', '/shop/eyeglasses', '/shop/perfume'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
    alternates: {
      languages: {
        'en-US': `${baseUrl}${route}`,
        'en-IN': `${baseUrl}${route}`,
        'x-default': `${baseUrl}${route}`,
      },
    },
  }));

  // Dynamic Product Routes
  const productRoutes = products.map((product: any) => ({
    url: `${baseUrl}/shop/${product.category}/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
    alternates: {
      languages: {
        'en-US': `${baseUrl}/shop/${product.category}/${product.slug}`,
        'en-IN': `${baseUrl}/shop/${product.category}/${product.slug}`,
        'x-default': `${baseUrl}/shop/${product.category}/${product.slug}`,
      },
    },
  }));

  return [...staticRoutes, ...productRoutes];
}
