import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jemy.shop';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/profile', '/checkout', '/wishlist'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
