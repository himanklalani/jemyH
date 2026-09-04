'use client';

import Link from 'next/link';

interface Slide {
  src: string;
  label?: string;
  caption?: string;
  link?: string;
  altText?: string;
  ctaText?: string;
}

interface AdvertisementScrollStackProps {
  slides: Slide[];
}

export default function AdvertisementScrollStack({ slides = [] }: AdvertisementScrollStackProps) {
  const displaySlides = slides.length > 0 ? slides : [
    {
      src: '/images/editorial_1_1787494326577.jpg',
      label: 'Vol 1',
      caption: 'The Vanguard Collection',
      link: '/products',
      ctaText: 'Discover',
    },
    {
      src: '/images/editorial_3_1787494364240.jpg',
      label: 'Vol 2',
      caption: 'Titanium Architecture',
      link: '/products',
      ctaText: 'Explore',
    }
  ];

  return (
    <section className="relative w-full bg-[#1C2740]">
      {displaySlides.map((slide, index) => (
        <div 
          key={index}
          className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.4)]"
          style={{ zIndex: index + 10 }} // Ensure subsequent layers stack on top
        >
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={slide.src} 
              alt={slide.altText || slide.caption || slide.label || 'Advertisement'} 
              className="w-full h-full object-cover scale-[1.01]" // scale slightly to avoid 1px gaps
            />
            {/* Vignette Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C2740]/90 via-[#1C2740]/20 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 flex flex-col items-center justify-end h-full w-full pb-20 md:pb-32 px-6 text-center">
            {slide.label && (
              <span className="mb-4 inline-block px-4 py-1.5 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-gold-primary backdrop-blur-md">
                {slide.label}
              </span>
            )}
            
            {slide.caption && (
              <h2 
                className="font-display font-bold uppercase text-white leading-[0.9] tracking-[-0.02em] max-w-4xl mb-8"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', wordSpacing: '0.15em' }}
              >
                {slide.caption}
              </h2>
            )}

            <Link 
              href={slide.link || "/products"} 
              className="group flex items-center gap-4 bg-white/10 hover:bg-white text-white hover:text-black transition-colors duration-300 backdrop-blur-md px-8 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest"
            >
              {slide.ctaText || "Discover"}
              <span className="w-6 h-px bg-current transition-all duration-300 group-hover:w-10" />
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
