'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash, Edit, Copy, Check, Tag, X } from 'lucide-react';

const emptyForm = {
  code: '', discountType: 'percentage', discountValue: 0,
  isActive: true, expiryDate: '', usageLimit: '', perUserLimit: 1,
  minOrderValueUS: 0, minOrderValueIN: 0
};

export default function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const tok = () => localStorage.getItem('adminToken') || '';

  const fetchCoupons = async () => {
    const r = await fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${tok()}` } });
    const d = await r.json();
    if (d.success) setCoupons(d.coupons);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const url = formData._id ? `/api/admin/coupons/${formData._id}` : '/api/admin/coupons';
    const payload = { ...formData };
    if (!payload.usageLimit) delete payload.usageLimit;
    await fetch(url, {
      method: formData._id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setIsFormOpen(false);
    setFormData(emptyForm);
    fetchCoupons();
  };

  const handleDelete = async (id: string, code: string) => {
    // Safety check: see if any active ads use this coupon
    const safeRes = await fetch(`/api/admin/marketing/safety-check/coupon/${id}`, {
      headers: { Authorization: `Bearer ${tok()}` }
    });
    const safeData = await safeRes.json();
    if (!safeData.safe) {
      alert(`Cannot delete: coupon "${code}" is linked to ${safeData.linkedCount} active ad(s):\n${safeData.linkedAds.map((a: any) => `• ${a.title || 'Untitled'} (${a.displayLocation})`).join('\n')}\n\nUnlink the coupon from those ads first.`);
      return;
    }
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
    setCoupons(prev => prev.filter(c => c._id !== id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const openEdit = (c: any) => {
    setFormData({
      ...c,
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-serif text-[var(--color-admin-text)]">Discount Coupons</h2>
        <button onClick={() => { setFormData(emptyForm); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform">
          <Plus size={14} /> NEW COUPON
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-[var(--color-admin-bg)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-admin-border)]">
            <h3 className="font-serif text-[var(--color-admin-text)]">{formData._id ? 'Edit Coupon' : 'New Coupon'}</h3>
            <button onClick={() => setIsFormOpen(false)}><X size={18} className="text-[var(--color-admin-text-muted)]" /></button>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Code <span className="text-red-400">*</span></label>
              <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20" className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)] font-mono uppercase" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Discount Type</label>
              <select value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Discount Value <span className="text-red-400">*</span></label>
              <input type="number" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: +e.target.value })}
                className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Expiry Date <span className="text-red-400">*</span></label>
              <input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Usage Limit</label>
              <input type="number" value={formData.usageLimit || ''} onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="Unlimited" className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Per User Limit</label>
              <input type="number" value={formData.perUserLimit} onChange={e => setFormData({ ...formData, perUserLimit: +e.target.value })}
                className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Min Order (US $)</label>
              <input type="number" value={formData.minOrderValueUS} onChange={e => setFormData({ ...formData, minOrderValueUS: +e.target.value })}
                className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Min Order (IN ₹)</label>
              <input type="number" value={formData.minOrderValueIN} onChange={e => setFormData({ ...formData, minOrderValueIN: +e.target.value })}
                className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Status</label>
              <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || !formData.code || !formData.expiryDate}
                className="bg-[var(--color-gold-primary)] text-[#1C2740] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Coupon'}
              </button>
              <button onClick={() => setIsFormOpen(false)}
                className="border border-[var(--color-admin-text-muted)] text-[var(--color-admin-text-muted)] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {coupons.length === 0 && (
          <p className="col-span-3 text-center py-16 text-[var(--color-admin-text-muted)]">No coupons yet.</p>
        )}
        {coupons.map(c => {
          const isExpired = new Date(c.expiryDate) < new Date();
          return (
            <div key={c._id} className={`bg-[var(--color-admin-bg)] p-5 rounded-xl border ${c.isActive && !isExpired ? 'border-[var(--color-admin-border)] border-l-4 border-l-green-400' : 'border-[var(--color-admin-border)] border-l-4 border-l-red-500/40'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-[var(--color-gold-primary)]" />
                  <span className="font-mono text-lg font-bold text-[var(--color-admin-text)]">{c.code}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyCode(c.code)} className="text-[var(--color-admin-text-muted)] hover:text-white">
                    {copied === c.code ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                  <button onClick={() => openEdit(c)} className="text-[var(--color-admin-text-muted)] hover:text-white"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(c._id, c.code)} className="text-red-400"><Trash size={14} /></button>
                </div>
              </div>

              <p className="text-2xl font-bold text-[var(--color-gold-primary)] mb-3">
                {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `FLAT ${c.discountValue} OFF`}
              </p>

              <div className="space-y-1 text-xs text-[var(--color-admin-text-muted)]">
                <p>Expires: {new Date(c.expiryDate).toLocaleDateString()}{isExpired ? ' (Expired)' : ''}</p>
                <p>Used: {c.usageCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</p>
                {(c.minOrderValueUS > 0 || c.minOrderValueIN > 0) && (
                  <p>Min: ${c.minOrderValueUS} / ₹{c.minOrderValueIN}</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--color-admin-border)]">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${c.isActive && !isExpired ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {isExpired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
