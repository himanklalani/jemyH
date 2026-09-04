'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { useAddToCart } from '@/hooks/useCart';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    category: string;
    images: string[];
    pricing: {
      US?: { amount: number; currency: string; compareAtAmount?: number };
      IN?: { amount: number; currency: string; compareAtAmount?: number };
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images[0] || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
  const hoverImage = product.images[1] || primaryImage;
  
  const addToCart = useAddToCart();

  return (
    <div className="group relative flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-platinum-200 dark:bg-indigo-950">
        <Link href={`/shop/${product.category}/${product.slug}`} className="block h-full w-full">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover object-center transition-opacity duration-500 group-hover:opacity-0"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
          <Image
            src={hoverImage}
            alt={`View ${product.name} alternate angle`}
            fill
            className="absolute inset-0 object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        </Link>
        
        {/* Prescription Badge */}
        {product.category === 'eyeglasses' && (
          <div className="absolute left-3 top-3 rounded bg-gold-primary px-2 py-1 text-[10px] font-bold tracking-widest text-indigo-950 uppercase shadow-sm pointer-events-none">
            Rx Ready
          </div>
        )}

        {/* Quick Actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0 bg-gradient-to-t from-indigo-950/80 to-transparent">
          <button
            onClick={() => addToCart.mutate({ productId: product._id, quantity: 1 })}
            disabled={addToCart.isPending}
            className="flex w-full items-center justify-center gap-2 rounded bg-platinum-100 py-3 text-xs font-semibold tracking-widest text-indigo-900 uppercase hover:bg-gold-primary transition-colors disabled:opacity-50"
          >
            {addToCart.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-900 border-t-transparent" />
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Quick Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action: Quick Wishlist */}
      <button 
        className="absolute right-3 top-3 rounded-full bg-platinum-100/80 p-2 text-indigo-900 opacity-0 backdrop-blur transition-all duration-300 hover:bg-platinum-100 hover:text-gold-primary group-hover:opacity-100 dark:bg-indigo-900/80 dark:text-platinum-100 dark:hover:bg-indigo-900"
        aria-label="Add to wishlist"
      >
        <Heart className="h-4 w-4" />
      </button>

      {/* Details */}
      <div className="mt-4 flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-2">
          <Link href={`/shop/${product.category}/${product.slug}`} className="font-serif text-[13px] sm:text-lg font-medium leading-tight text-indigo-900 hover:text-gold-primary dark:text-platinum-100 dark:hover:text-gold-light transition-colors line-clamp-2">
            {product.name}
          </Link>
          <PriceDisplay pricing={product.pricing} className="text-[11px] sm:text-sm shrink-0" />
        </div>
        <p className="text-sm text-indigo-900/60 dark:text-platinum-100/60 capitalize">
          {product.category}
        </p>
      </div>
    </div>
  );
}
