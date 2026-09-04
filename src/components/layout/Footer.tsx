'use client';

import { useRegionStore } from '@/store/useRegionStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ExternalLink, Globe } from 'lucide-react';

const SHOP_LINKS = [
  { label: 'Sunglasses',          href: '/products?category=sunglasses' },
  { label: 'Eyeglasses',          href: '/products?category=eyeglasses' },
  { label: 'New Arrivals',         href: '/products?sort=newest' },
  { label: 'Face Shape Guide',     href: '/#quiz' },
  { label: 'Frame Size Guide',     href: '/#guide' },
];

const SUPPORT_LINKS = [
  { label: 'My Account',          href: '/account' },
  { label: 'Track Order',         href: '/account' },
  { label: 'Returns & Exchanges', href: '/account' },
  { label: 'Prescription Upload', href: '/account' },
];

export default function Footer() {
  const { region } = useRegionStore();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-indigo-900 text-platinum-100">

      {/* Top: CTA Band */}
      <div className="border-b border-platinum-100/8">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-gold-primary font-semibold mb-3">Ready?</p>
            <h2 className="font-serif text-5xl lg:text-6xl text-platinum-100 leading-[1.0] tracking-tight">
              Find your<br />
              <em className="text-gold-primary">perfect frame.</em>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-gold-primary text-indigo-950 text-[11px] font-bold uppercase tracking-[0.12em] px-8 py-4 rounded-xl hover:bg-gold-light transition-all hover:scale-[1.02]"
            >
              Shop All Frames <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 border border-platinum-100/15 text-platinum-100 text-[11px] font-semibold uppercase tracking-[0.12em] px-8 py-4 rounded-xl hover:border-gold-primary hover:text-gold-primary transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="text-2xl font-serif tracking-[0.25em] text-gold-gradient">JEMY</Link>
            <p className="mt-5 text-platinum-100/50 text-sm leading-relaxed max-w-xs">
              Premium optical frames engineered for architectural integrity, optical precision, and timeless style. Shipped to the US & India.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full border border-platinum-100/15 flex items-center justify-center text-platinum-100/50 hover:border-gold-primary hover:text-gold-primary transition-all">
                <ExternalLink size={13} />
              </a>
              <a href="#" aria-label="Twitter / X" className="w-9 h-9 rounded-full border border-platinum-100/15 flex items-center justify-center text-platinum-100/50 hover:border-gold-primary hover:text-gold-primary transition-all">
                <Globe size={13} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="md:col-span-3 md:col-start-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-platinum-100/40 mb-6">Shop</h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-platinum-100/65 hover:text-gold-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-platinum-100/40 mb-6">Support</h3>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-platinum-100/65 hover:text-gold-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}

              {/* Region-specific legal */}
              {region === 'US' ? (
                <>
                  <li><Link href="/compliance/ccpa" className="text-sm text-platinum-100/65 hover:text-gold-primary transition-colors">Do Not Sell My Info</Link></li>
                  <li><Link href="/compliance/ftc" className="text-sm text-platinum-100/65 hover:text-gold-primary transition-colors">FTC Disclosures</Link></li>
                </>
              ) : (
                <>
                  <li><Link href="/compliance/grievance" className="text-sm text-platinum-100/65 hover:text-gold-primary transition-colors">Grievance Officer</Link></li>
                </>
              )}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-platinum-100/8">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-platinum-100/30 font-medium">
            © {new Date().getFullYear()} Jemy. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[11px] text-platinum-100/30 hover:text-platinum-100/60 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[11px] text-platinum-100/30 hover:text-platinum-100/60 transition-colors">Terms</Link>
            <span className="text-[11px] text-platinum-100/20">
              {region === 'US' ? '🇺🇸 United States' : '🇮🇳 India'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
