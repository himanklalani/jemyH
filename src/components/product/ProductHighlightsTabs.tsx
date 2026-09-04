'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HIGHLIGHTS = [
  {
    id: 'material',
    label: 'Material',
    title: 'Lightweight TR90 & Acetate',
    description: 'Engineered for all-day comfort. Our proprietary blend ensures maximum durability while maintaining a featherweight profile on your face.',
    image: '/images/macro_detail.png', // Fallback to existing high-res macro shot
  },
  {
    id: 'hinge',
    label: 'Hinge',
    title: 'Titanium Micro-Hinge',
    description: 'Frictionless folding. We use surgical-grade titanium for our hinges, tested for over 50,000 cycles to guarantee a lifetime of smooth operation.',
    image: '/images/lookbook_2.png',
  },
  {
    id: 'temple',
    label: 'Temple',
    title: 'Ergonomic Grip',
    description: 'Designed to trace the natural curvature of your skull, distributing weight evenly to eliminate pressure points behind the ears.',
    image: '/images/titanium_macro_1787494244263.png',
  },
  {
    id: 'nosepad',
    label: 'Nosepad',
    title: 'Comfortable Built-In',
    description: 'Seamless integration. For our acetate frames, the nosepads are sculpted directly from the chassis for a secure, non-slip fit.',
    image: '/images/glasses_macro_1787493118137.png',
  }
];

export default function ProductHighlightsTabs() {
  const [activeTab, setActiveTab] = useState(HIGHLIGHTS[0].id);

  const activeContent = HIGHLIGHTS.find(h => h.id === activeTab)!;

  return (
    <div className="bg-[#EAEBE6] rounded-3xl p-8 md:p-12 mb-16">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="font-display font-bold text-3xl text-indigo-900">Product Highlights</h2>
        <span className="bg-white text-indigo-900 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm">New</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Content & Tabs */}
        <div className="lg:w-1/2 flex flex-col justify-between order-2 lg:order-1">
          {/* Tabs */}
          <div className="flex gap-2 mb-10 overflow-x-auto hide-scrollbar pb-2">
            {HIGHLIGHTS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 shrink-0 ${
                    isActive 
                      ? 'bg-indigo-900 text-white shadow-md' 
                      : 'bg-white border border-indigo-900/10 text-indigo-900/60 hover:border-indigo-900/30'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Text Content with AnimatePresence */}
          <div className="relative min-h-[160px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeContent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <h3 className="font-display font-bold text-4xl text-indigo-900 mb-4 tracking-tight text-balance">
                  {activeContent.title}
                </h3>
                <p className="text-indigo-900/60 leading-relaxed text-pretty max-w-md">
                  {activeContent.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Image */}
        <div className="lg:w-1/2 order-1 lg:order-2">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-sm border border-indigo-900/5">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeContent.id}
                src={activeContent.image}
                alt={activeContent.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
