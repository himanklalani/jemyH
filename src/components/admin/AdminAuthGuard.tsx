'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('adminToken');
    
    // If no admin token and not trying to log in, bounce them to the homepage
    if (!token && pathname !== '/admin/login') {
      router.replace('/');
    }
  }, [pathname, router]);

  // Prevent hydration mismatch
  if (!mounted) return <div className="min-h-screen bg-[var(--color-admin-bg)]" />;

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  
  // Prevent flashing the admin UI before the redirect happens
  if (!token && pathname !== '/admin/login') {
    return <div className="min-h-screen bg-[var(--color-admin-bg)]" />;
  }

  return <>{children}</>;
}
