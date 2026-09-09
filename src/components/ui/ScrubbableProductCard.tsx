'use client';

import { useState, useRef, MouseEvent, TouchEvent } from 'react';
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
  // Touch scrub support
  const touchStartX = useRef<number>(0);

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

  // Touch: swipe left/right to cycle images on mobile
  const handleTouchStart = (e: TouchEvent<HTMLAnchorElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: TouchEvent<HTMLAnchorElement>) => {
    if (images.length <= 1) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 30) return; // ignore tiny taps
    if (delta < 0) {
      setActiveIndex(prev => Math.min(prev + 1, images.length - 1));
    } else {
      setActiveIndex(prev => Math.max(prev - 1, 0));
    }
  };

  // Wishlist event logger
  const handleWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch('/api/events/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', productId: product._id })
      });
    } catch (err) {
      console.error('Failed to log cart event', err);
    }
    e.currentTarget.classList.add('text-red-500', 'bg-white');
  };

  // If no images exist, fallback
  if (images.length === 0) {
    images.push('/images/product_placeholder.png');
  }

  return (
    // Wrapper div: positions both the Link and the wishlist button
    <div className={`product-card group relative ${className}`}>
      <Link
        href={`/products/${product.slug}`}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={`View ${product.name}`}
        className={`block relative ${aspectClass} bg-[var(--theme-text)]/5 rounded-3xl overflow-hidden mb-5`}
        style={{ cursor: isHovered ? 'ew-resize' : 'default' }}
      >
        {/* Images Layered for Crossfade */}
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={i === 0 ? product.name : ''}
            aria-hidden={i !== 0}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{
              opacity: activeIndex === i ? 1 : 0,
              zIndex: activeIndex === i ? 10 : 0
            }}
          />
        ))}

        {/* Progress Bar Indicators */}
        {images.length > 1 && (
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 transition-opacity duration-300"
            style={{ opacity: isHovered ? 1 : 0 }}
            aria-hidden="true"
          >
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${activeIndex === i ? 'w-6 bg-gold-primary' : 'w-2 bg-black/20'}`}
              />
            ))}
          </div>
        )}

        {/* Subtle Navigation Arrows Overlay (visual hint only, mouse scrub is the real interaction) */}
        <div
          className="absolute inset-0 flex items-center justify-between px-4 z-20 pointer-events-none transition-all duration-500"
          aria-hidden="true"
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
      </Link>

      {/* Wishlist button: sibling to Link, NOT nested inside it (valid HTML + screen reader fix) */}
      <div
        className="absolute top-4 right-4 z-30 transition-all duration-500"
        style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(-10px)', pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        <button
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-black hover:bg-white hover:text-red-500 transition-colors shadow-sm"
          onClick={handleWishlist}
          aria-label={`Add ${product.name} to wishlist`}
        >
          <Heart size={18} />
        </button>
      </div>

      <div className="flex flex-col items-start px-1 mt-2 gap-0.5">
        <div className="flex justify-between w-full items-start gap-1">
          <h3 className="font-display font-bold text-[13px] md:text-lg leading-[1.1] text-[var(--theme-text)] group-hover:text-gold-primary transition-colors line-clamp-2 pr-1">{product.name}</h3>
          <span className="text-[11px] md:text-sm font-semibold text-[var(--theme-text)] font-mono tabular-nums shrink-0 pt-[2px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {product.pricing?.US ? `$${product.pricing.US.amount}` : product.pricing?.IN ? `₹${product.pricing.IN.amount}` : '-'}
          </span>
        </div>
        <p className="text-[9px] md:text-[11px] uppercase tracking-widest text-[var(--theme-text)]/50 capitalize font-mono mt-1">{product.category}</p>
      </div>
    </div>
  );
}

