'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Globe, Menu } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';

export default function AdminHeader() {
  const pathname = usePathname();
  const { toggleSidebar } = useAdminStore();
  
  if (pathname === '/admin/login') return null;

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-admin-bg)]/80 backdrop-blur-xl border-b border-[var(--color-admin-border)] h-20 flex items-center justify-between px-4 md:px-8 lg:ml-64">
      
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden text-[var(--color-admin-text)] p-2 hover:bg-[var(--color-admin-surface)] rounded-md transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-4 bg-[var(--color-admin-surface)] rounded-full px-4 py-2.5 w-96 border border-[var(--color-admin-border)] transition-colors hover:border-[var(--color-admin-text-muted)] focus-within:border-[var(--color-gold-primary)]">
          <Search size={16} className="text-[var(--color-admin-text-muted)] shrink-0" />
          <input 
            type="text" 
            placeholder="Search orders, products, users..." 
            className="bg-transparent border-none outline-none text-[var(--color-admin-text)] text-sm w-full placeholder:text-[var(--color-admin-text-muted)]"
          />
        </div>
      </div>

      {/* Profile & Tools */}
      <div className="flex items-center gap-4 md:gap-6 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] text-[var(--color-admin-text)] text-xs font-medium tracking-wide">
          <Globe size={14} className="text-[var(--color-gold-primary)]" />
          <span>GLOBAL VIEW</span>
        </div>

        <button className="relative text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-gold-dark)] to-[var(--color-gold-light)] flex items-center justify-center text-[var(--color-indigo-950)] font-serif font-bold text-lg">
          A
        </div>
      </div>
    </header>
  );
}
