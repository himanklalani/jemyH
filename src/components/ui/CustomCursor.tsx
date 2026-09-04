'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVariant, setCursorVariant] = useState('default');

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', mouseMove);

    // Add interactive elements listeners
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setCursorVariant('hover');
      } else if (target.closest('.magnetic-image')) {
        setCursorVariant('view');
      } else {
        setCursorVariant('default');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  const variants = {
    default: {
      x: mousePosition.x - 6,
      y: mousePosition.y - 6,
      height: 12,
      width: 12,
      backgroundColor: 'rgba(0,0,0,0)',
      mixBlendMode: 'difference' as const,
      border: '1px solid rgba(255, 255, 255, 0.8)',
    },
    hover: {
      x: mousePosition.x - 24,
      y: mousePosition.y - 24,
      height: 48,
      width: 48,
      backgroundColor: 'rgba(0,0,0,0)',
      mixBlendMode: 'difference' as const,
      border: '1px solid rgba(255, 255, 255, 0.5)',
    },
    view: {
      x: mousePosition.x - 32,
      y: mousePosition.y - 32,
      height: 64,
      width: 64,
      backgroundColor: '#E6A355', // gold-primary
      mixBlendMode: 'normal' as const,
      border: 'none',
    },
  };

  return (
    <>
      <motion.div
        id="jemy-cursor"
        variants={variants}
        animate={cursorVariant}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.15 }}
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[100] flex items-center justify-center hidden md:flex"
        style={{ transition: 'transform 0.12s ease' }}
      >
        {cursorVariant === 'view' && (
          <span className="text-[#1C2740] font-bold text-[10px] tracking-widest uppercase">View</span>
        )}
      </motion.div>
    </>
  );
}
