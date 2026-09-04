'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Settings, Mail, RefreshCw, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const handleExport = async (type: 'products' | 'newsletters') => {
    setExportLoading(type);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/exports?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jemy_${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert('Failed to generate export.');
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">System Settings</h1>
        <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage global configurations and data portability.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Data Portability (CSV Exports) */}
        <div className="space-y-6">
          <div className="bg-[var(--color-admin-surface)] rounded-2xl border border-[var(--color-admin-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] flex items-center gap-3">
              <FileSpreadsheet className="text-[var(--color-gold-primary)]" size={20} />
              <h2 className="font-bold text-[var(--color-admin-text)] uppercase tracking-wider text-sm">Data Exports (CSV)</h2>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex justify-between items-center bg-[var(--color-admin-bg)] p-4 rounded-xl border border-[var(--color-admin-border)]">
                <div>
                  <h3 className="font-bold text-[var(--color-admin-text)] flex items-center gap-2"><Package size={16}/> Inventory Catalog</h3>
                  <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Export full product catalog with pricing and stock for auditing.</p>
                </div>
                <button 
                  onClick={() => handleExport('products')}
                  disabled={exportLoading === 'products'}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] text-[var(--color-admin-text)] rounded hover:text-[var(--color-gold-primary)] hover:border-[var(--color-gold-primary)] transition-colors text-sm font-semibold"
                >
                  {exportLoading === 'products' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  EXPORT
                </button>
              </div>

              <div className="flex justify-between items-center bg-[var(--color-admin-bg)] p-4 rounded-xl border border-[var(--color-admin-border)]">
                <div>
                  <h3 className="font-bold text-[var(--color-admin-text)] flex items-center gap-2"><Mail size={16}/> Newsletter Subscribers</h3>
                  <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Export opted-in email addresses for Brevo/Mailchimp campaigns.</p>
                </div>
                <button 
                  onClick={() => handleExport('newsletters')}
                  disabled={exportLoading === 'newsletters'}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] text-[var(--color-admin-text)] rounded hover:text-[var(--color-gold-primary)] hover:border-[var(--color-gold-primary)] transition-colors text-sm font-semibold"
                >
                  {exportLoading === 'newsletters' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  EXPORT
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Global Configs */}
        <div className="space-y-6">
          <div className="bg-[var(--color-admin-surface)] rounded-2xl border border-[var(--color-admin-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] flex items-center gap-3">
              <Settings className="text-[var(--color-admin-text-muted)]" size={20} />
              <h2 className="font-bold text-[var(--color-admin-text)] uppercase tracking-wider text-sm">Store Configurations</h2>
            </div>
            
            <form className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase">Free Shipping Threshold (USD)</label>
                <input type="number" defaultValue={100} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase">Free Shipping Threshold (INR)</label>
                <input type="number" defaultValue={5000} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
              <div className="pt-4 border-t border-[var(--color-admin-border)]">
                <button type="button" className="flex items-center gap-2 bg-[var(--color-admin-text-muted)]/20 text-[var(--color-admin-text)] px-6 py-3 rounded-lg font-bold text-sm hover:bg-[var(--color-admin-text-muted)]/30 transition-colors">
                  <RefreshCw size={16} /> SAVE CONFIG
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

// Re-importing Package since it was used in JSX but not imported at the top
import { Package } from 'lucide-react';
