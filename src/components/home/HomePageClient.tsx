'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ScanFace, Ruler, Shield, Search } from 'lucide-react';
import FaceShapeQuizModal from '@/components/eyewear/FaceShapeQuizModal';
import CardExplosion from '@/components/ui/CardExplosion';
import DualImageReveal from '@/components/ui/DualImageReveal';
import StackedGlassDeck from '@/components/ui/StackedGlassDeck';
import ScrubbableProductCard from '@/components/ui/ScrubbableProductCard';
import AdvertisementScrollStack from '@/components/ui/AdvertisementScrollStack';
import StorefrontFlyer from '@/components/marketing/StorefrontFlyer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/* ──────────────────────────────────────
   Scroll reveal hook
────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ──────────────────────────────────────
   Types
────────────────────────────────────── */
interface Product {
  _id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  pricing: { US?: { amount: number }; IN?: { amount: number } };
}

/* ──────────────────────────────────────
   1. Alternating Image Marquee
────────────────────────────────────── */
function InfiniteMarquee({ items, speed = 40, direction = -1 }: { items: (string | { img: string })[]; speed?: number, direction?: 1 | -1 }) {
  const track = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(track.current, 
      { xPercent: direction === -1 ? 0 : -50 },
      {
        xPercent: direction === -1 ? -50 : 0,
        ease: 'none',
        duration: speed,
        repeat: -1,
      }
    );
  });

  // Quadruple items to ensure it fills ultra-wide screens even with fewer items
  const quadrupled = [...items, ...items, ...items, ...items];
  
  return (
    <div className="overflow-hidden border-b border-[var(--theme-text)]/10 py-4 md:py-6 select-none flex hover:bg-[var(--theme-text)]/5 transition-colors duration-500">
      <div ref={track} className="flex gap-6 md:gap-12 whitespace-nowrap w-max items-center">
        {quadrupled.map((item, i) => (
          <div key={i} className="inline-flex items-center gap-6 md:gap-12">
            {typeof item === 'string' ? (
              <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text)]/50">
                {item}
              </span>
            ) : (
              <div className="h-8 w-20 md:h-12 md:w-28 rounded-full overflow-hidden relative border border-[var(--theme-text)]/20">
                <img src={item.img} alt="" className="w-full h-full object-cover grayscale opacity-80" />
              </div>
            )}
            <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-gold-primary/50 inline-block flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   2. Animated Stats Strip
────────────────────────────────────── */


/* ──────────────────────────────────────
   3. Section Heading with Character Mask Reveal
────────────────────────────────────── */
function SectionHeading({ label, title, className = '' }: { label: string; title: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const lines = title.split('\n');
  let charIndex = 0; // To stagger continuously across multiple lines

  return (
    <div ref={ref} className={className}>
      <h2 className="font-display font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[var(--theme-text)] flex flex-wrap" style={{ fontSize: 'clamp(1.25rem, 8vw, 4rem)' }}>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block flex flex-wrap w-full">
            {line.split('').map((char, i) => {
              const currentDelay = charIndex * 0.03;
              charIndex++;
              return (
                <span key={i} className={`inline-block overflow-hidden pb-1 align-bottom ${char === ' ' ? 'w-[0.25em]' : ''}`}>
                  <span
                    className="inline-block transition-transform duration-[800ms]"
                    style={{
                      transform: visible ? 'translateY(0) rotate(0deg)' : 'translateY(110%) rotate(6deg)',
                      transitionDelay: `${0.1 + currentDelay}s`,
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </h2>
    </div>
  );
}

/* ──────────────────────────────────────
   4. Scroll-Velocity Cursor Stretch
────────────────────────────────────── */
function ScrollVelocityEffect() {
  useEffect(() => {
    let lastY = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    const cursor = document.getElementById('jemy-cursor');
    if (!cursor) return;

    const onScroll = () => {
      const currentY = window.scrollY;
      const velocity = Math.abs(currentY - lastY);
      lastY = currentY;

      const stretch = Math.min(velocity * 0.12, 0.35);
      cursor.style.transform = `scaleY(${1 + stretch}) scaleX(${1 - stretch * 0.3})`;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        cursor.style.transform = 'scaleY(1) scaleX(1)';
      }, 120);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timeoutId); };
  }, []);

  return null;
}

/* ──────────────────────────────────────
   Sub-components
────────────────────────────────────── */
function HeroSection({ onQuizOpen, banners }: { onQuizOpen: () => void, banners?: any[] }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const scale = useTransform(scrollY, [0, 800], [1, 0.9]);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0 bg-black">
        <video
          ref={videoRef}
          src="https://res.cloudinary.com/kouanazg/video/upload/f_auto,q_auto/v1787487376/Himnak_JEMY_UPscaled_ljkggh.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center pointer-events-none opacity-90"
        />
        {/* Subtle vignette for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
      </motion.div>




      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 lg:px-12 text-center flex flex-col items-center">


        <h1
          className="font-clash font-[700] text-white leading-[0.85] tracking-[-0.02em] uppercase text-center flex flex-col items-center"
          style={{ fontSize: 'clamp(2rem, 8.5vw, 8.5rem)', wordSpacing: '0.15em' }}
        >
          <span className="overflow-hidden block pt-3 md:pt-6 -mt-3 md:-mt-6">
            <motion.span
              initial={{ y: "110%", rotateZ: 4 }}
              animate={{ y: 0, rotateZ: 0 }}
              transition={{ duration: 0.9, delay: 3.1, ease: [0.19, 1, 0.22, 1] }}
              className="block origin-bottom-left"
            >
              {banners?.[0]?.title ? (banners[0].title.includes('|') ? banners[0].title.split('|')[0].trim() : banners[0].title.split(' ')[0]) : 'The Atelier'}
            </motion.span>
          </span>
          <span className="overflow-hidden block pt-3 md:pt-6 -mt-3 md:-mt-6">
            <motion.span
              initial={{ y: "110%", rotateZ: 4 }}
              animate={{ y: 0, rotateZ: 0 }}
              transition={{ duration: 0.9, delay: 3.2, ease: [0.19, 1, 0.22, 1] }}
              className="block origin-bottom-left"
            >
              {banners?.[0]?.title ? (banners[0].title.includes('|') ? banners[0].title.split('|')[1].trim() : banners[0].title.split(' ').slice(1).join(' ')) : 'For Your Vision'}
            </motion.span>
          </span>
        </h1>

        {banners?.[0]?.subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 3.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/80 mt-6 text-sm md:text-base max-w-lg mx-auto"
          >
            {banners[0].subtitle}
          </motion.p>
        )}


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 3.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link
            href={banners?.[0]?.linkUrl || "/products"}
            className="group relative overflow-hidden inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[12px] font-bold uppercase tracking-[0.15em] px-10 py-5 rounded-full hover:scale-[1.02] transition-transform duration-300 w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center gap-2 group-hover:text-black transition-colors duration-500">{banners?.[0]?.ctaText || 'Shop Frames'} <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></span>
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedCollection({ title, products, link = '/products' }: { title: string, products: Product[], link?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = container.current?.querySelectorAll('.product-card');
    if (!cards?.length) return;
    gsap.fromTo(cards,
      { opacity: 0, y: 80, filter: 'blur(8px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        stagger: 0.12, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: container.current, start: 'top 80%', toggleActions: 'play none none none' },
      }
    );
  }, { scope: container });

  return (
    <section className="py-12 md:py-24">
      <div ref={container} className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex items-end justify-between mb-10 md:mb-16">
          <SectionHeading label="" title={title} />
          <Link
            href={link}
            className="hidden md:inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--theme-text)]/50 hover:text-gold-primary transition-colors border-b border-[var(--theme-text)]/20 hover:border-gold-primary pb-1"
          >
            Explore All <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-10">
          {(products.length > 0 ? products.slice(0, 4) : [
            {
              _id: 'mock-1',
              name: 'Editorial Acetate',
              category: 'Optical',
              pricing: { US: { amount: 345, currency: 'USD' }, IN: { amount: 28500, currency: 'INR' } },
              images: [
                '/images/glasses_studio_1787493089248.png',
                '/images/glasses_lifestyle_1_1787493103772.png',
                '/images/glasses_macro_1787493118137.png',
                '/images/glasses_lifestyle_2_1787493132668.png'
              ]
            },
            {
              _id: 'mock-2',
              name: 'Titanium Wireframe',
              category: 'Optical',
              pricing: { US: { amount: 420, currency: 'USD' }, IN: { amount: 34500, currency: 'INR' } },
              images: [
                '/images/glasses_studio_stack_2_1787493171644.png',
                '/images/titanium_lifestyle_1_1787494228901.png',
                '/images/titanium_macro_1787494244263.png',
                '/images/titanium_lifestyle_2_1787494257550.png'
              ]
            },
            {
              _id: 'mock-3',
              name: 'Geometric Sun',
              category: 'Sunglasses',
              pricing: { US: { amount: 285, currency: 'USD' }, IN: { amount: 23500, currency: 'INR' } },
              images: [
                '/images/glasses_studio_stack_3_1787493184622.png',
                '/images/sun_lifestyle_1_1787494277969.png',
                '/images/sun_macro_1787494291484.png'
              ]
            },
            {
              _id: 'mock-4',
              name: 'Clear Acetate',
              category: 'Optical',
              pricing: { US: { amount: 310, currency: 'USD' }, IN: { amount: 25500, currency: 'INR' } },
              images: [
                '/images/glasses_studio_stack_4_1787493197525.png',
                '/images/glasses_lifestyle_1_1787493103772.png',
                '/images/macro_detail.png',
                '/images/glasses_lifestyle_2_1787493132668.png'
              ]
            }
          ]).map((product: any, idx: number) => {
            const isWideMobile = idx >= 2;
            return (
              <div key={product._id} className={`${isWideMobile ? 'col-span-2 md:col-span-1' : 'col-span-1'} w-full`}>
                <ScrubbableProductCard 
                  product={product} 
                  mockImages={product.images} 
                  aspectClass={isWideMobile ? 'aspect-[4/3] md:aspect-[3/4]' : 'aspect-square md:aspect-[3/4]'}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ── Manifesto: Scrubbed text + macro zoom (Verostudio mechanic) ── */
function ManifestoSection() {
  const container = useRef<HTMLDivElement>(null);
  const macroImg = useRef<HTMLImageElement>(null);
  const textTrigger = useRef<HTMLHeadingElement>(null);

  const words = ['Frames', 'are', 'not', 'accessories.', 'They', 'are', 'architecture.'];

  useGSAP(() => {
    // Word-by-word scrub reveal
    const wordEls = container.current?.querySelectorAll('.scrub-word');
    if (wordEls?.length) {
      gsap.fromTo(
        wordEls,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.5,
          ease: 'none',
          scrollTrigger: {
            trigger: textTrigger.current,
            start: 'top 85%',
            end: 'bottom 40%',
            scrub: true,
          },
        }
      );
    }

    // Macro zoom: scale image from 1 → 1.5 tied to scroll
    gsap.to(macroImg.current, {
      scale: 1.5,
      ease: 'none',
      scrollTrigger: {
        trigger: container.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, { scope: container });

  return (
    <section id="manifesto-section" ref={container} className="py-16 md:py-32 overflow-hidden relative">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center">
          <div className="max-w-2xl relative z-20">
            <h2
              ref={textTrigger}
              className="font-display font-bold leading-[0.9] tracking-[-0.04em] mb-8 md:mb-10 uppercase break-words hyphens-auto"
              style={{ fontSize: 'clamp(1.5rem, 8vw, 6rem)' }}
            >
              {words.map((word, i) => (
                <span key={i} className="scrub-word inline-block mr-[0.3em] text-[var(--theme-text)]">
                  {word}
                </span>
              ))}
            </h2>
            <p className="text-[var(--theme-text)]/60 text-lg leading-relaxed mb-12 max-w-[65ch] text-pretty">
              Every Jemy frame is the result of months of material research, ergonomic testing, 
              <span className="inline-block align-middle mx-2 w-14 h-6 rounded-full overflow-hidden border border-[var(--theme-text)]/20">
                <img src="/images/lookbook_1.png" alt="" className="w-full h-full object-cover grayscale opacity-80" />
              </span>
              and lens-optical calibration. We craft instruments for vision.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 border border-[var(--theme-text)]/20 text-[var(--theme-text)] text-[12px] font-bold uppercase tracking-[0.15em] px-10 py-5 rounded-full hover:border-gold-primary hover:text-gold-primary transition-all duration-300 bg-[var(--theme-bg)]"
            >
              Explore Collection <ArrowRight size={15} />
            </Link>
          </div>
          
          {/* Macro Image: Now visible on mobile too */}
          <div className="relative z-10 md:-ml-24 mt-8 md:mt-20">
            <div className="aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden relative group">
              <img
                ref={macroImg}
                src="/images/macro_detail.png"
                alt="Titanium Hinge Detail"
                className="w-full h-full object-cover grayscale-[0.2] will-change-transform magnetic-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



function ShopByGeometry({ onQuizOpen }: { onQuizOpen: () => void }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = container.current?.querySelectorAll('.geo-card');
    if (!cards) return;
    gsap.fromTo(cards, 
      { opacity: 0, y: 60, filter: 'blur(12px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.2,
        ease: 'expo.out',
        duration: 1.5,
        scrollTrigger: { trigger: container.current, start: 'top 75%', toggleActions: 'play none none none' },
      }
    );
  }, { scope: container });

  const categories = [
    { title: 'Soft & Round', desc: 'Curved silhouettes that soften angular features.', img: '/images/category_sun.png', link: '/products?shape=round', span: 'md:col-span-2 md:row-span-2', titleClass: 'text-5xl md:text-7xl' },
    { title: 'Geometric', desc: 'Sharp, architectural lines for structured balance.', img: '/images/lookbook_2.png', link: '/products?shape=geometric', span: 'md:col-span-1 md:row-span-1', titleClass: 'text-3xl' },
    { title: 'Aviator', desc: 'Oversized coverage with timeless bridge detailing.', img: '/images/category_optical.png', link: '/products?shape=aviator', span: 'md:col-span-1 md:row-span-1', titleClass: 'text-3xl' },
  ];

  return (
    <section ref={container} className="py-16 md:py-32 max-w-[1600px] mx-auto px-6 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16">
        <SectionHeading label="02 — Architecture" title={"Frame\nGeometry"} />
        <button 
          onClick={onQuizOpen} 
          className="relative mt-6 md:mt-0 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--theme-text)]/70 hover:text-[var(--theme-text)] transition-colors group"
        >
          <ScanFace size={16} />
          Find Your Shape Guide
          <span className="block h-px w-0 bg-[var(--theme-text)] transition-all duration-300 group-hover:w-full absolute bottom-[-4px] left-0" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[400px]">
        {categories.map((cat, i) => (
          <Link
            key={i}
            href={cat.link}
            className={`geo-card relative rounded-[2.5rem] overflow-hidden group flex flex-col justify-end p-8 md:p-12 h-full w-full ${cat.span}`}
          >
            <img src={cat.img} alt={cat.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors duration-700 z-10" />
            
            <div className="relative z-20 w-full">
              <div className="w-12 h-12 rounded-full bg-[var(--theme-bg)] text-[var(--theme-text)] flex items-center justify-center mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[0.16,1,0.3,1]">
                <ArrowRight size={18} />
              </div>
              <h3 className={`font-display font-bold text-white tracking-tight uppercase mb-3 ${cat.titleClass}`}>{cat.title}</h3>
              <p className="text-white/70 text-sm md:text-base max-w-[40ch] leading-relaxed font-medium">{cat.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}


function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch('/api/user/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (_) {}
    setSubmitted(true);
  };

  return (
    <section className="py-12 md:py-24 max-w-[1600px] mx-auto px-6 lg:px-12">
      <div className="relative rounded-[3rem] overflow-hidden bg-[#1C2740] text-[#EAEBE6] p-8 md:p-24 border border-white/10 shadow-2xl">
        {/* Background decorative Marquee background effect */}
        <div className="absolute inset-0 opacity-[0.03] flex flex-col justify-center pointer-events-none select-none overflow-hidden font-display font-bold text-6xl md:text-8xl uppercase leading-none whitespace-nowrap">
          <p>ATELIER · EXCLUSIVE DROPS · ATELIER · EXCLUSIVE DROPS ·</p>
          <p className="translate-x-10 md:translate-x-20">JEMY PRIVATE CLUB · JEMY PRIVATE CLUB ·</p>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gold-primary/30 text-[10px] font-bold uppercase tracking-[0.25em] text-gold-primary mb-8 bg-gold-primary/5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-primary" />
            Private Access
          </span>

          <h2 
            className="font-display font-bold uppercase leading-[0.9] tracking-[-0.03em] mb-6 text-white text-balance"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
          >
            Join the Atelier
          </h2>

          <p className="text-white/60 text-base md:text-lg mb-12 max-w-[55ch] text-pretty leading-relaxed">
            Subscribe for early access to new seasonal collections, private vault drops, and optical bespoke consultations.
          </p>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 px-8 rounded-full border border-gold-primary/40 bg-gold-primary/10 text-gold-primary font-bold text-sm uppercase tracking-[0.2em]"
              >
                Welcome to Jemy Private Atelier.
              </motion.div>
            ) : (
              <motion.form
                key="form"
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="w-full max-w-md flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/35 px-8 py-5 rounded-full text-sm focus:outline-none focus:border-gold-primary transition-all duration-300 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="bg-gold-primary text-[#1C2740] font-bold text-[11px] uppercase tracking-[0.2em] px-9 py-5 rounded-full hover:bg-white hover:text-[#1C2740] transition-all duration-300 shrink-0"
                >
                  Subscribe
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────
   Root Page
────────────────────────────────────── */
export default function HomePageClient({ 
  marketingConfig, 
  bestsellers, 
  recommendations, 
  sunglasses 
}: { 
  marketingConfig: any; 
  bestsellers: Product[]; 
  recommendations: Product[]; 
  sunglasses: Product[]; 
}) {
  const [quizOpen, setQuizOpen] = useState(false);
  
  const themeWrapperRef = useRef<HTMLDivElement>(null);

  // Recalculate GSAP ScrollTriggers safely when dynamic data renders
  useEffect(() => {
    // Only refresh when data is actually populated to avoid premature calculations
    if (marketingConfig || recommendations.length > 0 || sunglasses.length > 0) {
      const t = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500); // 500ms allows DOM to settle and images to begin rendering
      return () => clearTimeout(t);
    }
  }, [marketingConfig, recommendations, sunglasses]);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    // CSS variables transition for theme
    // Original manifesto dark zone
    ScrollTrigger.create({
      trigger: '#manifesto-section',
      start: 'top 40%',
      end: 'bottom 40%',
      onEnter: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#1C2740', '--theme-text': '#EAEBE6', duration: 0.8, ease: 'power2.out' }),
      onLeaveBack: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#EAEBE6', '--theme-text': '#1C2740', duration: 0.8, ease: 'power2.out' }),
      onEnterBack: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#1C2740', '--theme-text': '#EAEBE6', duration: 0.8, ease: 'power2.out' }),
      onLeave: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#EAEBE6', '--theme-text': '#1C2740', duration: 0.8, ease: 'power2.out' }),
    });

    // New early dark zone
    ScrollTrigger.create({
      trigger: '#early-dark-zone',
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#1C2740', '--theme-text': '#EAEBE6', duration: 0.8, ease: 'power2.out' }),
      onLeaveBack: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#EAEBE6', '--theme-text': '#1C2740', duration: 0.8, ease: 'power2.out' }),
      onEnterBack: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#1C2740', '--theme-text': '#EAEBE6', duration: 0.8, ease: 'power2.out' }),
      onLeave: () => gsap.to(themeWrapperRef.current, { '--theme-bg': '#EAEBE6', '--theme-text': '#1C2740', duration: 0.8, ease: 'power2.out' }),
    });
  }, { scope: themeWrapperRef });

  const editorialSlides = useMemo(() => {
    return marketingConfig?.editorial?.flatMap((slide: any) => 
      slide.images?.map((img: string, i: number) => ({
        src: img,
        label: slide.subtitle || `Vol ${i+1}`,
        caption: slide.title,
        link: slide.linkUrl,
        altText: slide.altText,
        ctaText: slide.ctaText
      })) || []
    ) || [];
  }, [marketingConfig]);

  return (
    <div 
      ref={themeWrapperRef} 
      className="theme-wrapper overflow-clip w-full max-w-[100vw]" 
      style={{ 
        '--theme-bg': '#EAEBE6', 
        '--theme-text': '#1C2740', 
        backgroundColor: 'var(--theme-bg)', 
        color: 'var(--theme-text)' 
      } as React.CSSProperties}
    >
      <StorefrontFlyer flyerData={marketingConfig?.flyer} />
      <FaceShapeQuizModal isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
      <ScrollVelocityEffect />

      <HeroSection onQuizOpen={() => setQuizOpen(true)} banners={marketingConfig?.banners} />
      
      {/* Alternating Image Marquees (Salvato Style) */}
      <div className="border-t border-[var(--theme-text)]/10">
        <InfiniteMarquee 
          direction={-1} 
          speed={45}
          items={marketingConfig?.marquees?.length > 0 ? marketingConfig.marquees.flatMap((m: any) => [
            m.title || '',
            m.imageUrl ? { img: m.imageUrl } : null,
            m.subtitle || ''
          ]).filter(Boolean) : [
            'Premium Optical Atelier',
            { img: '/images/category_sun.png' },
            'Precision Engineered',
            'Editorial Volume I',
            { img: '/images/macro_detail.png' },
            'Architectural Eyewear',
          ]} 
        />
        <InfiniteMarquee 
          direction={1} 
          speed={50}
          items={marketingConfig?.marquees?.length > 1 ? marketingConfig.marquees.slice(1).flatMap((m: any) => [
            m.title || '',
            m.imageUrl ? { img: m.imageUrl } : null,
            m.subtitle || ''
          ]).filter(Boolean) : [
            'UV400 Standard Protection',
            { img: '/images/lookbook_2.png' },
            'Titanium Construction',
            'Jemy — See Different',
            { img: '/images/category_optical.png' },
            'Handcrafted Details',
          ]} 
        />
      </div>
      <FeaturedCollection title={"Bestsellers"} products={bestsellers} link="/products" />
      
      <div id="early-dark-zone" className="py-12">
        <FeaturedCollection 
          title="For You"
          products={recommendations} 
          link="/products"
        />
      </div>
      
      <FeaturedCollection 
        title="Sun\nCollection"
        products={sunglasses} 
        link="/products?category=sunglasses"
      />
      <CardExplosion />
      <StackedGlassDeck />
      <ManifestoSection />
      <ShopByGeometry onQuizOpen={() => setQuizOpen(true)} />
      <AdvertisementScrollStack slides={editorialSlides} />
      <DualImageReveal />

      <NewsletterSection />
    </div>
  );
}
