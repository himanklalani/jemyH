'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { X, Check, Filter } from 'lucide-react';

const FILTER_CONFIG = [
  {
    id: 'category',
    label: 'Category',
    options: [
      { id: 'eyeglasses', label: 'Optical' },
      { id: 'sunglasses', label: 'Sunglasses' },
    ]
  },
  {
    id: 'shape',
    label: 'Frame Shape',
    options: [
      { id: 'round', label: 'Round' },
      { id: 'square', label: 'Square' },
      { id: 'aviator', label: 'Aviator' },
      { id: 'cat-eye', label: 'Cat-Eye' },
      { id: 'geometric', label: 'Geometric' },
    ]
  },
  {
    id: 'material',
    label: 'Material',
    options: [
      { id: 'acetate', label: 'Acetate' },
      { id: 'titanium', label: 'Titanium' },
      { id: 'mixed', label: 'Mixed Media' },
    ]
  },
  {
    id: 'size',
    label: 'Fit / Size',
    options: [
      { id: 's', label: 'Narrow (S)' },
      { id: 'm', label: 'Medium (M)' },
      { id: 'l', label: 'Wide (L)' },
    ]
  }
];

export default function CatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Local state to track selected filters before applying
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  // Sync local state with URL when opening
  useEffect(() => {
    if (isOpen) {
      const current: Record<string, string[]> = {};
      FILTER_CONFIG.forEach(group => {
        const val = searchParams.get(group.id);
        if (val) {
          current[group.id] = val.split(',');
        } else {
          current[group.id] = [];
        }
      });
      setSelectedFilters(current);
    }
  }, [isOpen, searchParams]);

  const toggleOption = (groupId: string, optionId: string) => {
    setSelectedFilters(prev => {
      const currentGroup = prev[groupId] || [];
      if (currentGroup.includes(optionId)) {
        return { ...prev, [groupId]: currentGroup.filter(id => id !== optionId) };
      } else {
        return { ...prev, [groupId]: [...currentGroup, optionId] };
      }
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      } else {
        params.delete(key);
      }
    });
    
    // Always reset page to 1 when changing filters
    params.delete('page');
    
    router.push(`/products?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const clearFilters = () => {
    setSelectedFilters({});
    
    // Instantly apply the clear action to the URL
    const params = new URLSearchParams(searchParams.toString());
    FILTER_CONFIG.forEach(group => {
      params.delete(group.id);
    });
    params.delete('page');
    
    router.push(`/products?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFilterCount = Array.from(searchParams.keys()).filter(k => FILTER_CONFIG.some(f => f.id === k)).length;

  return (
    <>
      {/* Inline Filter Button (Mobile & Desktop) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative px-4 sm:px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 bg-indigo-900 text-white hover:bg-gold-primary hover:text-indigo-950 flex items-center gap-2 sm:gap-3 border border-indigo-900/10 shadow-sm active:scale-95 shrink-0"
        aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} applied` : ''}`}
      >
        <Filter size={13} className="shrink-0" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 bg-gold-primary text-indigo-950 font-bold rounded-full text-[9px] shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>

      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-[100]"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#EAEBE6] z-[101] shadow-2xl flex flex-col border-l border-indigo-900/10"
                role="dialog"
                aria-modal="true"
                aria-labelledby="filters-heading"
              >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-indigo-900/10">
                <h2 id="filters-heading" className="font-display font-bold text-2xl text-indigo-900 uppercase tracking-tight">Filters</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-indigo-900/5 hover:bg-indigo-900/10 flex items-center justify-center text-indigo-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Facets - data-lenis-prevent stops Lenis from capturing wheel events inside the drawer */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8" data-lenis-prevent>
                {FILTER_CONFIG.map(group => (
                  <div key={group.id}>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-900/50 mb-4">
                      {group.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map(option => {
                        const isSelected = selectedFilters[group.id]?.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleOption(group.id, option.id)}
                            aria-pressed={isSelected}
                            className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                              isSelected 
                                ? 'bg-indigo-900 border-indigo-900 text-white shadow-md' 
                                : 'bg-transparent border-indigo-900/15 text-indigo-900 hover:border-indigo-900/40 hover:bg-indigo-900/5'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-indigo-900/10 bg-[#EAEBE6] flex gap-3">
                <button 
                  onClick={clearFilters}
                  className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-indigo-900 hover:bg-indigo-900/5 rounded-xl transition-colors"
                >
                  Clear All
                </button>
                <button 
                  onClick={applyFilters}
                  className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest bg-indigo-900 text-white hover:bg-gold-primary hover:text-indigo-950 rounded-xl transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>
);
}
