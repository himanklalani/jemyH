'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, ShoppingCart, Activity, Package, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [cartMetrics, setCartMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const [kpiRes, cartRes] = await Promise.all([
          fetch('/api/admin/dashboard/kpis', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/cart-audit?limit=5', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (kpiRes.status === 401 || kpiRes.status === 403 || cartRes.status === 401 || cartRes.status === 403) {
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
          return;
        }

        let kpiData, cartData;
        
        try {
          if (kpiRes.ok) kpiData = await kpiRes.json();
          if (cartRes.ok) cartData = await cartRes.json();
        } catch (parseError) {
          console.error("Failed to parse admin API response", parseError);
        }

        if (kpiData?.data) setKpis(kpiData.data);
        if (cartData?.data) setCartMetrics(cartData.data);
      } catch (error) {
        console.error('Error fetching admin data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin"></div>
      </div>
    );
  }

  // Calculate totals
  const totalRevenue = kpis?.revenue?.reduce((acc: number, item: any) => acc + item.totalRevenue, 0) || 0;
  const usRevenue = kpis?.revenue?.find((r: any) => r._id === 'US')?.totalRevenue || 0;
  const inRevenue = kpis?.revenue?.find((r: any) => r._id === 'IN')?.totalRevenue || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 ease-[var(--ease-power4-out)]">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Executive Overview</h1>
        <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Real-time metrics and system analytics.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue Card */}
        <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--color-gold-primary)] transition-colors duration-500">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-gold-dark)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-gold-primary)]/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-admin-bg)] flex items-center justify-center border border-[var(--color-admin-border)]">
              <DollarSign size={18} className="text-[var(--color-gold-primary)]" />
            </div>
            <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-md">+12.5%</span>
          </div>
          <div>
            <p className="text-[var(--color-admin-text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">Total Revenue</p>
            <h2 className="text-3xl font-serif text-[var(--color-admin-text)]">${totalRevenue.toLocaleString()}</h2>
            <div className="flex gap-4 mt-3 text-xs text-[var(--color-admin-text-muted)]">
              <span>US: ${usRevenue.toLocaleString()}</span>
              <span>IN: ₹{inRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Cart Abandonment */}
        <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--color-admin-text-muted)] transition-colors duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-admin-bg)] flex items-center justify-center border border-[var(--color-admin-border)]">
              <ShoppingCart size={18} className="text-[var(--color-admin-text-muted)] group-hover:text-[var(--color-admin-text)] transition-colors" />
            </div>
          </div>
          <div>
            <p className="text-[var(--color-admin-text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">Cart Abandonment</p>
            <h2 className="text-3xl font-serif text-[var(--color-admin-text)]">{cartMetrics?.metrics?.abandonmentRate || '0.00%'}</h2>
            <p className="mt-3 text-xs text-[var(--color-admin-text-muted)]">
              {cartMetrics?.metrics?.totalUniqueCarts} active carts
            </p>
          </div>
        </div>

        {/* Prescription Queue */}
        <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--color-admin-accent)] transition-colors duration-500">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-admin-accent)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-admin-accent)]/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-admin-bg)] flex items-center justify-center border border-[var(--color-admin-border)]">
              <Activity size={18} className="text-[var(--color-admin-accent)]" />
            </div>
            {kpis?.prescriptionQueueDepth > 0 && (
              <span className="text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-1 rounded-md animate-pulse">Action Required</span>
            )}
          </div>
          <div>
            <p className="text-[var(--color-admin-text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">Rx Queue Depth</p>
            <h2 className="text-3xl font-serif text-[var(--color-admin-text)]">{kpis?.prescriptionQueueDepth || 0}</h2>
            <p className="mt-3 text-xs text-[var(--color-admin-text-muted)]">
              Pending verifications
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-admin-bg)] flex items-center justify-center border border-[var(--color-admin-border)]">
              <Package size={18} className={kpis?.lowStockAlerts > 0 ? 'text-orange-400' : 'text-[var(--color-admin-text-muted)]'} />
            </div>
          </div>
          <div>
            <p className="text-[var(--color-admin-text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">Low Stock Alerts</p>
            <h2 className="text-3xl font-serif text-[var(--color-admin-text)]">{kpis?.lowStockAlerts || 0}</h2>
            <p className="mt-3 text-xs text-[var(--color-admin-text-muted)]">
              Items &lt; 10 units
            </p>
          </div>
        </div>

      </div>

      {/* Cart Activity Feed & Sales Trend placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl p-6 h-96 flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-6">7-Day Sales Trend</h3>
          <div className="flex-1 flex items-end justify-between border-b border-[var(--color-admin-border)] pb-2 gap-2">
            {kpis?.salesTrend?.length > 0 ? (
              kpis.salesTrend.map((day: any, i: number) => {
                const maxRevenue = Math.max(...kpis.salesTrend.map((d: any) => d.revenue), 1);
                const heightPercent = `${(day.revenue / maxRevenue) * 100}%`;
                return (
                  <div key={day._id} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group">
                    <div className="w-full max-w-[40px] bg-[var(--color-gold-primary)]/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-[var(--color-gold-primary)]" style={{ height: heightPercent }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] px-2 py-1 rounded text-xs font-mono text-[var(--color-admin-text)] z-10 shadow-lg whitespace-nowrap pointer-events-none">
                        ${day.revenue}
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--color-admin-text-muted)] uppercase">{new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center pb-10 text-[var(--color-admin-text-muted)]">No sales data for the last 7 days.</div>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl p-6 h-96 flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-6">Live Cart Activity</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {cartMetrics?.recentFeed?.length === 0 ? (
              <p className="text-[var(--color-admin-text-muted)] text-sm text-center mt-10">No recent activity.</p>
            ) : (
              cartMetrics?.recentFeed?.map((event: any) => (
                <div key={event._id} className="flex gap-4 items-start border-b border-[var(--color-admin-border)] pb-4 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${event.action === 'add' ? 'bg-green-400' : event.action === 'remove' ? 'bg-red-400' : 'bg-[var(--color-gold-primary)]'}`}></div>
                  <div>
                    <p className="text-sm text-[var(--color-admin-text)] font-medium capitalize">{event.action} item</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">{new Date(event.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
