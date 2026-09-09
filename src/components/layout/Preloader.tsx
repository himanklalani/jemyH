'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Preloader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [counter, setCounter] = useState(0);

  if (pathname?.startsWith('/admin')) return null;

  // Skip preloader - high-intent / keyboard users should not be gated (awwwards rule 8)
  const skip = useCallback(() => {
    setIsLoading(false);
    sessionStorage.setItem('jemy_preloader_seen', 'true');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);

  // Keyboard shortcut: Esc or Space skips the preloader
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  // Main preloader timer + counter animation
  useEffect(() => {
    // Disable preloader on admin pages
    if (pathname?.startsWith('/admin')) {
      setIsLoading(false);
      return;
    }

    // Check if we've already shown the preloader this session
    const hasSeenPreloader = sessionStorage.getItem('jemy_preloader_seen');
    if (hasSeenPreloader) {
      setIsLoading(false);
      return;
    }

    // Lock scroll during preloader
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Randomised counter animation
    const interval = setInterval(() => {
      setCounter((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + Math.floor(Math.random() * 5) + 1, 100);
      });
    }, 90);

    // Unmount after counter finishes (~3.1s)
    const timeout = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('jemy_preloader_seen', 'true');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, 0);
    }, 3100);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[200] pointer-events-auto cursor-pointer"
          onClick={skip}
          role="presentation"
          aria-hidden="true"
        >
          {/* HUD Elements */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-between py-12 pointer-events-none">
            <div className="w-full px-12 flex justify-between text-white/40 font-mono text-[10px] uppercase tracking-widest">
              <span>Loading Experience</span>
              <span>{counter}%</span>
            </div>

            <div className="w-full px-12 flex justify-between items-end">
              <div className="text-white/40 font-mono text-[10px] uppercase tracking-widest">
                <span>Est. 2026</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-white/25 font-mono text-[9px] uppercase tracking-widest">Click or press Esc to skip</span>
                <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">Atelier</span>
              </div>
            </div>
          </div>

          {/* SVG Mask Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <mask id="jemy-text-mask">
                {/* White covers everything - the dark background shows through */}
                <rect width="100%" height="100%" fill="white" />
                {/* Black text is cut out (transparent), revealing the hero video beneath */}
                <motion.text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="black"
                  className="font-display font-bold uppercase tracking-[0.15em]"
                  style={{ fontSize: 'clamp(4rem, 12vw, 12rem)' }}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
                >
                  JEMY
                </motion.text>
              </mask>
            </defs>

            {/* The solid preloader background */}
            <rect
              width="100%"
              height="100%"
              fill="#1C2740"
              mask="url(#jemy-text-mask)"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
