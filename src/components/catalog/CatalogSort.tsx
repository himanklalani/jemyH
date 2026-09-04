'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'New Arrivals' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

export default function CatalogSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get('sort') || 'featured';
  const activeLabel = SORT_OPTIONS.find(o => o.id === currentSort)?.label || 'Featured';

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', id);
    }
    
    router.push(`/products?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 bg-white text-indigo-900 hover:bg-indigo-900/5 flex items-center gap-3 border border-indigo-900/10 shadow-sm"
      >
        <span className="opacity-50">Sort:</span>
        <span>{activeLabel}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-indigo-900/10 overflow-hidden z-50 py-2"
          >
            {SORT_OPTIONS.map((option) => {
              const isActive = option.id === currentSort;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between ${
                    isActive ? 'bg-indigo-900/5 text-indigo-900' : 'text-indigo-900/60 hover:bg-indigo-900/5 hover:text-indigo-900'
                  }`}
                >
                  {option.label}
                  {isActive && <Check size={14} className="text-gold-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
