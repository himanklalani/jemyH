'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler } from 'lucide-react';
import { useState } from 'react';

interface MeasurementGuideProps {
  isOpen: boolean;
  onClose: () => void;
  // Dynamic props from the actual product if available
  lensWidth?: number;
  bridgeWidth?: number;
  templeLength?: number;
}

export default function FrameMeasurementGuide({ isOpen, onClose, lensWidth = 52, bridgeWidth = 18, templeLength = 140 }: MeasurementGuideProps) {
  const [activeTab, setActiveTab] = useState<'lens' | 'bridge' | 'temple'>('lens');

  const tabs = [
    { id: 'lens', label: 'Lens Width', val: lensWidth, desc: 'The horizontal width of each lens at its widest point. Typically ranges from 40mm to 60mm.' },
    { id: 'bridge', label: 'Bridge', val: bridgeWidth, desc: 'The distance between the two lenses. This dictates how the frame sits on your nose.' },
    { id: 'temple', label: 'Temple', val: templeLength, desc: 'The length of the arms from the hinge to the tip that rests behind your ear.' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, y: '100%', scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[var(--color-indigo-950)] rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] md:h-auto md:min-h-[500px]"
          >
            
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-[var(--color-indigo-950)]/80 backdrop-blur-md z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[var(--color-indigo-900)] dark:text-white">
                  <Ruler size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[var(--color-indigo-900)] dark:text-white">Measurement Guide</h3>
                  <p className="text-xs text-gray-500 tracking-wide uppercase">Reading Your Frame Size</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 md:p-10 flex-1 overflow-y-auto">
              
              <div className="flex items-center justify-center gap-4 mb-10 text-3xl font-mono tracking-widest text-[var(--color-indigo-900)] dark:text-white">
                <span className={activeTab === 'lens' ? 'text-[var(--color-gold-dark)]' : 'opacity-30'}>{lensWidth}</span>
                <span className="opacity-20">-</span>
                <span className={activeTab === 'bridge' ? 'text-[var(--color-gold-dark)]' : 'opacity-30'}>{bridgeWidth}</span>
                <span className="opacity-20">-</span>
                <span className={activeTab === 'temple' ? 'text-[var(--color-gold-dark)]' : 'opacity-30'}>{templeLength}</span>
              </div>

              {/* Interactive Illustration Placeholder */}
              <div className="w-full h-48 bg-gray-100 dark:bg-black/20 rounded-2xl mb-8 flex items-center justify-center border border-gray-200 dark:border-white/5 relative overflow-hidden">
                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold z-10">Interactive SVG Diagram renders here</p>
                {/* Visual indicators based on activeTab would highlight parts of the SVG */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <Ruler size={120} />
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                      ${activeTab === tab.id 
                        ? 'bg-[var(--color-indigo-900)] dark:bg-[var(--color-gold-primary)] text-white dark:text-[var(--color-indigo-950)] shadow-lg' 
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 text-center"
                >
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {tabs.find(t => t.id === activeTab)?.desc}
                  </p>
                  <p className="mt-4 text-xs font-bold text-[var(--color-indigo-900)] dark:text-[var(--color-gold-primary)] uppercase tracking-wider">
                    Current Frame: {tabs.find(t => t.id === activeTab)?.val}mm
                  </p>
                </motion.div>
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
