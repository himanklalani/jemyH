'use client';

import { useState, useEffect } from 'react';
import { Tag, Image as ImageIcon, Activity, Calendar, LayoutTemplate, Ticket } from 'lucide-react';
import CampaignsTab from './components/CampaignsTab';
import OffersTab from './components/OffersTab';
import AdvertisementsTab from './components/AdvertisementsTab';
import MerchandisingTab from './components/MerchandisingTab';
import CouponsTab from './components/CouponsTab';

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'offers' | 'ads' | 'storefront' | 'coupons'>('dashboard');
  const [metrics, setMetrics] = useState<any>({ activeCampaigns: 0, activeOffers: 0, activeAds: 0, activeMerchandising: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      const token = localStorage.getItem('adminToken');
      const [cRes, oRes, adRes, mRes] = await Promise.all([
        fetch('/api/admin/marketing/campaigns',      { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/marketing/offers',         { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/advertisements',           { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/marketing/merchandising',  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [cData, oData, adData, mData] = await Promise.all([cRes.json(), oRes.json(), adRes.json(), mRes.json()]);
      setMetrics({
        activeCampaigns:    cData.campaigns?.filter((c: any) => c.status === 'active').length || 0,
        activeOffers:       oData.offers?.filter((o: any) => o.isActive).length || 0,
        activeAds:          adData.advertisements?.filter((a: any) => a.isActive).length || 0,
        activeMerchandising: mData.items?.filter((m: any) => m.isActive).length || 0,
      });
    };
    fetchMetrics();
  }, [activeTab]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Marketing CMS</h1>
        <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage promotions, site banners, campaigns, and storefront layouts.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-admin-border)] overflow-x-auto pb-px">
        {[
          { id: 'dashboard',  label: 'Dashboard',          icon: Activity },
          { id: 'campaigns',  label: 'Campaigns',           icon: Calendar },
          { id: 'offers',     label: 'Offers',              icon: Tag },
          { id: 'ads',        label: 'Banners & Popups',    icon: ImageIcon },
          { id: 'storefront', label: 'Storefront Layouts',  icon: LayoutTemplate },
          { id: 'coupons',    label: 'Coupons',             icon: Ticket },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm tracking-wide transition-colors ${
              activeTab === tab.id 
                ? 'border-[var(--color-gold-primary)] text-[var(--color-gold-primary)] bg-[var(--color-gold-primary)]/5' 
                : 'border-transparent text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] hover:bg-[var(--color-admin-surface)]'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Areas */}
      <div className="bg-[var(--color-admin-surface)] rounded-2xl border border-[var(--color-admin-border)] min-h-[500px] p-6 relative">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-lg font-serif text-[var(--color-admin-text)]">Global Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)]">
                 <p className="text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider font-bold mb-2">Active Campaigns</p>
                 <p className="text-4xl font-serif text-[var(--color-gold-primary)]">{metrics.activeCampaigns}</p>
               </div>
               <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)]">
                 <p className="text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider font-bold mb-2">Active Offers</p>
                 <p className="text-4xl font-serif text-[var(--color-gold-primary)]">{metrics.activeOffers}</p>
               </div>
               <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)]">
                 <p className="text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider font-bold mb-2">Active Ads & Popups</p>
                 <p className="text-4xl font-serif text-[var(--color-gold-primary)]">{metrics.activeAds}</p>
               </div>
               <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)]">
                 <p className="text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider font-bold mb-2">Active Merchandising</p>
                 <p className="text-4xl font-serif text-[var(--color-gold-primary)]">{metrics.activeMerchandising}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
               <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)] flex flex-col justify-center items-center text-center h-48">
                 <p className="text-[var(--color-admin-text-muted)]">Use the tabs above to manage marketing entities.</p>
                 <div className="mt-4 flex gap-4">
                   <button onClick={() => setActiveTab('campaigns')} className="text-xs font-bold text-[var(--color-gold-primary)] uppercase tracking-wider underline">Go to Campaigns</button>
                   <button onClick={() => setActiveTab('ads')} className="text-xs font-bold text-[var(--color-gold-primary)] uppercase tracking-wider underline">Go to Ads</button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && <CampaignsTab />}
        {activeTab === 'offers' && <OffersTab />}
        {activeTab === 'ads' && <AdvertisementsTab />}
        {activeTab === 'storefront' && <MerchandisingTab />}
        {activeTab === 'coupons' && <CouponsTab />}

      </div>
    </div>
  );
}

