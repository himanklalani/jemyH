'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, ScanFace, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface FaceShapeQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHAPES = [
  { 
    id: 'round', 
    label: 'Round', 
    desc: 'Soft angles with equal width and length. Characterized by full cheeks and a rounded chin.', 
    recommended: ['Square', 'Rectangle', 'Wayfarer', 'Geometric'], 
    avoid: ['Round', 'Small frames', 'Oversized circles'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12">
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  },
  { 
    id: 'square', 
    label: 'Square', 
    desc: 'Strong, prominent jawline and a broad forehead. Width and length are proportionate.', 
    recommended: ['Round', 'Oval', 'Aviator', 'Cat-Eye'], 
    avoid: ['Square', 'Geometric', 'Sharp angles'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12">
        <rect x="5" y="4" width="14" height="16" rx="4" />
      </svg>
    )
  },
  { 
    id: 'oval', 
    label: 'Oval', 
    desc: 'Balanced proportions, slightly longer than it is wide, with softly curved jawline.', 
    recommended: ['Any Shape', 'Geometric', 'Aviator', 'Oversized'], 
    avoid: ['Extremely narrow frames'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12">
        <ellipse cx="12" cy="12" rx="7" ry="10" />
      </svg>
    )
  },
  { 
    id: 'heart', 
    label: 'Heart', 
    desc: 'Wide forehead and cheekbones that taper down to a narrow, defined chin.', 
    recommended: ['Bottom-heavy', 'Oval', 'Light-colored frames', 'Rimless'], 
    avoid: ['Top-heavy', 'Decorative temples', 'Browline'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    )
  },
];

type Step = 'selection' | 'analyzing' | 'result';

export default function FaceShapeQuizModal({ isOpen, onClose }: FaceShapeQuizProps) {
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('selection');
  const [progress, setProgress] = useState(0);

  const activeShape = SHAPES.find(s => s.id === selectedShape);

  // Handle the analyzing simulation
  useEffect(() => {
    if (step === 'analyzing') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('result'), 400); // Small pause at 100%
            return 100;
          }
          return p + Math.floor(Math.random() * 15) + 5;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedShape(null);
      setStep('selection');
      setProgress(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl bg-[#F4F4F0] dark:bg-[#11131A] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] max-h-[640px] min-h-[500px] border border-black/5 dark:border-white/5"
          >
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-all hover:scale-105 hover:rotate-90 duration-300"
            >
              <X size={20} className="text-black dark:text-white" />
            </button>

            {/* Left Panel: Visual/Storytelling */}
            <div className="hidden md:flex w-[45%] bg-[#1A1F2C] text-white p-8 lg:p-12 flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F2C] to-black/80 z-0"></div>
              
              {/* Subtle animated grid background */}
              <div className="absolute inset-0 z-0 opacity-10" 
                   style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
              </div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                  <ScanFace size={26} className="text-[#E6A355]" />
                </div>
                <h2 className="text-[2.75rem] font-display font-bold uppercase tracking-[-0.03em] leading-[0.9] mb-6">
                  Find Your<br/>Perfect Fit.
                </h2>
                <p className="text-white/50 text-sm tracking-wide leading-relaxed font-mono max-w-[90%]">
                  Facial geometry dictates optical harmony. 
                  Provide your baseline structure, and our algorithm will generate the exact silhouettes designed to enhance your natural proportions.
                </p>
              </div>

              <div className="relative z-10">
                 <div className="flex items-center gap-3 text-[#E6A355] text-xs font-bold uppercase tracking-[0.2em] bg-[#E6A355]/10 px-4 py-2 rounded-full inline-flex border border-[#E6A355]/20">
                   <Sparkles size={14} /> <span>Algorithmic Curation</span>
                 </div>
              </div>
            </div>

            {/* Right Panel: Interactive Quiz */}
            <div className="w-full md:w-[55%] p-6 lg:p-12 flex flex-col relative bg-[#F4F4F0] dark:bg-[#11131A] overflow-y-auto">
              
              <AnimatePresence mode="wait">
                
                {/* STEP 1: SELECTION */}
                {step === 'selection' && (
                  <motion.div 
                    key="selection"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <div className="mb-6 lg:mb-8">
                      <h3 className="text-3xl font-display font-bold text-[#1A1F2C] dark:text-white uppercase tracking-tight mb-2">Identify Geometry</h3>
                      <p className="text-black/50 dark:text-white/50 font-mono text-xs uppercase tracking-widest">Select your primary facial structure</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                      {SHAPES.map((shape) => {
                        const isSelected = selectedShape === shape.id;
                        return (
                          <button
                            key={shape.id}
                            onClick={() => setSelectedShape(shape.id)}
                            className={`group relative p-4 md:p-5 rounded-3xl border transition-all duration-500 flex flex-col items-center text-center overflow-hidden
                              ${isSelected 
                                ? 'border-[#1A1F2C] dark:border-white bg-white dark:bg-white/10 shadow-xl scale-[1.02]' 
                                : 'border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10'
                              }`}
                          >
                            <div className={`mb-4 transition-colors duration-500 ${isSelected ? 'text-[#1A1F2C] dark:text-white' : 'text-black/30 dark:text-white/30 group-hover:text-black/60 dark:group-hover:text-white/60'}`}>
                              {shape.icon}
                            </div>
                            <h4 className={`text-lg font-display font-bold uppercase tracking-wide mb-2 transition-colors ${isSelected ? 'text-[#1A1F2C] dark:text-white' : 'text-black/60 dark:text-white/60'}`}>
                              {shape.label}
                            </h4>
                            <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed max-w-[90%] mx-auto hidden sm:block">
                              {shape.desc.split('.')[0]}.
                            </p>
                            
                            {/* Selection Indicator */}
                            <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                                ${isSelected ? 'border-[#1A1F2C] dark:border-white bg-[#1A1F2C] dark:bg-white' : 'border-black/10 dark:border-white/10'}
                            `}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#1A1F2C]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 flex justify-end shrink-0">
                      <button 
                        onClick={() => setStep('analyzing')}
                        disabled={!selectedShape}
                        className="group relative overflow-hidden flex items-center gap-3 bg-[#1A1F2C] dark:bg-white text-white dark:text-[#1A1F2C] px-10 py-5 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Analyze Profile <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-black dark:bg-[#EAEBE6] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: ANALYZING (SCANNING SIMULATION) */}
                {step === 'analyzing' && (
                  <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="flex-1 flex flex-col items-center justify-center h-full text-center"
                  >
                    <div className="relative w-40 h-40 mb-10">
                      {/* Base Icon */}
                      <div className="absolute inset-0 text-black/10 dark:text-white/10 flex items-center justify-center">
                         {activeShape?.icon}
                      </div>
                      
                      {/* Scanning Line */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 w-full h-[2px] bg-[#E6A355] shadow-[0_0_15px_#E6A355] z-10"
                      />
                      
                      {/* Highlighted Icon Masked by Progress */}
                      <div className="absolute inset-0 overflow-hidden text-[#1A1F2C] dark:text-white flex items-center justify-center" style={{ height: `${progress}%` }}>
                         {activeShape?.icon}
                      </div>
                    </div>

                    <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-[#1A1F2C] dark:text-white mb-4">
                      Processing Geometry
                    </h3>
                    
                    <div className="w-64 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        className="h-full bg-[#1A1F2C] dark:bg-white"
                        style={{ width: `${progress}%` }}
                        layout
                      />
                    </div>
                    
                    <p className="font-mono text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest">
                      Cross-referencing {activeShape?.label} profile against 10,000+ catalog permutations... {progress}%
                    </p>
                  </motion.div>
                )}

                {/* STEP 3: RESULT */}
                {step === 'result' && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <div className="mb-8">
                      <div className="flex items-center gap-2 text-[#E6A355] mb-4">
                        <CheckCircle2 size={18} />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Profile Validated</span>
                      </div>
                      <h3 className="text-4xl font-display font-bold uppercase tracking-tight text-[#1A1F2C] dark:text-white mb-4">
                        <span className="text-[#E6A355] block text-sm tracking-[0.3em] mb-2">Base Structure</span>
                        {activeShape?.label}
                      </h3>
                      <p className="text-black/60 dark:text-white/60 text-sm leading-relaxed max-w-[90%]">
                        {activeShape?.desc}
                      </p>
                    </div>

                    <div className="space-y-6 flex-1 mt-4">
                      {/* Recommendations */}
                      <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
                        <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1F2C]/60 dark:text-white/60 mb-5">
                          Architectural Matches
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeShape?.recommended.map((tag, i) => (
                            <motion.span 
                              key={tag} 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1, duration: 0.4 }}
                              className="px-4 py-2 bg-[#1A1F2C] dark:bg-white text-white dark:text-[#1A1F2C] rounded-full text-xs font-bold uppercase tracking-wider"
                            >
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      {/* Avoid */}
                      <div className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-transparent">
                        <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 mb-4">
                          Avoid Geometries
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeShape?.avoid.map((tag) => (
                            <span key={tag} className="px-3 py-1.5 text-black/50 dark:text-white/50 rounded-full border border-black/10 dark:border-white/10 text-xs uppercase tracking-wider">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-6 flex justify-between items-center">
                      <button 
                        onClick={() => setStep('selection')}
                        className="font-mono text-[10px] font-bold text-black/40 hover:text-[#1A1F2C] dark:text-white/40 dark:hover:text-white uppercase tracking-[0.2em] transition-colors border-b border-transparent hover:border-current pb-1"
                      >
                        Reset Profile
                      </button>
                      
                      <Link 
                        href={`/products?shape=${activeShape?.recommended.map(s => s.toLowerCase()).join(',')}`}
                        onClick={onClose}
                        className="group relative overflow-hidden flex items-center gap-3 bg-[#E6A355] text-[#1A1F2C] px-10 py-5 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(230,163,85,0.2)]"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          View Collection <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                      </Link>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
