'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('adminToken');
    
    // If no admin token and not on the login page, redirect to the admin login page
    if (!token && !isLoginPage) {
      router.replace('/admin/login');
    }
  }, [pathname, isLoginPage, router]);

  // Prevent hydration mismatch
  if (!mounted) return <div className="min-h-screen bg-[var(--color-admin-bg)]" />;

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  
  // Prevent flashing the admin UI before the redirect happens
  if (!token && !isLoginPage) {
    return <div className="min-h-screen bg-[var(--color-admin-bg)]" />;
  }

  return <>{children}</>;
}
