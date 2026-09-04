'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface DualImageRevealProps {
  title?: string;
  subtitle?: string;
  description?: string;
  foregroundImg?: string;
  backgroundImg?: string;
}

export default function DualImageReveal({
  title = 'Optical Dualism',
  subtitle = 'Layered Precision',
  description = 'Our frames are designed with a dual-layer titanium core, providing unparalleled structural integrity while maintaining a featherweight profile. The interplay of materials creates a subtle visual depth.',
  foregroundImg = '/images/lookbook_1.png',
  backgroundImg = '/images/lookbook_2.png',
}: DualImageRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !bgCardRef.current) return;

    gsap.fromTo(
      bgCardRef.current,
      {
        scale: 0.85,
        x: 0,
        y: 0,
        opacity: 0,
        rotate: -2,
      },
      {
        scale: 1,
        x: 40,
        y: -40,
        opacity: 1,
        rotate: 4,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
          end: 'top 20%',
          scrub: 0.5,
        },
      }
    );
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="py-32 max-w-[1600px] mx-auto px-6 lg:px-12 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Left Column: Text */}
        <div className="max-w-xl z-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-primary mb-6">
            {subtitle}
          </p>
          <h2 
            className="font-display font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[var(--theme-text)] mb-8" 
            style={{ fontSize: 'clamp(2.5rem, 4vw, 4.5rem)' }}
          >
            {title}
          </h2>
          <p className="text-[var(--theme-text)]/60 text-lg leading-relaxed max-w-[55ch] text-pretty">
            {description}
          </p>
        </div>

        {/* Right Column: Dual Image Stack */}
        <div className="relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/5] max-w-lg mx-auto overflow-visible flex items-center justify-center">
          
          {/* Background Card (Z-0) */}
          <div 
            ref={bgCardRef}
            className="absolute inset-0 z-0 rounded-[32px] overflow-hidden border border-[var(--theme-text)]/10 shadow-2xl"
          >
            <img 
              src={backgroundImg} 
              alt="Secondary Layer" 
              className="w-full h-full object-cover grayscale opacity-80"
            />
            {/* Dark gradient overlay for background image to push it back visually */}
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Foreground Card (Z-10) */}
          <div className="relative z-10 w-full h-full rounded-[32px] overflow-hidden shadow-2xl transform transition-transform duration-700 hover:scale-[1.02]">
            <img 
              src={foregroundImg} 
              alt="Primary Layer" 
              className="w-full h-full object-cover"
            />
          </div>
          
        </div>
      </div>
    </section>
  );
}
