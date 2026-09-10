'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAccess = async () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('jemy_token');

      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/user/profile', {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.role === 'admin') {
            if (token) {
              localStorage.setItem('adminToken', token);
            }
            if (isMounted) setAuthorized(true);
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
      router.replace('/login');
    };

    verifyAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // While verifying authorization, show dark loading state matching the admin panel
  if (authorized !== true) {
    return (
      <div className="min-h-screen bg-[var(--color-admin-bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
