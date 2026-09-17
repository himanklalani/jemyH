'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Search, ShoppingBag, ArrowRight, ArrowUpRight, Heart, User, Glasses, Eye } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useRegionStore } from '@/store/useRegionStore';

const MENU_LINKS = [
  { num: '01', label: 'Home', href: '/' },
  { num: '02', label: 'Sunglasses', href: '/products?category=sunglasses' },
  { num: '03', label: 'Optical Frames', href: '/products?category=eyeglasses' },
  { num: '04', label: 'Full Collection', href: '/products' },
  { num: '05', label: 'Wishlist', href: '/wishlist' },
  { num: '06', label: 'Editorial', href: '/editorial' },
  { num: '07', label: 'Account', href: '/account' },
  { num: '08', label: 'Contact', href: '/contact' },
];

const ease = [0.19, 1, 0.22, 1] as const;

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { openCart, itemCount } = useCartStore();
  const { region, setRegion } = useRegionStore();
  const [isAdmin, setIsAdmin] = useState(false);
  // Ref to return focus to the trigger button when menu closes (WCAG 2.1 focus management)
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  const pathname = usePathname();
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal desktop category links once user scrolls past hero (approx 50% of viewport)
      const threshold = window.innerHeight * 0.5;
      setScrolledPastHero(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('jemy_token');
      if (!token) {
        if (isMounted) setIsAdmin(false);
        return;
      }

      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.role === 'admin') {
            if (isMounted) setIsAdmin(true);
            localStorage.setItem('adminToken', token);
            return;
          }
        }
      } catch {
        // network issue
      }

      // If database verification confirms user is not admin
      if (isMounted) setIsAdmin(false);
      localStorage.removeItem('adminToken');
    };

    checkAdminStatus();

    const handleAuthChange = () => {
      checkAdminStatus();
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) { setIsOpen(false); menuTriggerRef.current?.focus(); }
        if (searchOpen) setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, searchOpen]);

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
        className="fixed top-[22px] md:top-7 left-4 md:left-8 z-50 mix-blend-difference block"
      >
        <Link href="/">
          <span className="font-display font-bold text-xl tracking-widest text-white uppercase hover:text-gold-primary transition-colors">Jemy</span>
        </Link>
      </motion.div>

      {/* ─── PILL - always rendered, fades with isOpen ─── */}
      <motion.div
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.95 : 1, y: isOpen ? -4 : 0 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
        className="fixed top-3 md:top-6 right-3.5 md:right-6 z-50 flex items-center bg-white/95 backdrop-blur-xl px-1.5 md:px-2 py-1.5 md:py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-black/8 gap-1 md:gap-1.5"
      >
        {/* Desktop Sunglasses & Optical collection links (hidden during hero, expands in when scrolled) */}
        <AnimatePresence>
          {(pathname !== '/' || scrolledPastHero) && (
            <motion.div
              key="desktop-category-links"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex items-center gap-1.5 mr-1 overflow-hidden whitespace-nowrap"
            >
              <Link
                href="/products?category=sunglasses"
                className="px-4 h-10 flex items-center text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-950/70 hover:text-indigo-950 rounded-full hover:bg-black/5 transition-all duration-200 shrink-0"
              >
                Sunglasses
              </Link>
              <Link
                href="/products?category=eyeglasses"
                className="px-4 h-10 flex items-center text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-950/70 hover:text-indigo-950 rounded-full hover:bg-black/5 transition-all duration-200 shrink-0"
              >
                Optical
              </Link>
              <div className="w-px h-5 bg-black/10 mx-1 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search button (all screens) */}
        <button
          onClick={() => setSearchOpen(true)}
          className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full text-indigo-950 hover:bg-black/5 active:scale-95 transition-all"
          aria-label="Open search"
          title="Search"
        >
          <Search size={17} className="md:w-5 md:h-5" />
        </button>

        {/* Wishlist button (desktop / tablet) */}
        <Link
          href="/wishlist"
          className="hidden md:flex w-11 h-11 items-center justify-center rounded-full text-indigo-950 hover:bg-black/5 active:scale-95 transition-all"
          aria-label="Wishlist"
          title="Wishlist"
        >
          <Heart size={18} />
        </Link>

        {/* Cart / Shopping Bag button (all screens) */}
        <button
          onClick={openCart}
          className="relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full text-indigo-950 hover:bg-black/5 active:scale-95 transition-all"
          aria-label={itemCount > 0 ? `Shopping bag, ${itemCount} item${itemCount !== 1 ? 's' : ''}` : 'Shopping bag'}
          title="Cart"
        >
          <ShoppingBag size={17} className="md:w-5 md:h-5" />
          {itemCount > 0 && (
            <span aria-hidden="true" className="absolute top-0.5 md:top-1 right-0.5 md:right-1 w-4 h-4 md:w-4.5 md:h-4.5 bg-gold-primary text-indigo-950 text-[9px] md:text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
              {itemCount}
            </span>
          )}
        </button>

        {/* Account button (desktop / tablet) */}
        <Link
          href="/account"
          className="hidden md:flex w-11 h-11 items-center justify-center rounded-full text-indigo-950 hover:bg-black/5 active:scale-95 transition-all"
          aria-label="Account"
          title="Account"
        >
          <User size={18} />
        </Link>

        {/* Admin button (strictly verified role in DB) */}
        {isAdmin && (
          <>
            <div className="hidden sm:block w-px h-5 bg-black/10 mx-0.5" />
            <Link
              href="/admin"
              className="group flex items-center justify-center px-3 sm:px-4 h-8 sm:h-10 rounded-full bg-indigo-900/5 text-indigo-950 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] hover:bg-gold-primary hover:text-indigo-950 transition-colors"
              title="Admin Panel"
            >
              Admin
            </Link>
          </>
        )}

        <div className="w-px h-5 bg-black/10 mx-0.5" />

        {/* Menu button */}
        <button
          ref={menuTriggerRef}
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 h-9 md:h-11 rounded-full bg-indigo-950 text-white transition-all duration-300 hover:bg-gold-primary hover:text-indigo-950 active:scale-95 cursor-pointer shadow-sm"
          aria-label="Open navigation menu"
        >
          <div className="flex flex-col gap-[4px] md:gap-[5px] w-4 md:w-4.5" aria-hidden="true">
            <span className="block h-[1.5px] md:h-[2px] w-full bg-current rounded-full transition-all duration-300 group-hover:w-3/4" />
            <span className="block h-[1.5px] md:h-[2px] w-3/4 bg-current rounded-full transition-all duration-300 group-hover:w-full" />
          </div>
          <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em]">Menu</span>
        </button>
      </motion.div>

      {/* ─── MOBILE QUICK DOCK (Thumb-zone luxury navigation) ─── */}
      <AnimatePresence>
        {!isOpen && !pathname?.startsWith('/checkout') && !pathname?.startsWith('/products') && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 z-40 md:hidden flex items-center justify-between bg-[#0c0c0c]/92 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.65)] rounded-full px-3.5 py-2 gap-1.5 w-[calc(100vw-36px)] max-w-[365px]"
          >
            <Link
              href="/products?category=sunglasses"
              className="flex-1 justify-center px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:text-gold-primary hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Glasses size={16} className="text-gold-primary shrink-0" />
              <span>Sun</span>
            </Link>

            <div className="w-px h-5 bg-white/20 shrink-0" />

            <Link
              href="/products?category=eyeglasses"
              className="flex-1 justify-center px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:text-gold-primary hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Eye size={16} className="text-gold-primary shrink-0" />
              <span>Optical</span>
            </Link>

            <div className="w-px h-5 bg-white/20 shrink-0" />

            <Link
              href="/wishlist"
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white/80 hover:text-gold-primary hover:bg-white/10 transition-colors"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart size={16} />
            </Link>

            <Link
              href="/account"
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white/80 hover:text-gold-primary hover:bg-white/10 transition-colors"
              aria-label="Account"
              title="Account"
            >
              <User size={16} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

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
              transition={{ duration: 0.32, ease: 'easeOut' }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Panel - expands smoothly from Menu button location (top-right) */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.88, y: -10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, y: -6, filter: 'blur(6px)' }}
              transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'top right' }}
              className="fixed top-3 md:top-6 right-3.5 md:right-6 z-50 w-[calc(100vw-28px)] max-w-[345px] sm:max-w-[380px] md:w-[90vw] md:max-w-[700px] max-h-[85vh] bg-[#0c0c0c] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.7)] overflow-hidden border border-white/[0.08] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 md:px-8 py-4 md:py-5 border-b border-white/[0.06] shrink-0">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Navigation</span>
                <div className="flex items-center gap-4 md:gap-6">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Jemy&#x2122;</span>
                  <motion.button
                    ref={menuCloseRef}
                    initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                    transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => { setIsOpen(false); menuTriggerRef.current?.focus(); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                    aria-label="Close menu"
                  >
                    <X size={17} className="md:w-[18px] md:h-[18px]" strokeWidth={1.5} />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col md:flex-row overflow-y-auto overscroll-contain">
                {/* Left: Links */}
                <div className="flex-1 px-6 md:px-8 py-3.5 md:py-6">
                  <nav>
                    {MENU_LINKS.map((link, i) => (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ delay: 0.05 + i * 0.035, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="group flex items-center justify-between py-2.5 md:py-4 border-b border-white/[0.06] last:border-0"
                        >
                          <div className="flex items-baseline gap-3.5 md:gap-4">
                            <span className="font-mono text-[10px] text-white/25 group-hover:text-gold-primary/60 transition-colors duration-300 w-4">
                              {link.num}
                            </span>
                            <span className="font-display text-[1.12rem] sm:text-[1.25rem] md:text-[1.85rem] text-white tracking-[-0.01em] md:tracking-[-0.025em] leading-tight md:leading-none group-hover:text-gold-primary transition-colors duration-300">
                              {link.label}
                            </span>
                          </div>
                          <ArrowUpRight
                            size={15}
                            className="text-white/20 group-hover:text-gold-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:w-4 md:h-4"
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </nav>
                </div>

                {/* Mobile-only compact quick bar */}
                <div className="md:hidden px-6 py-3.5 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.02] shrink-0">
                  <button
                    onClick={() => setRegion(region === 'US' ? 'IN' : 'US')}
                    className="font-mono text-[11px] text-white/40 hover:text-white/80 transition-colors"
                  >
                    {region === 'US' ? '🇺🇸 USD' : '🇮🇳 INR'}
                  </button>
                  <a
                    href="mailto:hello@jemy.com"
                    className="font-mono text-[11px] text-white/40 hover:text-gold-primary transition-colors"
                  >
                    hello@jemy.com
                  </a>
                </div>

                {/* Desktop Right: Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.22, duration: 0.4, ease }}
                  className="hidden md:flex md:w-[240px] px-8 py-6 md:border-l border-white/[0.06] flex-col justify-between gap-10"
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
                      Region: {region === 'US' ? '🇺🇸 USD' : '🇮🇳 INR'} - swap
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

      {/* ─── SEARCH OVERLAY (Compact Luxury Command Modal) ─── */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Soft backdrop (click to dismiss) */}
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            />

            {/* Floating Compact Search Dialog */}
            <motion.div
              key="search-dialog"
              initial={{ opacity: 0, scale: 0.94, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -16 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-6 md:top-20 left-1/2 -translate-x-1/2 z-[70] w-[calc(100vw-32px)] max-w-[540px] bg-[#0c0c0c] border border-white/15 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Search catalog"
            >
              {/* Form Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    setSearchOpen(false);
                    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08]"
              >
                <Search size={18} className="text-gold-primary shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search frames, sunglasses, materials…"
                  className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-white/35 outline-none font-sans"
                  onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-white/40 hover:text-white transition-colors text-xs font-mono"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-gold-primary text-indigo-950 text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-colors shrink-0 cursor-pointer"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
                  aria-label="Close search"
                >
                  <X size={16} />
                </button>
              </form>

              {/* Quick Suggestions Bar */}
              <div className="px-5 py-3.5 bg-white/[0.02]">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35 mb-2.5">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Sunglasses', href: '/products?category=sunglasses' },
                    { label: 'Optical Frames', href: '/products?category=eyeglasses' },
                    { label: 'Titanium', href: '/products?material=titanium' },
                    { label: 'Acetate', href: '/products?material=acetate' },
                    { label: 'Geometric', href: '/products?shape=geometric' },
                    { label: 'Round', href: '/products?shape=round' },
                  ].map((tag) => (
                    <Link
                      key={tag.label}
                      href={tag.href}
                      onClick={() => setSearchOpen(false)}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-gold-primary hover:text-gold-primary text-white/70 text-[10px] font-medium tracking-wide transition-all duration-200"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
