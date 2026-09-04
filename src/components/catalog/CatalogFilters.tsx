'use client';

import { useState, useEffect } from 'react';
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

  const activeFilterCount = Array.from(searchParams.keys()).filter(k => FILTER_CONFIG.some(f => f.id === k)).length;

  return (
    <>
      {/* Desktop Inline Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex relative px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 bg-indigo-900 text-white hover:bg-gold-primary hover:text-indigo-950 items-center gap-3 border border-indigo-900/10 shadow-sm"
      >
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 bg-white text-indigo-900 rounded-full text-[10px] shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile Sticky FAB */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-indigo-900 text-white shadow-2xl flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
      >
        <Filter size={20} />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-gold-primary text-indigo-950 font-bold rounded-full text-[10px] shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>

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
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-indigo-900/10">
                <h2 className="font-display font-bold text-2xl text-indigo-900 uppercase tracking-tight">Filters</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-indigo-900/5 hover:bg-indigo-900/10 flex items-center justify-center text-indigo-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Facets */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
      </AnimatePresence>
    </>
  );
}
