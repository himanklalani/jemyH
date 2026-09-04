import { Metadata } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Jemy | Admin Dashboard',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-admin-bg)] text-[var(--color-admin-text)] selection:bg-[var(--color-gold-primary)] selection:text-[var(--color-indigo-950)]">
      <AdminSidebar />
      <AdminHeader />
      {/* 
        The lg:ml-64 offset aligns the main content to the right of the fixed sidebar on desktop.
        On mobile, the sidebar is an overlay, so main takes full width.
      */}
      <main className="min-h-[calc(100vh-5rem)] lg:ml-64 transition-all duration-300">
        <AdminAuthGuard>
          {children}
        </AdminAuthGuard>
      </main>
    </div>
  );
}
