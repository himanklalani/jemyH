'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const LOOKS = [
  {
    id: '1',
    label: 'Dhaakad Spirit',
    tag: 'Lightweight',
    image: '/images/hero_bg.png', // Using existing assets as mock
    author: 'Seema Arora',
    role: 'AVP, People Excellence',
  },
  {
    id: '2',
    label: 'Urban Minimalist',
    tag: 'Titanium',
    image: '/images/titanium_lifestyle_1_1787494228901.png',
    author: 'Marcus Chen',
    role: 'Creative Director',
  },
  {
    id: '3',
    label: 'Studio Session',
    tag: 'Acetate',
    image: '/images/glasses_lifestyle_1_1787493103772.png',
    author: 'Elena Rostova',
    role: 'Architect',
  },
  {
    id: '4',
    label: 'Weekend Retreat',
    tag: 'Polarized',
    image: '/images/titanium_lifestyle_2_1787494257550.png',
    author: 'David Kim',
    role: 'Industrial Designer',
  }
];

export default function InspirationLooks() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="py-16 mb-8 overflow-hidden">
      <div className="flex items-center gap-3 mb-10 px-6 lg:px-12 max-w-[1600px] mx-auto">
        <h2 className="font-display font-bold text-3xl text-indigo-900">Get Inspired with looks</h2>
        <span className="bg-indigo-900/5 text-indigo-900 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">Trending</span>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={containerRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 lg:px-12 pb-8 hide-scrollbar"
        style={{ paddingRight: '10vw' }}
      >
        {LOOKS.map((look) => (
          <div 
            key={look.id} 
            className="snap-start shrink-0 relative w-[280px] md:w-[320px] aspect-[3/4] rounded-3xl overflow-hidden group shadow-lg border border-indigo-900/5 bg-black"
          >
            <img 
              src={look.image} 
              alt={look.label} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Top Tag */}
            <div className="absolute top-4 left-4">
              <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                {look.tag}
              </span>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-6 inset-x-6 text-center">
              <h3 className="font-display font-bold text-2xl text-white mb-2">{look.label}</h3>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 inline-block">
                <p className="text-[11px] font-bold text-white mb-0.5">{look.author}</p>
                <p className="text-[9px] text-white/70 uppercase tracking-widest">{look.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
