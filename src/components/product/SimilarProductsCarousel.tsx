'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PriceDisplay from '@/components/ui/PriceDisplay';

interface Product {
  _id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  pricing: { US?: { amount: number; currency: string; compareAtAmount?: number }; IN?: { amount: number; currency: string; compareAtAmount?: number } };
  stock: number;
}

export default function SimilarProductsCarousel({ currentSlug }: { currentSlug: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/products/${currentSlug}/similar`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProducts(d.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentSlug]);

  if (loading) {
    return (
      <div className="mt-24 border-t border-indigo-900/8 pt-16">
        <h2 className="font-display font-bold tracking-tight text-3xl text-indigo-900 mb-10 px-6 lg:px-12 max-w-[1600px] mx-auto">Similar Frames</h2>
        <div className="flex gap-6 overflow-hidden px-6 lg:px-12 max-w-[1600px] mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[280px] shrink-0 animate-pulse">
              <div className="aspect-[3/4] bg-indigo-900/5 rounded-2xl mb-4" />
              <div className="h-4 bg-indigo-900/5 rounded w-3/4 mb-2" />
              <div className="h-3 bg-indigo-900/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-24 border-t border-indigo-900/8 pt-16 pb-20 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display font-bold tracking-tight text-3xl text-indigo-900">Similar Frames</h2>
          <div className="hidden md:flex gap-2">
            <button 
              onClick={() => scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="w-10 h-10 rounded-full border border-indigo-900/20 flex items-center justify-center text-indigo-900 hover:bg-gold-primary hover:border-gold-primary transition-all"
            >
              &larr;
            </button>
            <button 
              onClick={() => scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="w-10 h-10 rounded-full border border-indigo-900/20 flex items-center justify-center text-indigo-900 hover:bg-gold-primary hover:border-gold-primary transition-all"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 lg:px-12 pb-12 pt-4 no-scrollbar max-w-[1600px] mx-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <motion.div
            key={product._id}
            className="w-[260px] md:w-[320px] shrink-0 snap-start group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
          >
            <Link href={`/products/${product.slug}`} className="block">
              <div className="relative aspect-[3/4] bg-[#F4F4F0] rounded-2xl overflow-hidden mb-5">
                {product.images?.[0] ? (
                  <>
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                    />
                    {product.images[1] && (
                      <img
                        src={product.images[1]}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display font-bold text-6xl text-indigo-900/10">J</span>
                  </div>
                )}
                
                <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[0.16,1,0.3,1]">
                  <div className="bg-white text-indigo-950 font-bold uppercase tracking-widest text-[10px] py-3 text-center rounded-xl shadow-xl">
                    View Details
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base text-indigo-900 group-hover:text-gold-primary transition-colors truncate">{product.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-indigo-900/50 mt-1 capitalize font-mono">{product.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <PriceDisplay pricing={product.pricing} className="text-sm" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      
      {/* CSS to hide scrollbar for webkit (Chrome/Safari) */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
