'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAccess = async () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('jemy_token');

      if (!token) {
        localStorage.removeItem('adminToken');
        if (isMounted) setAuthorized(false);
        if (!isLoginPage) {
          router.replace('/admin/login');
        }
        return;
      }

      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.role === 'admin') {
            localStorage.setItem('adminToken', token);
            if (isMounted) setAuthorized(true);
            if (isLoginPage) {
              router.replace('/admin');
            }
            return;
          }
        }
      } catch (error) {
        console.error('[AdminAuthGuard] Verification failed', error);
      }

      // Verification failed or user is not an admin
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new Event('auth-change'));
      if (isMounted) setAuthorized(false);

      if (!isLoginPage) {
        router.replace('/admin/login');
      }
    };

    verifyAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage, router]);

  // On login page: render login page if not authorized, or blank while redirecting if already admin
  if (isLoginPage) {
    if (authorized === true) {
      return <div className="min-h-screen bg-[var(--color-admin-bg)]" />;
    }
    return <>{children}</>;
  }

  // On all other admin pages: DO NOT render children until verified as true admin
  if (authorized !== true) {
    return <div className="min-h-screen bg-[var(--color-admin-bg)] flex items-center justify-center text-sm text-[var(--color-admin-text-muted)]" />;
  }

  return <>{children}</>;
}
