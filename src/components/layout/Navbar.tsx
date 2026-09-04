'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Search, ShoppingBag, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useRegionStore } from '@/store/useRegionStore';

const MENU_LINKS = [
  { num: '01', label: 'Home', href: '/' },
  { num: '02', label: 'Sunglasses', href: '/products?category=sunglasses' },
  { num: '03', label: 'Eyeglasses', href: '/products?category=eyeglasses' },
  { num: '04', label: 'Shop', href: '/products' },
  { num: '05', label: 'Editorial', href: '/editorial' },
  { num: '06', label: 'Contact', href: '/contact' },
  { num: '07', label: 'Account', href: '/account' },
];

const ease = [0.19, 1, 0.22, 1] as const;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { openCart, itemCount } = useCartStore();
  const { region, setRegion } = useRegionStore();

  const pathname = usePathname();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsOpen(false); setSearchOpen(false); }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <motion.div
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -6 : 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
        className="fixed top-5 md:top-7 left-5 md:left-8 z-50 mix-blend-difference block"
      >
        <Link href="/">
          <span className="font-display font-bold text-xl tracking-widest text-white uppercase hover:text-gold-primary transition-colors">Jemy</span>
        </Link>
      </motion.div>

      {/* ─── PILL — always rendered, fades with isOpen ─── */}
      <motion.div
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -6 : 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
        className="fixed top-4 md:top-6 right-4 md:right-6 z-50 flex items-center bg-white/90 backdrop-blur-md pl-1.5 pr-1.5 py-1.5 rounded-full shadow-lg border border-black/5 gap-1"
      >
        <button
          onClick={() => setSearchOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-indigo-950 hover:bg-black/5 transition-colors"
          aria-label="Search"
        >
          <Search size={17} />
        </button>

        <button
          onClick={openCart}
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-indigo-950 hover:bg-black/5 transition-colors"
          aria-label="Cart"
        >
          <ShoppingBag size={17} />
          {itemCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-gold-primary text-indigo-950 text-[8px] font-bold flex items-center justify-center rounded-full">
              {itemCount}
            </span>
          )}
        </button>

        <div className="w-px h-5 bg-black/10 mx-0.5" />

        {/* Menu button */}
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-5 h-10 rounded-full bg-indigo-950 text-white transition-all duration-400 hover:bg-gold-primary hover:text-indigo-950"
          aria-label="Open menu"
        >
          <div className="flex flex-col gap-[4.5px] w-4">
            <span className="block h-[1.5px] w-full bg-current rounded-full transition-all duration-300 group-hover:w-3/4" />
            <span className="block h-[1.5px] w-3/4 bg-current rounded-full transition-all duration-300 group-hover:w-full" />
          </div>
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em]">Menu</span>
        </button>
      </motion.div>

      {/* ─── MENU OVERLAY ─── */}
      <AnimatePresence mode="sync">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.985 }}
              transition={{ duration: 0.32, ease }}
              className="fixed top-4 md:top-6 right-4 md:right-6 z-50 w-[95vw] md:w-[90vw] max-w-[700px] bg-[#0c0c0c] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden border border-white/[0.07]"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Navigation</span>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Jemy™</span>
                  <motion.button
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.15, duration: 0.35, ease }}
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Close menu"
                  >
                    <X size={18} strokeWidth={1.5} />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col md:flex-row">
                {/* Left: Links */}
                <div className="flex-1 px-8 py-6">
                  <nav>
                    {MENU_LINKS.map((link, i) => (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="group flex items-center justify-between py-4 border-b border-white/[0.06] last:border-0"
                        >
                          <div className="flex items-baseline gap-4">
                            <span className="font-mono text-[10px] text-white/25 group-hover:text-gold-primary/60 transition-colors duration-300 w-4">
                              {link.num}
                            </span>
                            <span className="font-display text-[1.65rem] md:text-[1.85rem] text-white tracking-[-0.025em] leading-none group-hover:text-gold-primary transition-colors duration-300">
                              {link.label}
                            </span>
                          </div>
                          <ArrowUpRight
                            size={16}
                            className="text-white/15 group-hover:text-gold-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </nav>
                </div>

                {/* Right: Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.22, duration: 0.4, ease }}
                  className="md:w-[240px] px-8 py-6 md:border-l border-white/[0.06] flex flex-col justify-between gap-10"
                >
                  <div className="space-y-7">
                    <div>
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-3">Contact</p>
                      <div className="space-y-2 text-sm text-white/60 leading-relaxed">
                        <a href="mailto:hello@jemy.com" className="font-sans block hover:text-gold-primary transition-colors">
                          hello@jemy.com
                        </a>
                        <p className="font-mono text-xs">+1 (800) 555-0199</p>
                      </div>
                      <div className="mt-3 font-mono text-[11px] text-white/30 leading-relaxed">
                        <p>123 Optical Ave</p>
                        <p>New York, NY 10012</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-3">Follow</p>
                      <div className="flex flex-col gap-2 font-mono text-[11px] text-white/40">
                        <a href="#" className="hover:text-gold-primary transition-colors">Instagram ↗</a>
                        <a href="#" className="hover:text-gold-primary transition-colors">LinkedIn ↗</a>
                        <a href="#" className="hover:text-gold-primary transition-colors">X / Twitter ↗</a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setRegion(region === 'US' ? 'IN' : 'US')}
                      className="w-full text-left font-mono text-[11px] text-white/30 hover:text-white/60 transition-colors"
                    >
                      Region: {region === 'US' ? '🇺🇸 USD' : '🇮🇳 INR'} — swap
                    </button>
                    <Link
                      href="/products"
                      onClick={() => setIsOpen(false)}
                      className="group w-full flex items-center justify-between bg-white text-black px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-gold-primary transition-colors duration-300"
                    >
                      Shop Frames
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── SEARCH OVERLAY ─── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] flex items-start pt-36 justify-center bg-[#EAEBE6]/95 backdrop-blur-xl px-6"
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-8 right-8 text-indigo-900/40 hover:text-indigo-900 transition-colors"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.06, duration: 0.45, ease }}
              className="w-full max-w-3xl"
            >
              <input
                autoFocus
                type="text"
                placeholder="Search frames, styles…"
                className="w-full bg-transparent border-0 border-b-2 border-indigo-900/15 focus:border-gold-primary outline-none text-4xl md:text-5xl font-display text-indigo-900 placeholder:text-indigo-900/20 pb-4 transition-colors duration-300"
                onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
              />
              <p className="mt-5 text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-900/30">Press Esc to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
