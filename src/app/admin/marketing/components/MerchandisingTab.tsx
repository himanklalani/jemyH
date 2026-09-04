'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash, Edit, BookOpen, X } from 'lucide-react';

const emptyForm = {
  type: 'editorial', title: '', subtitle: '',
  images: '', altText: '', ctaText: '', linkUrl: '', priority: 0, isActive: true, campaignId: ''
};

export default function MerchandisingTab() {
  const [items, setItems] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const tok = () => localStorage.getItem('adminToken') || '';

  useEffect(() => {
    fetch('/api/admin/marketing/merchandising?type=editorial', { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).then(d => { if (d.success) setItems(d.items); });
    fetch('/api/admin/marketing/campaigns', { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).then(d => { if (d.success) setCampaigns(d.campaigns); });
  }, []);

  const openEdit = (item: any) =>
    setFormData({ ...item, images: Array.isArray(item.images) ? item.images.join(', ') : '' });

  const handleSave = async () => {
    setSaving(true);
    const url = formData._id ? `/api/admin/marketing/merchandising/${formData._id}` : '/api/admin/marketing/merchandising';
    const payload = {
      ...formData,
      type: 'editorial',
      images: (formData.images as string).split(',').map((s: string) => s.trim()).filter(Boolean),
    };
    if (!payload.campaignId) delete payload.campaignId;
    await fetch(url, {
      method: formData._id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setIsFormOpen(false);
    const r = await fetch('/api/admin/marketing/merchandising?type=editorial', { headers: { Authorization: `Bearer ${tok()}` } });
    const d = await r.json();
    if (d.success) setItems(d.items);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    await fetch(`/api/admin/marketing/merchandising/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
    setItems(prev => prev.filter(i => i._id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-lg font-serif text-[var(--color-admin-text)]">Editorial Stack Manager</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={() => { setFormData(emptyForm); setIsFormOpen(true); }}
            className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform">
            <Plus size={14} /> NEW SLIDE
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-[var(--color-admin-bg)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-admin-border)]">
            <h3 className="font-serif text-[var(--color-admin-text)]">{formData._id ? 'Edit Slide' : 'New Slide'}</h3>
            <button onClick={() => setIsFormOpen(false)}><X size={18} className="text-[var(--color-admin-text-muted)]" /></button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Main Caption (H2) <span className="text-red-400">*</span></label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Top Label (e.g. Vol 1)</label>
                <input type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Image URL (1 required)</label>
                <input type="text" value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://cdn.example.com/slide-bg.jpg"
                  className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)] font-mono text-xs" />
                {formData.images && (
                  <div className="mt-2">
                    <img src={(formData.images as string).split(',')[0]?.trim()} alt="preview" onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                      className="w-32 h-20 object-cover rounded-lg border border-[var(--color-admin-border)]" />
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1 text-gold-primary">Image Alt Text (SEO Description) <span className="text-red-400">*</span></label>
                <input type="text" value={formData.altText || ''} onChange={e => setFormData({ ...formData, altText: e.target.value })}
                  placeholder="A person wearing titanium glasses standing in the sun" required
                  className="w-full bg-[var(--color-admin-surface)] border border-gold-primary/30 rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Button Text</label>
                <input type="text" placeholder="Discover" value={formData.ctaText || ''} onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                  className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Link URL</label>
                <input type="text" placeholder="/products" value={formData.linkUrl || ''} onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Priority (Stack Order)</label>
                <input type="number" value={formData.priority} onChange={e => setFormData({ ...formData, priority: +e.target.value })}
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
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Link to Campaign</label>
                <select value={formData.campaignId || ''} onChange={e => setFormData({ ...formData, campaignId: e.target.value })}
                  className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                  <option value="">-- No Campaign --</option>
                  {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || !formData.title || !formData.altText}
                className="bg-[var(--color-gold-primary)] text-[#1C2740] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Slide'}
              </button>
              <button onClick={() => setIsFormOpen(false)}
                className="border border-[var(--color-admin-text-muted)] text-[var(--color-admin-text-muted)] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 && (
          <p className="col-span-2 text-center py-16 text-[var(--color-admin-text-muted)]">No slides yet. Create one above.</p>
        )}
        {items.map(item => {
          return (
            <div key={item._id} className="bg-[var(--color-admin-bg)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
              {item.images?.length > 0 && (
                <div className="flex h-32 overflow-hidden bg-black relative">
                  <img src={item.images[0]} alt={item.altText} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                     <span className="text-[10px] uppercase font-bold tracking-wider text-gold-primary mb-1">{item.subtitle}</span>
                     <h3 className="font-bold text-white text-lg leading-tight">{item.title}</h3>
                  </div>
                </div>
              )}
              <div className="p-4 bg-[var(--color-admin-surface)]">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-[var(--color-admin-text-muted)]">
                    <span className="font-bold text-[var(--color-admin-text)]">Button:</span> {item.ctaText || 'Discover'} &rarr; {item.linkUrl || '/products'}
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0 items-center">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${item.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {item.isActive ? 'On' : 'Off'}
                    </span>
                    <button onClick={() => { openEdit(item); setIsFormOpen(true); }} className="text-[var(--color-admin-text-muted)] hover:text-white"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(item._id)} className="text-red-400"><Trash size={14} /></button>
                  </div>
                </div>
                {item.altText && <p className="text-[10px] text-[var(--color-admin-text-muted)] mt-2 italic">Alt: {item.altText}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
