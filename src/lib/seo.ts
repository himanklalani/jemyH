export function getProductJsonLd(product: any, region: 'US' | 'IN') {
  const priceObj = product.pricing?.[region];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jemy.shop';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images || [],
    sku: product.slug, // Using slug as SKU for now
    brand: {
      '@type': 'Brand',
      name: 'Jemy',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/shop/${product.category}/${product.slug}`,
      priceCurrency: region === 'US' ? 'USD' : 'INR',
      price: priceObj?.amount || 0,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function getArticleJsonLd(blog: any) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jemy.shop';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    image: [blog.coverImage],
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    author: [{
      '@type': 'Person',
      name: blog.author || 'Jemy Editorial',
    }],
    publisher: {
      '@type': 'Organization',
      name: 'Jemy',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`, // Placeholder for actual logo
      },
    },
  };
}
