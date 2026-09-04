'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useRegionStore } from '@/store/useRegionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ScanFace, Ruler, ShieldCheck, Truck, RotateCcw, Heart, Share2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import FaceShapeQuizModal from '@/components/eyewear/FaceShapeQuizModal';
import FrameMeasurementGuide from '@/components/eyewear/FrameMeasurementGuide';
import LensConfiguratorModal from '@/components/eyewear/LensConfiguratorModal';
import FitGuide from '@/components/eyewear/FitGuide';
import SimilarProductsCarousel from '@/components/product/SimilarProductsCarousel';
import ProductAccordion from '@/components/product/ProductAccordion';
import ProductTypeSelector, { ProductType } from '@/components/product/ProductTypeSelector';
import ProductHighlightsTabs from '@/components/product/ProductHighlightsTabs';
import InspirationLooks from '@/components/product/InspirationLooks';
import ProductReviews from '@/components/product/ProductReviews';
import Link from 'next/link';

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { openCart } = useCartStore();
  const { region } = useRegionStore();

  const [product, setProduct]           = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [isFaceQuizOpen, setFaceQuiz]   = useState(false);
  const [isMeasureOpen, setMeasure]     = useState(false);
  const [isRxOpen, setRxOpen]           = useState(false);
  const [adding, setAdding]             = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // New states for User Selection
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize]   = useState<string>('');
  const [selectedType, setSelectedType]   = useState<ProductType>('Powered Eyeglass');

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProduct(d.product);
          setSelectedColor(d.product.frameColor || 'Black');
          setSelectedSize(d.product.frameSize || 'M');
        } else {
          router.push('/products');
        }
      })
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async (config?: any) => {
    setAdding(true);
    try {
      const payloadConfig = { 
        ...config, 
        frameColor: selectedColor || product.frameColor,
        frameSize: selectedSize || product.frameSize,
        productType: selectedType
      };
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1, config: payloadConfig }),
      });
      if (res.ok) {
        setAddedFeedback(true);
        setTimeout(() => setAddedFeedback(false), 2000);
        openCart();
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEBE6] pt-[68px]">
        <Loader2 size={32} className="animate-spin text-gold-primary" />
      </div>
    );
  }
  if (!product) return null;

  const price          = region === 'US' ? product.pricing?.US?.amount : product.pricing?.IN?.amount;
  const compareAt      = region === 'US' ? product.pricing?.US?.compareAtAmount : undefined;
  const currency       = region === 'US' ? 'USD' : 'INR';
  const formatted      = price ? new Intl.NumberFormat(region === 'US' ? 'en-US' : 'en-IN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(price) : 'Contact for price';
  const compareFormatted = compareAt ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(compareAt) : null;
  const images         = product.images?.length ? product.images : [null];

  const specs = [
    product.frameMaterial  && { label: 'Material',      value: product.frameMaterial },
    product.frameShape     && { label: 'Shape',         value: product.frameShape },
    product.frameColor     && { label: 'Color',         value: product.frameColor },
    product.frameSize      && { label: 'Size',          value: product.frameSize },
    product.dimensions?.lensWidth    && { label: 'Lens Width',   value: `${product.dimensions.lensWidth}mm` },
    product.dimensions?.bridgeWidth  && { label: 'Bridge',       value: `${product.dimensions.bridgeWidth}mm` },
    product.dimensions?.templeLength && { label: 'Temple',       value: `${product.dimensions.templeLength}mm` },
    product.gender         && { label: 'Gender',        value: product.gender },
  ].filter(Boolean) as { label: string; value: string }[];

  // Helper for Ideal Face Shapes
  const getIdealFaces = (shape: string) => {
    const map: Record<string, string[]> = {
      'round': ['Square', 'Heart', 'Oval'],
      'square': ['Round', 'Oval'],
      'geometric': ['Oval', 'Round'],
      'aviator': ['Square', 'Heart', 'Oval'],
      'cat-eye': ['Square', 'Oval', 'Heart'],
      'rectangle': ['Round', 'Heart'],
    };
    return map[shape?.toLowerCase()] || ['All Face Shapes'];
  };

  const idealFaces = getIdealFaces(product.frameShape);
  const sizeOptions = [
    { id: 'S', label: 'Narrow Fit' },
    { id: 'M', label: 'Regular Fit' },
    { id: 'L', label: 'Wide Fit' }
  ];

  // Derive some elegant color swatches based on product color
  const colorSwatches = [
    { name: product.frameColor || 'Black', hex: product.frameColor?.toLowerCase() === 'tortoiseshell' ? 'linear-gradient(45deg, #4A2E1B, #9E6C3A)' : (product.frameColor?.toLowerCase() === 'silver' || product.frameColor?.toLowerCase() === 'titanium' ? '#C0C0C0' : '#1A1F2C') },
    { name: 'Onyx Black', hex: '#11131A' },
    { name: 'Clear Acetate', hex: '#EAEBE6' }
  ];

  return (
    <>
      <FaceShapeQuizModal isOpen={isFaceQuizOpen} onClose={() => setFaceQuiz(false)} />
      <FrameMeasurementGuide
        isOpen={isMeasureOpen}
        onClose={() => setMeasure(false)}
        lensWidth={product.dimensions?.lensWidth}
        bridgeWidth={product.dimensions?.bridgeWidth}
        templeLength={product.dimensions?.templeLength}
      />
      <LensConfiguratorModal
        isOpen={isRxOpen}
        onClose={() => setRxOpen(false)}
        onAddToCart={addToCart}
        productName={product.name}
      />

      <div className="min-h-screen bg-[#EAEBE6] pt-[68px]">

        {/* Breadcrumb */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-6">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-indigo-900/40 font-semibold">
            <Link href="/" className="hover:text-gold-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-gold-primary transition-colors">Frames</Link>
            <span>/</span>
            <span className="text-indigo-900/70 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

            {/* ─── Left: Image Stack ─── */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {images.map((img: string | null, i: number) => (
                <div key={i} className="relative w-full aspect-[4/3] md:aspect-square bg-[#F4F4F0] rounded-3xl overflow-hidden group">
                  {img ? (
                    <img 
                      src={img} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display font-bold text-9xl text-indigo-900/10">J</span>
                    </div>
                  )}

                  {/* Badges on first image */}
                  {i === 0 && product.requiresPrescription && (
                    <div className="absolute top-6 left-6 bg-gold-primary text-indigo-950 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg">
                      Rx Ready
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ─── Right: Sticky Info & CTA ─── */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-28 flex flex-col pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16,1,0.3,1] }}
              >
                <p className="text-[11px] uppercase tracking-[0.15em] text-gold-primary font-semibold mb-3">
                  Jemy - {product.category === 'sunglasses' ? 'Sunglasses' : 'Eyeglasses'}
                </p>

                <h1 className="font-display font-bold leading-none tracking-[-0.03em] text-indigo-900 mb-5 text-balance" style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-end gap-3 mb-8">
                  <span className="font-mono tabular-nums text-3xl font-semibold text-indigo-900">{formatted}</span>
                  {compareFormatted && (
                    <span className="font-mono tabular-nums text-indigo-900/35 line-through text-lg mb-0.5">{compareFormatted}</span>
                  )}
                  {compareFormatted && (
                    <span className="text-red-500 text-[11px] font-bold uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded mb-0.5">Sale</span>
                  )}
                </div>

                <div className="mb-8">
                  <ProductAccordion description={product.description} />
                </div>

                {/* --- NEW: Selection Configuration --- */}
                <div className="space-y-8 mb-10">
                  
                  <ProductTypeSelector selectedType={selectedType} onChange={setSelectedType} />
                  
                  {/* Color Selection */}
                  <div>
                    <h3 className="font-display font-bold text-xl text-indigo-900 mb-4">Frame Color</h3>
                    <div className="flex gap-4">
                      {colorSwatches.map((swatch, idx) => {
                        const isActive = selectedColor === swatch.name;
                        const isFewLeft = idx === 1; // Mocking "Few Left" for the second option
                        return (
                          <div key={idx} className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => setSelectedColor(swatch.name)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isActive ? 'border-indigo-900' : 'border-transparent hover:border-indigo-900/30'
                              }`}
                            >
                              <div 
                                className={`w-9 h-9 rounded-full shadow-sm transition-transform ${isActive ? 'scale-90' : 'scale-100'}`}
                                style={{ background: swatch.hex }}
                              />
                            </button>
                            {isFewLeft && (
                              <span className="text-[10px] font-bold text-orange-500 tracking-tight">Few Left</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Predetermined Size Tag */}
                  {product.frameSize && (
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">Predetermined Frame Size</span>
                        <button onClick={() => setMeasure(true)} className="text-[10px] uppercase tracking-wider text-indigo-900/50 underline hover:text-gold-primary transition-colors">Size Guide</button>
                      </div>
                      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-indigo-900/10 bg-white">
                        <span className="text-[14px] font-bold text-indigo-900">{product.frameSize}</span>
                        <span className="w-px h-4 bg-indigo-900/10"></span>
                        <span className="text-[10px] uppercase tracking-wider text-indigo-900/60">
                          {sizeOptions.find(s => s.id === product.frameSize)?.label || 'Standard Fit'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Ideal Fit recommendation */}
                  {product.frameShape && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block mb-3">Ideal For Face Shapes</span>
                      <div className="flex flex-wrap gap-2">
                        {idealFaces.map((face) => (
                          <span key={face} className="px-3 py-1.5 bg-indigo-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {face}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
                {/* --- END NEW --- */}

                {/* Education triggers */}
                <div className="grid grid-cols-2 gap-3 mb-10">
                  <button
                    onClick={() => setFaceQuiz(true)}
                    className="flex flex-col items-start p-4 rounded-xl border border-indigo-900/8 bg-white hover:border-gold-primary hover:bg-gold-primary/5 transition-all duration-200 group text-left"
                  >
                    <ScanFace size={18} className="text-indigo-900/35 group-hover:text-gold-primary mb-2 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-0.5">Face Shape Quiz</span>
                    <span className="text-[10px] text-indigo-900/45">Find your perfect fit</span>
                  </button>
                  <button
                    onClick={() => setMeasure(true)}
                    className="flex flex-col items-start p-4 rounded-xl border border-indigo-900/8 bg-white hover:border-gold-primary hover:bg-gold-primary/5 transition-all duration-200 group text-left"
                  >
                    <Ruler size={18} className="text-indigo-900/35 group-hover:text-gold-primary mb-2 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-0.5">
                      {product.dimensions?.lensWidth ? `${product.dimensions.lensWidth}-${product.dimensions.bridgeWidth}-${product.dimensions.templeLength}` : 'Dimensions'}
                    </span>
                    <span className="text-[10px] text-indigo-900/45">Measurement guide</span>
                  </button>
                </div>

                {product.frameSize && (
                  <div className="mb-10">
                    <FitGuide frameSize={product.frameSize} dimensions={product.dimensions} />
                  </div>
                )}

                {/* Primary CTA */}
                <div className="space-y-3 mb-10">
                  {product.requiresPrescription ? (
                    <button
                      onClick={() => setRxOpen(true)}
                      className="w-full flex items-center justify-between bg-indigo-900 text-platinum-100 px-7 py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.12em] hover:bg-gold-primary hover:text-indigo-900 transition-all duration-300 hover:scale-[1.01]"
                    >
                      <span>Configure Lenses & Add to Cart</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => addToCart()}
                      disabled={adding}
                      className={`w-full flex items-center justify-between px-7 py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.12em] transition-all duration-300 hover:scale-[1.01] disabled:opacity-60 ${
                        addedFeedback
                          ? 'bg-green-500 text-white'
                          : 'bg-indigo-900 text-platinum-100 hover:bg-gold-primary hover:text-indigo-900'
                      }`}
                    >
                      <span>{adding ? 'Adding…' : addedFeedback ? '✓ Added to Cart' : 'Add to Cart'}</span>
                      {adding ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    </button>
                  )}

                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 border border-indigo-900/12 text-indigo-900/60 hover:text-gold-primary hover:border-gold-primary px-4 py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-200">
                      <Heart size={14} /> Wishlist
                    </button>
                    <button className="flex items-center justify-center gap-2 border border-indigo-900/12 text-indigo-900/60 hover:text-gold-primary hover:border-gold-primary px-4 py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-200">
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Horizontal Benefits Row */}
                <div className="grid grid-cols-3 gap-2 border-t border-indigo-900/10 pt-8 mt-10">
                  {[
                    { icon: RotateCcw, title: 'No Questions Asked Returns' },
                    { icon: ShieldCheck, title: 'Easy 14 day Exchange' },
                    { icon: ShieldCheck, title: '365 days Warranty' },
                  ].map(({ icon: Icon, title }) => (
                    <div key={title} className="flex flex-col items-center text-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center shadow-sm">
                        <Icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-900 leading-tight max-w-[12ch]">
                        {title}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
          </div> {/* Closes grid-cols-12 (line 116) */}

          {/* ─── Technical Specs ─── */}
          {specs.length > 0 && (
            <div className="mt-20 border-t border-indigo-900/8 pt-16 mb-16">
              <h2 className="font-display font-bold tracking-tight text-3xl text-indigo-900 mb-10 text-balance">Frame Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {specs.map(spec => (
                  <div key={spec.label} className="bg-white rounded-2xl p-5 border border-indigo-900/5">
                    <p className="text-[10px] uppercase tracking-widest text-indigo-900/40 font-semibold mb-2">{spec.label}</p>
                    <p className="font-display font-bold text-xl text-indigo-900 capitalize">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <ProductHighlightsTabs />
        </div>
      </div>
      <InspirationLooks />
      
      <ProductReviews productId={product._id.toString()} />
      
      {/* ─── Similar Products Carousel ─── */}
      <SimilarProductsCarousel currentSlug={product.slug} />
    </>
  );
}
