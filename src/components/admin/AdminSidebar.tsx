'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Activity, Users, Settings, Megaphone, RotateCcw, LogOut, X, Layers, PenTool, MessageSquare } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';

const MENU_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/prescriptions', label: 'Prescriptions', icon: Activity },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/rma', label: 'Returns', icon: RotateCcw },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/categories', label: 'Categories', icon: Layers },
  { href: '/admin/blogs', label: 'Editorial', icon: PenTool },
  { href: '/admin/contact', label: 'Inbox', icon: MessageSquare },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useAdminStore();

  if (pathname === '/admin/login') return null;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-[var(--color-admin-bg)] border-r border-[var(--color-admin-border)] flex flex-col z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-[var(--color-admin-border)] flex justify-between items-center">
          <h1 className="text-2xl font-serif text-[var(--color-gold-primary)] tracking-tight">JEMY ADMIN</h1>
          <button onClick={closeSidebar} className="lg:hidden text-[var(--color-admin-text-muted)] hover:text-white">
            <X size={24} />
          </button>
        </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-[var(--ease-power4-out)] group
                ${isActive 
                  ? 'bg-[var(--color-admin-surface-hover)] text-[var(--color-admin-text)]' 
                  : 'text-[var(--color-admin-text-muted)] hover:bg-[var(--color-admin-surface)] hover:text-[var(--color-admin-text)]'
                }`}
            >
              <Icon size={18} className={`transition-colors ${isActive ? 'text-[var(--color-gold-primary)]' : 'group-hover:text-[var(--color-gold-primary)]'}`} />
              <span className="font-medium tracking-wide text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--color-admin-border)]">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[var(--color-admin-text-muted)] hover:bg-[var(--color-admin-surface)] hover:text-[var(--color-admin-text)] transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
