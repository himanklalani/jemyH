'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Fast client-side JWT payload parser to optimistically authorize
 * verified admin users without waiting for a network waterfall.
 */
function isClientAdminToken(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    if (payload.exp && Date.now() >= payload.exp * 1000) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Optimistically authorize immediately if token contains admin role
  const [authorized, setAuthorized] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('adminToken') || localStorage.getItem('jemy_token');
    return isClientAdminToken(token) ? true : null;
  });

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAccess = async () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('jemy_token');

      if (!token) {
        localStorage.removeItem('adminToken');
        if (isMounted) setAuthorized(false);
        router.replace('/login');
        return;
      }

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch('/api/user/profile', {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.role === 'admin') {
            localStorage.setItem('adminToken', token);
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

  // If not yet authorized (e.g., token verification in progress without cached admin role), show dark loader
  if (authorized !== true) {
    return (
      <div className="min-h-screen bg-[var(--color-admin-bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
