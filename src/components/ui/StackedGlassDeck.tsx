'use client';

import { useRef } from 'react';
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
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useGSAP(() => {
    // Basic settings for depth and offsets
    const zOffset = 180;
    const yOffset = 40;
    
    // Initial setup: position cards in Z-space
    cardsRef.current.forEach((card, i) => {
      gsap.set(card, {
        z: -i * zOffset,
        y: -i * yOffset,
        opacity: Math.max(1 - i * 0.25, 0),
        transformOrigin: '50% 100%', // Flip from bottom edge
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperRef.current,
        pin: pinRef.current,
        start: 'top top',
        end: `+=${activeCards.length * 100}vh`, // Increased from 70vh to slow down the scroll
        scrub: 1,
        anticipatePin: 1,
        snap: {
          snapTo: 'labels', // Snap gently to each labeled resting state
          duration: { min: 0.3, max: 0.8 },
          delay: 0.1, // Small delay so it's not rigid during active scrolling
          ease: 'power1.inOut',
        }
      },
    });

    // Animate each card falling away, while the rest step forward
    // We loop up to length - 1, because the last card just stays on screen.
    for (let i = 0; i < activeCards.length - 1; i++) {
      // Label the stable resting state of the current card
      tl.addLabel(`pause${i}`);
      
      // 1. Give it a tiny pause so it sits on screen briefly before falling
      tl.to({}, { duration: 0.2 });

      // 2. The active card falls forward and out of view
      tl.to(
        cardsRef.current[i],
        {
          rotateX: -85,
          y: 800,
          opacity: 0,
          duration: 1,
          ease: 'power2.inOut',
        },
        `step${i}` // Label for this step to sync background cards
      );

      // 3. Shift all remaining cards forward by one position
      for (let j = i + 1; j < activeCards.length; j++) {
        const newIndex = j - i - 1; // It becomes position 0, 1, 2...
        tl.to(
          cardsRef.current[j],
          {
            z: -newIndex * zOffset,
            y: -newIndex * yOffset,
            opacity: Math.max(1 - newIndex * 0.25, 0),
            duration: 1,
            ease: 'power2.inOut',
          },
          `step${i}` // Trigger exactly when the front card falls
        );
      }
    }
    
    // Label the final stable resting state for the last card
    tl.addLabel(`pause${activeCards.length - 1}`);
    // Add a final pause so the last card lingers
    tl.to({}, { duration: 0.5 });
    
  }, { scope: wrapperRef, dependencies: [activeCards] });

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        ref={pinRef}
        className="h-screen w-full overflow-hidden flex flex-col items-center justify-center relative"
        style={{ backgroundColor: 'var(--theme-bg)' }}
      >
        <div className="absolute top-20 md:top-24 z-50 text-center pointer-events-none px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-primary mb-4">
            03 — Silhouettes
          </p>
          <h2 className="font-display font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[var(--theme-text)] text-4xl md:text-5xl mb-6">
            Frame Archive
          </h2>
          <Link href="/products" className="inline-block border-b border-[var(--theme-text)]/30 pb-1 text-[11px] uppercase tracking-widest font-bold text-[var(--theme-text)] hover:text-gold-primary hover:border-gold-primary transition-all pointer-events-auto">
            Explore Archive &rarr;
          </Link>
        </div>

        {/* 3D Perspective Stage */}
        <div 
          className="relative w-[85%] md:w-full max-w-lg aspect-[4/5] md:aspect-square flex items-center justify-center mt-32 md:mt-0"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
          {activeCards.map((card, i) => (
            <div
              key={card.id}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className="absolute inset-0 w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl flex items-end justify-center pb-12 will-change-transform"
              style={{
                // Required to ensure 3D layers render in the right order visually despite absolute stacking
                zIndex: activeCards.length - i, 
              }}
            >
              <img
                src={card.img || card.src || card.imageUrl}
                alt={card.label || card.title || 'Glasses'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10 text-center pointer-events-none">
                <span className="inline-block border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full backdrop-blur-md">
                  {card.label || card.title}
                </span>
              </div>
              
              {/* Clickable Overlay */}
              <Link href={card.link || '#'} className="absolute inset-0 z-20 pointer-events-auto" aria-label={`View ${card.label || card.title}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
