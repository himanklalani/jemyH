'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash, Edit, CheckCircle, XCircle } from 'lucide-react';

export default function OffersTab() {
  const [offers, setOffers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const emptyForm = { title: '', description: '', discountType: 'percentage', discountValue: 0, isActive: true, campaignId: '' };
  const [formData, setFormData] = useState<any>(emptyForm);

  useEffect(() => {
    fetchOffers();
    fetchCampaigns();
  }, []);

  const fetchOffers = async () => {
    const res = await fetch('/api/admin/marketing/offers', { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }});
    const data = await res.json();
    if (data.success) setOffers(data.offers);
  };
  
  const fetchCampaigns = async () => {
    const res = await fetch('/api/admin/marketing/campaigns', { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }});
    const data = await res.json();
    if (data.success) setCampaigns(data.campaigns);
  };

  const handleSave = async () => {
    const url = formData._id ? `/api/admin/marketing/offers/${formData._id}` : '/api/admin/marketing/offers';
    const method = formData._id ? 'PATCH' : 'POST';
    
    // Cleanup empty relationships
    const payload = { ...formData };
    if (!payload.campaignId) delete payload.campaignId;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      body: JSON.stringify(payload)
    });
    
    setIsFormOpen(false);
    setFormData(emptyForm);
    fetchOffers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    await fetch(`/api/admin/marketing/offers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }});
    fetchOffers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-serif text-[var(--color-admin-text)]">Manage Offers</h2>
        <button onClick={() => { setIsFormOpen(true); setFormData(emptyForm); }} className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform">
          <Plus size={14} /> NEW OFFER
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Offer Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Status</label>
              <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Discount Type</label>
              <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($/₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Discount Value</label>
              <input type="number" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Link to Campaign (Optional)</label>
              <select value={formData.campaignId || ''} onChange={e => setFormData({...formData, campaignId: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="">-- No Campaign --</option>
                {campaigns.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-[var(--color-gold-primary)] text-[#1C2740] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">Save Offer</button>
            <button onClick={() => setIsFormOpen(false)} className="bg-transparent border border-[var(--color-admin-text-muted)] text-[var(--color-admin-text-muted)] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map(offer => (
          <div key={offer._id} className="bg-[var(--color-admin-bg)] p-5 rounded-xl border border-[var(--color-admin-border)]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-[var(--color-admin-text)]">{offer.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => { setFormData(offer); setIsFormOpen(true); }} className="text-[var(--color-admin-text-muted)] hover:text-white"><Edit size={14} /></button>
                <button onClick={() => handleDelete(offer._id)} className="text-red-400"><Trash size={14} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-sm font-bold bg-[var(--color-admin-surface)] px-2 py-1 rounded text-[var(--color-gold-primary)]">
                {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `FLAT ${offer.discountValue} OFF`}
              </span>
              {offer.isActive ? (
                <span className="text-[10px] uppercase bg-green-500/10 text-green-400 px-2 py-1 rounded font-bold">Active</span>
              ) : (
                <span className="text-[10px] uppercase bg-red-500/10 text-red-400 px-2 py-1 rounded font-bold">Inactive</span>
              )}
            </div>
            {offer.campaignId && campaigns.find(c => c._id === offer.campaignId) && (
              <p className="text-xs text-[var(--color-admin-text-muted)]">Campaign: {campaigns.find(c => c._id === offer.campaignId)?.name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
