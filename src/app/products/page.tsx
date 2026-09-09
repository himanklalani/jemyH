'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogSort from '@/components/catalog/CatalogSort';

interface Product {
  _id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  pricing: { US?: { amount: number; compareAtAmount?: number }; IN?: { amount: number } };
  requiresPrescription?: boolean;
}

// Quick-filter chip definitions (design-taste-frontend skill: tactile pill chips over generic sidebar)
const QUICK_FILTERS = [
  { label: 'All',        param: null,       value: null },
  { label: 'Sunglasses', param: 'category', value: 'sunglasses' },
  { label: 'Optical',    param: 'category', value: 'eyeglasses' },
  { label: 'Accessories',param: 'category', value: 'accessories' },
  { label: 'Titanium',   param: 'material', value: 'titanium' },
  { label: 'Acetate',    param: 'material', value: 'acetate' },
  { label: 'Round',      param: 'shape',    value: 'round' },
  { label: 'Geometric',  param: 'shape',    value: 'geometric' },
  { label: 'Aviator',    param: 'shape',    value: 'aviator' },
] as const;

// Human-readable labels for active filter dismissal badges
const FILTER_LABELS: Record<string, Record<string, string>> = {
  category: { sunglasses: 'Sunglasses', eyeglasses: 'Optical', accessories: 'Accessories', addon: 'Add-ons' },
  shape:    { round: 'Round', square: 'Square', aviator: 'Aviator', 'cat-eye': 'Cat-Eye', geometric: 'Geometric' },
  material: { acetate: 'Acetate', titanium: 'Titanium', mixed: 'Mixed Media' },
  size:     { s: 'Narrow (S)', m: 'Medium (M)', l: 'Wide (L)' },
};

const FILTER_KEYS = ['category', 'shape', 'material', 'size'];

/* ── Quick-filter pill bar ─────────────────────────────────────── */
function QuickFilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleChip = (param: string | null, value: string | null) => {
    if (!param) {
      router.push('/products', { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.get(param) === value ? params.delete(param) : params.set(param, value!);
    params.delete('page');
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const isAllActive = !Array.from(searchParams.keys()).some(k => FILTER_KEYS.includes(k));

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="group" aria-label="Quick filters">
      {QUICK_FILTERS.map(chip => {
        const isActive = chip.param === null
          ? isAllActive
          : searchParams.get(chip.param) === chip.value;
        return (
          <button
            key={chip.label}
            onClick={() => handleChip(chip.param as string | null, chip.value as string | null)}
            aria-pressed={isActive}
            className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 border whitespace-nowrap ${
              isActive
                ? 'bg-indigo-900 border-indigo-900 text-white shadow-md'
                : 'bg-transparent border-indigo-900/15 text-indigo-900/70 hover:border-indigo-900/40 hover:bg-indigo-900/5 hover:text-indigo-900'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Active filter dismissal badges ───────────────────────────── */
function ActiveFilterBadges() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeFilters: { key: string; value: string; label: string }[] = [];
  FILTER_KEYS.forEach(key => {
    const val = searchParams.get(key);
    if (val) {
      val.split(',').forEach(v => {
        activeFilters.push({ key, value: v, label: FILTER_LABELS[key]?.[v] ?? v });
      });
    }
  });

  if (activeFilters.length === 0) return null;

  const removeFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const updated = (params.get(key)?.split(',') ?? []).filter(v => v !== value);
    updated.length === 0 ? params.delete(key) : params.set(key, updated.join(','));
    params.delete('page');
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Active filters">
      {activeFilters.map(f => (
        <button
          key={`${f.key}-${f.value}`}
          onClick={() => removeFilter(f.key, f.value)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-900/15 text-indigo-900 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 group"
          aria-label={`Remove filter: ${f.label}`}
        >
          {f.label}
          <X size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
        </button>
      ))}
      <button
        onClick={() => router.push('/products', { scroll: false })}
        className="text-[10px] font-bold uppercase tracking-widest text-indigo-900/40 hover:text-red-500 transition-colors ml-1"
      >
        Clear all
      </button>
    </div>
  );
}

/* ── Catalog grid ─────────────────────────────────────────────── */
function CatalogGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentShape    = searchParams.get('shape') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentMaterial = searchParams.get('material') || '';
  const currentSize     = searchParams.get('size') || '';
  const currentSort     = searchParams.get('sort') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '24');
    if (currentShape)    params.set('shape', currentShape);
    if (currentCategory) params.set('category', currentCategory);
    if (currentMaterial) params.set('material', currentMaterial);
    if (currentSize)     params.set('size', currentSize);
    if (currentSort)     params.set('sort', currentSort);

    fetch(`/api/products?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setProducts(d.products); setTotal(d.pagination?.total || d.products.length); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentShape, currentCategory, currentMaterial, currentSize, currentSort]);

  const clearAllFilters = () => router.push('/products', { scroll: false });

  return (
    <>
      {/* Count + active badges - aria-live="polite" announces filter result changes to screen readers */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-6 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="text-[11px] uppercase tracking-widest text-indigo-900/40 font-semibold"
            aria-live="polite"
            aria-atomic="true"
          >
            {loading ? 'Loading\u2026' : `${total} frame${total !== 1 ? 's' : ''} found`}
          </p>
          <Suspense>
            <ActiveFilterBadges />
          </Suspense>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-indigo-900/5 rounded-2xl mb-4" />
                <div className="h-4 bg-indigo-900/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-indigo-900/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <p className="font-display font-bold text-3xl text-indigo-900 mb-3 text-balance">No frames match.</p>
            <p className="text-indigo-900/50 text-sm mb-6 max-w-[65ch] mx-auto" style={{ textWrap: 'pretty' } as React.CSSProperties}>Try adjusting or clearing your filters.</p>
            <button onClick={clearAllFilters} className="inline-flex items-center gap-2 bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-gold-primary hover:text-indigo-900 transition-all">
              Clear Filters
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {products.map(product => (
              <motion.div
                key={product._id}
                variants={{
                  hidden: { opacity: 0, y: 60, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16,1,0.3,1] } }
                }}
              >
                <Link href={`/products/${product.slug}`} className="group block">
                  <div className="relative aspect-[3/4] bg-[#F4F4F0] rounded-2xl overflow-hidden mb-5">
                    {product.images?.[0] ? (
                      <>
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                        />
                        {product.images[1] && (
                          <img
                            src={product.images[1]}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display font-bold text-6xl text-indigo-900/10" aria-hidden="true">J</span>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {product.category === 'eyeglasses' && (
                        <span className="bg-gold-primary text-indigo-950 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Rx Ready</span>
                      )}
                      {product.pricing?.US?.compareAtAmount && (
                        <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Sale</span>
                      )}
                    </div>

                    <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[0.16,1,0.3,1]">
                      <div className="bg-white text-indigo-950 font-bold uppercase tracking-widest text-[10px] py-3 text-center rounded-xl shadow-xl">
                        Shop Frame
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start gap-2 mt-1">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-display font-bold text-lg text-indigo-900 group-hover:text-gold-primary transition-colors line-clamp-2 min-h-[3.2rem] md:min-h-0 md:truncate leading-tight">{product.name}</h3>
                      <p className="text-[11px] uppercase tracking-widest text-indigo-900/50 mt-1 capitalize font-mono">{product.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {/* tabular-nums: better-typography rule 11 - prevents price layout shift */}
                      <p className="text-sm font-semibold text-indigo-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {product.pricing?.US ? `$${product.pricing.US.amount}` : product.pricing?.IN ? `\u20b9${product.pricing.IN.amount}` : '-'}
                      </p>
                      {product.pricing?.US?.compareAtAmount && (
                        <p className="text-xs text-indigo-900/35 line-through font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>${product.pricing.US.compareAtAmount}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function ProductsCatalogPage() {
  return (
    <div className="w-full min-h-screen bg-[#EAEBE6] pt-[68px]">

      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-16 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-primary mb-4">Jemy Collection</p>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <h1
              className="font-display font-bold text-indigo-900 leading-none tracking-[-0.025em] text-balance"
              style={{ fontSize: 'var(--text-display)' }}
            >
              All Frames
            </h1>
            <div className="flex items-center gap-6">
              <Link
                href="/products?category=sunglasses"
                className="hidden md:inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-900/50 hover:text-gold-primary transition-colors border-b border-indigo-900/20 pb-0.5 hover:border-gold-primary"
              >
                Sunglasses Only <ArrowRight size={12} />
              </Link>
              <Suspense fallback={<div className="h-10 w-24 bg-indigo-900/5 rounded-full animate-pulse" />}>
                <CatalogSort />
                <CatalogFilters />
              </Suspense>
            </div>
          </div>

          {/* Quick-filter pill bar - 1-tap shortcuts to most-used facets */}
          <Suspense>
            <QuickFilterBar />
          </Suspense>
        </motion.div>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-900/20 border-t-gold-primary rounded-full animate-spin" /></div>}>
        <CatalogGrid />
      </Suspense>
    </div>
  );
}
