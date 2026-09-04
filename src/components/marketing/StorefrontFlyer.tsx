'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function StorefrontFlyer({ flyerData }: { flyerData: any }) {
  const [flyer, setFlyer] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (flyerData) {
      // Session-scoped dismissal: use sessionStorage so each new browser session
      // can show the popup again, even if the same campaign is still active.
      // Only suppressed if explicitly dismissed in this session.
      const dismissedId = sessionStorage.getItem('dismissed_flyer_id');
      if (dismissedId !== flyerData._id) {
        setFlyer(flyerData);
        const timer = setTimeout(() => setIsVisible(true), 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [flyerData]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (flyer) {
      sessionStorage.setItem('dismissed_flyer_id', flyer._id);
    }
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!flyer) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-[800px] bg-[var(--theme-bg)] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-[var(--theme-text)] hover:bg-black/20 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Left Image Section */}
            {flyer.imageUrl && (
              <div className="w-full md:w-1/2 aspect-square md:aspect-auto">
                <img src={flyer.imageUrl} alt={flyer.altText || flyer.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Right Content Section */}
            <div className={`p-8 md:p-12 flex flex-col justify-center ${flyer.imageUrl ? 'w-full md:w-1/2' : 'w-full text-center'}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-primary mb-4">
                {flyer.offerId?.title || 'Exclusive Offer'}
              </span>
              
              <h2 className="font-display font-bold uppercase leading-[0.9] tracking-[-0.03em] text-4xl mb-4 text-[var(--theme-text)]">
                {flyer.title}
              </h2>
              
              {flyer.subtitle && (
                <p className="text-[var(--theme-text)]/60 text-sm leading-relaxed mb-8">
                  {flyer.subtitle}
                </p>
              )}

              {/* Coupon Block */}
              {flyer.linkedCoupon && (
                <div className="mb-8 p-4 border border-dashed border-[var(--theme-text)]/30 rounded-xl bg-[var(--theme-text)]/[0.02] flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--theme-text)]/50 uppercase tracking-widest font-bold mb-1">Use Code</p>
                    <p className="font-mono font-bold text-xl text-[var(--theme-text)]">{flyer.linkedCoupon.code}</p>
                  </div>
                  <button 
                    onClick={() => copyCoupon(flyer.linkedCoupon.code)}
                    className="p-3 bg-[var(--theme-text)]/5 hover:bg-[var(--theme-text)]/10 rounded-lg text-[var(--theme-text)] transition-colors"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <Link
                  href={flyer.linkUrl || '/products'}
                  onClick={handleDismiss}
                  className="bg-[var(--theme-text)] text-[var(--theme-bg)] px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.15em] hover:scale-105 transition-transform text-center w-full"
                >
                  {flyer.ctaText || 'Shop Now'}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
