'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on home page or admin pages
  if (!pathname || pathname === '/' || pathname.startsWith('/admin')) {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  const formatSegment = (segment: string) => {
    // Basic formatting: replace dashes with spaces and capitalize words
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed top-[72px] md:top-7 left-5 md:left-32 lg:left-40 z-40 flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-1 rounded-full bg-white/40 md:bg-white/30 backdrop-blur-md border border-black/5 shadow-sm text-indigo-950 pointer-events-auto">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest hover:text-gold-primary transition-colors border-r border-indigo-950/20 pr-2 md:pr-3 py-1"
      >
        <ArrowLeft size={12} />
        Back
      </button>

      <nav className="flex items-center gap-1.5 md:gap-2 text-[10px] font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
        <Link href="/" className="hover:text-gold-primary transition-colors">
          Home
        </Link>
        
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;

          return (
            <div key={href} className="flex items-center gap-2">
              <ChevronRight size={10} className="opacity-40" />
              {isLast ? (
                <span className="text-indigo-950">{formatSegment(segment)}</span>
              ) : (
                <Link href={href} className="hover:text-gold-primary transition-colors">
                  {formatSegment(segment)}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
