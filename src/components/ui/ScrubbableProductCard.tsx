'use client';

import { useState, useRef, MouseEvent } from 'react';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrubbableProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    category: string;
    pricing?: any;
    images?: string[];
  };
  mockImages?: string[]; // Fallback to showcase the scrub feature if product lacks 4 images
  aspectClass?: string;
  className?: string;
}

export default function ScrubbableProductCard({ product, mockImages, aspectClass = 'aspect-[3/4]', className = '' }: ScrubbableProductCardProps) {
  const images = (mockImages || product.images || []).filter(img => typeof img === 'string' && img.trim() !== '');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!containerRef.current || images.length <= 1) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - left);
    const segment = width / images.length;
    const newIndex = Math.min(Math.floor(x / segment), images.length - 1);
    setActiveIndex(newIndex);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveIndex(0);
  };

  // If no images exist, fallback
  if (images.length === 0) {
    images.push('/images/product_placeholder.png');
  }

  return (
    <div className={`product-card group relative ${className}`}>
      <Link 
        href={`/products/${product.slug}`}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`block relative ${aspectClass} bg-[var(--theme-text)]/5 rounded-3xl overflow-hidden mb-5`}
        style={{ cursor: isHovered ? 'ew-resize' : 'default' }}
      >
        {/* Images Layered for Crossfade */}
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${product.name} view ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{ 
              opacity: activeIndex === i ? 1 : 0,
              zIndex: activeIndex === i ? 10 : 0
            }}
          />
        ))}

        {/* Progress Bar Indicators */}
        <div 
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          {images.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${activeIndex === i ? 'w-6 bg-gold-primary' : 'w-2 bg-black/20'}`} 
            />
          ))}
        </div>

        {/* Subtle Navigation Arrows Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-between px-4 z-20 pointer-events-none transition-all duration-500"
          style={{ 
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'scale(1)' : 'scale(0.95)'
          }}
        >
          <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-black shadow-sm">
            <ChevronLeft size={16} />
          </div>
          <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-black shadow-sm">
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Wishlist Heart overlay */}
        <div 
          className="absolute top-4 right-4 z-30 transition-all duration-500 transform"
          style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(-10px)' }}
        >
          <button 
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-black hover:bg-white hover:text-red-500 transition-colors pointer-events-auto shadow-sm"
            onClick={async (e) => {
              e.preventDefault(); 
              // Log event for Admin Dashboard Cart Activity Feed
              try {
                await fetch('/api/events/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'add', productId: product._id })
                });
              } catch (err) {
                console.error('Failed to log cart event', err);
              }
              // Basic feedback
              e.currentTarget.classList.add('text-red-500', 'bg-white');
            }}
          >
            <Heart size={18} />
          </button>
        </div>
      </Link>

      <div className="flex flex-col items-start px-1 mt-2 gap-0.5">
        <div className="flex justify-between w-full items-start gap-1">
          <h3 className="font-display font-bold text-[13px] md:text-lg leading-[1.1] text-[var(--theme-text)] group-hover:text-gold-primary transition-colors line-clamp-2 pr-1">{product.name}</h3>
          <span className="text-[11px] md:text-sm font-semibold text-[var(--theme-text)] font-mono tabular-nums shrink-0 pt-[2px]">
            {product.pricing?.US ? `$${product.pricing.US.amount}` : product.pricing?.IN ? `₹${product.pricing.IN.amount}` : '-'}
          </span>
        </div>
        <p className="text-[9px] md:text-[11px] uppercase tracking-widest text-[var(--theme-text)]/50 capitalize font-mono mt-1">{product.category}</p>
      </div>
    </div>
  );
}
