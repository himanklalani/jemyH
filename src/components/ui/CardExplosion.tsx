'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

/* ── data ── */
const CARDS = [
  {
    id: 'left',
    label: 'Sunglasses',
    sub: 'UV400 · Polarized',
    img: '/images/category_sun.png',
    href: '/products?category=sunglasses',
  },
  {
    id: 'center',
    label: 'Signature',
    sub: 'Editorial Eyewear',
    img: '/images/hero_bg.png',
    href: '/products',
  },
  {
    id: 'right',
    label: 'Optical',
    sub: 'Prescription-Ready',
    img: '/images/category_optical.png',
    href: '/products?category=eyeglasses',
  },
];

const MARQUEE_ROWS = [
  { text: 'Frames · Architecture · Precision · Vision · Titanium · Jemy · Editorial · Craft · Optical ·', dir: -1 },
  { text: 'See Different · Luxury Atelier · Premium Optics · UV400 · 2026 · Tokyo · Material Research ·', dir: 1 },
  { text: 'Handcrafted · Engineered · Optical Integrity · Millimeter Perfect · Jemy Eyewear · Art ·', dir: -1 },
];

export default function CardExplosion() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  /* hero column elements */
  const heroColRef = useRef<HTMLDivElement>(null);

  /* individual card refs */
  const centerCardRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);

  /* badge refs */
  const badgeLeftRef = useRef<HTMLSpanElement>(null);
  const badgeCenterRef = useRef<HTMLSpanElement>(null);
  const badgeRightRef = useRef<HTMLSpanElement>(null);

  /* marquee track refs */
  const marqueeRefs = useRef<HTMLDivElement[]>([]);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Initial entrance animation for mobile to wait for preloader
    const hasSeenPreloader = typeof window !== 'undefined' ? sessionStorage.getItem('jemy_preloader_seen') : true;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const initialDelay = (!hasSeenPreloader && isMobile) ? 3.2 : 0;

    if (initialDelay > 0) {
      gsap.from(heroColRef.current, {
        opacity: 0,
        y: 20,
        duration: 1,
        delay: initialDelay,
        ease: 'power2.out',
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperRef.current,
        pin: pinRef.current,
        start: 'top top',
        end: '+=220vh',
        scrub: 1.2,
        anticipatePin: 1,
      },
    });

    /* ── PHASE 1 (0%→35%): fade + slide up left hero column ── */
    tl.to(
      heroColRef.current,
      { opacity: 0, y: -30, duration: 0.35, ease: 'power2.out' },
      0
    );

    /* ── PHASE 2 (0%→50%): center card morphs from right-column into center ── */
    tl.to(
      centerCardRef.current,
      {
        x: 0,           // was offset-right, now truly centered
        y: 0,           // reset any initial Y offset (useful for mobile)
        duration: 0.5,
        ease: 'expo.inOut',
      },
      0
    );

    /* ── PHASE 3 (40%→100%): left card blasts left, right card blasts right ── */
    tl.to(
      leftCardRef.current,
      {
        xPercent: -108,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'expo.out',
      },
      0.4
    );
    tl.to(
      rightCardRef.current,
      {
        xPercent: 108,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'expo.out',
      },
      0.4
    );

    /* ── PHASE 4 (55%→100%): reveal category badges ── */
    tl.to(
      [badgeLeftRef.current, badgeCenterRef.current, badgeRightRef.current],
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out' },
      0.55
    );

    /* ── Marquees: continuous, independent of scrub ── */
    marqueeRefs.current.forEach((el, i) => {
      if (!el) return;
      const dir = MARQUEE_ROWS[i].dir;
      gsap.fromTo(
        el,
        { xPercent: dir === -1 ? 0 : -50 },
        {
          xPercent: dir === -1 ? -50 : 0,
          ease: 'none',
          duration: 22 + i * 6,
          repeat: -1,
        }
      );
    });
  }, { scope: wrapperRef });

  return (
    <>
      {/* ══════════════════════════════════════════════════
          MOBILE LAYOUT — clean static section, no GSAP pin
          ══════════════════════════════════════════════════ */}
      <section
        className="md:hidden py-16 px-5"
        style={{ backgroundColor: 'var(--theme-bg)' }}
      >
        {/* Label + Headline */}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-primary mb-3">
          01 — Collection
        </p>
        <h2
          className="font-display font-bold uppercase leading-[0.88] tracking-[-0.04em] text-[var(--theme-text)] mb-8 break-words hyphens-auto"
          style={{ fontSize: 'clamp(1.25rem, 8vw, 3.5rem)' }}
        >
          See the<br />World<br />Differently.
        </h2>

        {/* Hero card — full width */}
        <Link href="/products" className="group block relative w-full rounded-[1.5rem] overflow-hidden mb-3" style={{ height: '55vw', minHeight: 220 }}>
          <img src="/images/hero_bg.png" alt="Signature" className="w-full h-full object-cover transition-transform duration-700 group-active:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end">
            <div>
              <p className="text-white font-display font-bold text-xl tracking-tight">Signature</p>
              <p className="text-white/60 text-[11px] uppercase tracking-widest mt-0.5">Editorial Eyewear</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 border border-white/30 rounded-full px-3 py-1.5 backdrop-blur-sm">
              Shop All
            </span>
          </div>
        </Link>

        {/* Two smaller category cards */}
        <div className="grid grid-cols-2 gap-3">
          {[CARDS[0], CARDS[2]].map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group relative rounded-[1.25rem] overflow-hidden"
              style={{ height: '48vw', minHeight: 180 }}
            >
              <img src={card.img} alt={card.label} className="w-full h-full object-cover transition-transform duration-700 group-active:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-display font-bold text-base tracking-tight">{card.label}</p>
                <p className="text-white/60 text-[10px] uppercase tracking-widest mt-0.5">{card.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          DESKTOP LAYOUT — full GSAP scroll pin explosion
          ══════════════════════════════════════════════════ */}
      <div ref={wrapperRef} className="relative hidden md:block">
        {/* pinned stage */}
        <div
          ref={pinRef}
          className="h-screen w-full overflow-hidden flex items-center justify-center relative"
          style={{ backgroundColor: 'var(--theme-bg)' }}
        >
          {/* ── Background marquees ── */}
          <div className="absolute inset-0 z-0 flex flex-col justify-center gap-6 pointer-events-none overflow-hidden opacity-[0.06]">
            {MARQUEE_ROWS.map((row, i) => (
              <div key={i} className="overflow-hidden">
                <div
                  ref={(el: HTMLDivElement | null) => { if (el) marqueeRefs.current[i] = el; }}
                  className="flex w-max gap-12 whitespace-nowrap text-[clamp(1rem,2vw,1.5rem)] font-bold uppercase tracking-[0.25em] text-[var(--theme-text)]"
                >
                  {[...Array(4)].map((_, j) => (
                    <span key={j}>{row.text}&nbsp;&nbsp;&nbsp;</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Left text column ── */}
          <div
            ref={heroColRef}
            className="absolute left-0 top-0 h-full flex flex-col justify-center pl-20 z-20 max-w-[38%] pointer-events-none"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-primary mb-6">
              01 — Collection
            </p>
            <h2
              className="font-display font-bold uppercase leading-[0.88] tracking-[-0.04em] text-[var(--theme-text)] mb-10"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5.5rem)' }}
            >
              See the<br />World<br />Differently.
            </h2>
            {/* Feature badges */}
            <div className="flex flex-col gap-3">
              {['UV400 Precision Lenses', 'Titanium Micro-Hinge', 'AI Face-Fit Engine'].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--theme-text)]/60 border border-[var(--theme-text)]/15 rounded-full px-4 py-2 w-fit"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-primary shrink-0" />
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* ── Card stage: left + center + right ── */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {/* LEFT card – starts hidden behind center */}
            <div
              ref={leftCardRef}
              className="absolute"
              style={{ opacity: 0, scale: 0.82, transform: 'xPercent(0)' }}
            >
              <CardItem card={CARDS[0]} badgeRef={badgeLeftRef} />
            </div>

            {/* CENTER card – starts offset right, morphs to center */}
            <div
              ref={centerCardRef}
              className="absolute"
              style={{ transform: 'translateX(28vw)' }}
            >
              <CardItem card={CARDS[1]} badgeRef={badgeCenterRef} isHero />
            </div>

            {/* RIGHT card – starts hidden behind center */}
            <div
              ref={rightCardRef}
              className="absolute"
              style={{ opacity: 0, scale: 0.82 }}
            >
              <CardItem card={CARDS[2]} badgeRef={badgeRightRef} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Single card visual ── */
function CardItem({
  card,
  badgeRef,
  isHero = false,
}: {
  card: (typeof CARDS)[number];
  badgeRef: React.RefObject<HTMLSpanElement | null>;
  isHero?: boolean;
}) {
  return (
    <Link href={card.href} className="group block select-none">
      <div className="flex flex-col items-center gap-4">
        {/* Category badge — revealed by GSAP */}
        <span
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[var(--theme-text)]/20 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text)]/70 bg-[var(--theme-bg)]/80 backdrop-blur-sm"
          style={{ opacity: 0, transform: 'translateY(10px)' }}
        >
          <span className="w-1 h-1 rounded-full bg-gold-primary" />
          {card.label}
        </span>

        {/* Image card */}
        <div
          className="overflow-hidden relative"
          style={{
            width: isHero ? 'clamp(200px, 22vw, 340px)' : 'clamp(160px, 18vw, 280px)',
            height: isHero ? 'clamp(280px, 34vw, 520px)' : 'clamp(230px, 28vw, 430px)',
            borderRadius: '2rem',
          }}
        >
          <img
            src={card.img}
            alt={card.label}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Bottom label */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-white font-display font-bold text-lg tracking-tight">{card.label}</p>
            <p className="text-white/60 text-xs uppercase tracking-widest mt-0.5">{card.sub}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
