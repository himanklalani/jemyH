'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function Breadcrumbs({ customName }: { customName?: string }) {
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
    <div className="inline-flex items-center gap-2 md:gap-3 px-3.5 py-1.5 md:py-2 rounded-full bg-white/80 backdrop-blur-md border border-indigo-900/10 shadow-sm text-indigo-950 pointer-events-auto max-w-full">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest hover:text-gold-primary transition-colors border-r border-indigo-950/15 pr-2.5 md:pr-3 py-0.5 shrink-0"
      >
        <ArrowLeft size={12} />
        Back
      </button>

      <nav className="flex items-center gap-1.5 md:gap-2 text-[10px] font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap truncate">
        <Link href="/" className="text-indigo-900/60 hover:text-gold-primary transition-colors shrink-0">
          Home
        </Link>
        
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const displayName = (isLast && customName) ? customName : formatSegment(segment);

          return (
            <div key={href} className="flex items-center gap-1.5 md:gap-2 truncate">
              <ChevronRight size={10} className="text-indigo-900/35 shrink-0" />
              {isLast ? (
                <span className="text-indigo-950 font-bold truncate">{displayName}</span>
              ) : (
                <Link href={href} className="text-indigo-900/60 hover:text-gold-primary transition-colors shrink-0">
                  {displayName}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

