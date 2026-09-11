'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
  { id: 'c1', label: 'Titanium Series', img: '/images/glasses_studio_stack_1_1787493158610.png', link: '/products/the-professor-classic' },
  { id: 'c2', label: 'Geometric Acetate', img: '/images/glasses_studio_stack_2_1787493171644.png', link: '/products/the-vanguard-chunky' },
  { id: 'c3', label: 'Optical Precision', img: '/images/glasses_studio_stack_3_1787493184622.png', link: '/products/the-vanguard-chunky' },
  { id: 'c4', label: 'Sun Polarized', img: '/images/glasses_studio_stack_4_1787493197525.png', link: '/products/the-maverick-sunglasses' },
  { id: 'c5', label: 'Editorial Edition', img: '/images/glasses_studio_1787493089248.png', link: '/products/the-architect-optical' },
];

export default function StackedGlassDeck({ cards = [] }: { cards?: any[] }) {
  const activeCards = cards.length > 0 ? cards : CARDS;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Constants for 3D depth and offsets
  const zOffset = 180;
  const yOffset = 40;

  // Deck animation renderer: animates cards to their exact resting configuration for targetIndex
  const renderDeck = useCallback((targetIndex: number, duration = 0.65) => {
    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      if (i < targetIndex) {
        // Discarded front cards: flip forward and drop out of view
        gsap.to(card, {
          rotateX: -85,
          y: 800,
          z: 0,
          opacity: 0,
          duration,
          ease: 'power2.inOut',
          pointerEvents: 'none',
          overwrite: 'auto',
        });
      } else {
        // Active and remaining queued cards
        const pos = i - targetIndex;
        gsap.to(card, {
          rotateX: 0,
          y: -pos * yOffset,
          z: -pos * zOffset,
          opacity: Math.max(1 - pos * 0.25, 0),
          duration,
          ease: 'power2.out',
          pointerEvents: pos === 0 ? 'auto' : 'none',
          overwrite: 'auto',
        });
      }
    });
  }, [yOffset, zOffset]);

  // Navigate to a specific card index with debounce lock (only 1 step per scroll gesture)
  const goToCard = useCallback((targetIndex: number, speed = 0.65) => {
    if (targetIndex < 0 || targetIndex >= activeCards.length) return;
    if (targetIndex === currentIndexRef.current && !isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    currentIndexRef.current = targetIndex;
    setActiveIndex(targetIndex);

    renderDeck(targetIndex, speed);

    // Sync window scroll position cleanly with ScrollTrigger's range
    const st = scrollTriggerRef.current;
    if (st && st.start != null && st.end != null) {
      const totalSteps = activeCards.length - 1;
      const targetScroll = st.start + (targetIndex / totalSteps) * (st.end - st.start);
      // Update scroll without firing passive loops
      if (Math.abs(window.scrollY - targetScroll) > 10) {
        window.scrollTo({ top: targetScroll, behavior: 'instant' });
      }
    }

    // Cooldown lock to ensure a single scroll flick only triggers exactly 1 card
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, speed * 1000 + 100);
  }, [activeCards.length, renderDeck]);

  // Initialize initial 3D positions
  useGSAP(() => {
    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      gsap.set(card, {
        z: -i * zOffset,
        y: -i * yOffset,
        rotateX: 0,
        opacity: Math.max(1 - i * 0.25, 0),
        transformOrigin: '50% 100%',
        pointerEvents: i === 0 ? 'auto' : 'none',
      });
    });

    // Pinned ScrollTrigger with 1-screen scroll distance per card transition
    const totalSteps = activeCards.length - 1;
    const st = ScrollTrigger.create({
      trigger: wrapperRef.current,
      pin: pinRef.current,
      start: 'top top',
      end: () => `+=${totalSteps * window.innerHeight}`,
      anticipatePin: 1,
      onEnter: () => {
        // Entering from above
        goToCard(0, 0.4);
      },
      onEnterBack: () => {
        // Entering from below
        goToCard(activeCards.length - 1, 0.4);
      },
      onUpdate: (self) => {
        // If user manually moves the scrollbar or uses PageDown/Up
        if (!isAnimatingRef.current) {
          const expectedStep = Math.min(
            totalSteps,
            Math.max(0, Math.round(self.progress * totalSteps))
          );
          if (expectedStep !== currentIndexRef.current) {
            currentIndexRef.current = expectedStep;
            setActiveIndex(expectedStep);
            renderDeck(expectedStep, 0.35);
          }
        }
      },
    });

    scrollTriggerRef.current = st;

    return () => {
      st.kill();
    };
  }, { scope: wrapperRef, dependencies: [activeCards.length, goToCard, renderDeck] });

  // Native wheel and touch event interception: locks to 1 scroll per card
  useEffect(() => {
    const pinEl = pinRef.current;
    if (!pinEl) return;

    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      const st = scrollTriggerRef.current;
      if (!st || !st.isActive) return;

      const current = currentIndexRef.current;
      const maxIndex = activeCards.length - 1;

      // Scrolling DOWN
      if (e.deltaY > 15) {
        if (current < maxIndex) {
          // Inside deck: capture wheel and advance exactly 1 card
          e.preventDefault();
          e.stopPropagation();
          if (!isAnimatingRef.current) {
            goToCard(current + 1);
          }
        }
        // If current === maxIndex, do not preventDefault: let page scroll naturally to next section
      }
      // Scrolling UP
      else if (e.deltaY < -15) {
        if (current > 0) {
          // Inside deck: capture wheel and return exactly 1 card
          e.preventDefault();
          e.stopPropagation();
          if (!isAnimatingRef.current) {
            goToCard(current - 1);
          }
        }
        // If current === 0, do not preventDefault: let page scroll naturally to previous section
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const st = scrollTriggerRef.current;
      if (!st || !st.isActive) return;

      const current = currentIndexRef.current;
      const maxIndex = activeCards.length - 1;
      const deltaY = touchStartY - e.touches[0].clientY;

      if (Math.abs(deltaY) > 40) {
        if (deltaY > 0 && current < maxIndex) {
          // Swiped UP -> Advance 1 card
          e.preventDefault();
          if (!isAnimatingRef.current) {
            goToCard(current + 1);
            touchStartY = e.touches[0].clientY;
          }
        } else if (deltaY < 0 && current > 0) {
          // Swiped DOWN -> Go back 1 card
          e.preventDefault();
          if (!isAnimatingRef.current) {
            goToCard(current - 1);
            touchStartY = e.touches[0].clientY;
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const st = scrollTriggerRef.current;
      if (!st || !st.isActive) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (currentIndexRef.current < activeCards.length - 1) {
          e.preventDefault();
          goToCard(currentIndexRef.current + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (currentIndexRef.current > 0) {
          e.preventDefault();
          goToCard(currentIndexRef.current - 1);
        }
      }
    };

    pinEl.addEventListener('wheel', handleWheel, { passive: false });
    pinEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    pinEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      pinEl.removeEventListener('wheel', handleWheel);
      pinEl.removeEventListener('touchstart', handleTouchStart);
      pinEl.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeCards.length, goToCard]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        ref={pinRef}
        data-lenis-prevent="true"
        className="h-screen w-full overflow-hidden flex flex-col items-center justify-center relative select-none"
        style={{ backgroundColor: 'var(--theme-bg)' }}
      >
        {/* Section Header */}
        <div className="absolute top-16 md:top-20 z-50 text-center pointer-events-none px-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-primary">
              03 - Silhouettes
            </span>
            <span className="text-[10px] font-mono text-[var(--theme-text)]/40">/</span>
            <span className="text-[10px] font-mono tracking-widest text-[var(--theme-text)]/60">
              0{activeIndex + 1} &mdash; 0{activeCards.length}
            </span>
          </div>

          <h2 className="font-display font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[var(--theme-text)] text-4xl md:text-5xl mb-4">
            Frame Archive
          </h2>

          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/products" 
              className="inline-block border-b border-[var(--theme-text)]/30 pb-1 text-[11px] uppercase tracking-widest font-bold text-[var(--theme-text)] hover:text-gold-primary hover:border-gold-primary transition-all pointer-events-auto"
            >
              Explore Archive &rarr;
            </Link>
          </div>
        </div>

        {/* 3D Perspective Stage */}
        <div 
          className="relative w-[85%] md:w-full max-w-lg aspect-[4/5] md:aspect-square flex items-center justify-center mt-28 md:mt-10"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
          {activeCards.map((card, i) => (
            <div
              key={card.id}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="absolute inset-0 w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl flex items-end justify-center pb-12 will-change-transform cursor-pointer transition-shadow hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
              style={{
                zIndex: activeCards.length - i,
              }}
              onClick={() => {
                // If a card behind is clicked, jump to it
                if (i > activeIndex) {
                  goToCard(i);
                }
              }}
            >
              <img
                src={card.img || card.src || card.imageUrl}
                alt={card.label || card.title || 'Glasses'}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
              
              <div className="relative z-10 text-center pointer-events-none space-y-2">
                <span className="inline-block border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full backdrop-blur-md bg-black/30 shadow-lg">
                  {card.label || card.title}
                </span>
              </div>
              
              {/* Clickable Overlay for the active card */}
              {i === activeIndex && (
                <Link 
                  href={card.link || '#'} 
                  className="absolute inset-0 z-20 pointer-events-auto" 
                  aria-label={`View ${card.label || card.title}`} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Pagination Indicators (Clickable) */}
        <div className="absolute bottom-8 md:bottom-10 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          {activeCards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => goToCard(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === activeIndex 
                  ? 'w-7 h-1.5 bg-gold-primary' 
                  : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
              }`}
              title={`Jump to ${card.label || `Frame 0${idx + 1}`}`}
              aria-label={`Go to frame ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
