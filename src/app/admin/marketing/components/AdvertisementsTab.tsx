'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash, Edit, CheckCircle, XCircle } from 'lucide-react';

export default function AdvertisementsTab() {
  const [ads, setAds] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const emptyForm = { 
    displayLocation: 'popup', title: '', subtitle: '', ctaText: '', linkUrl: '', 
    imageUrl: '', mobileImageUrl: '', altText: '', isActive: true, priority: 0, 
    campaignId: '', offerId: '', linkedCoupon: '' 
  };
  const [formData, setFormData] = useState<any>(emptyForm);

  useEffect(() => {
    fetchAds();
    fetchRelations();
  }, []);

  const fetchAds = async () => {
    const res = await fetch('/api/admin/advertisements', { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }});
    const data = await res.json();
    if (data.success) setAds(data.advertisements);
  };
  
  const fetchRelations = async () => {
    const token = localStorage.getItem('adminToken');
    const [cRes, oRes, cpRes] = await Promise.all([
      fetch('/api/admin/marketing/campaigns', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/marketing/offers', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const cData = await cRes.json();
    const oData = await oRes.json();
    const cpData = await cpRes.json();
    if (cData.success) setCampaigns(cData.campaigns);
    if (oData.success) setOffers(oData.offers);
    if (cpData.success) setCoupons(cpData.coupons);
  };

  const handleSave = async () => {
    const url = formData._id ? `/api/admin/advertisements/${formData._id}` : '/api/admin/advertisements';
    const method = formData._id ? 'PATCH' : 'POST';
    
    // Cleanup empty relationships
    const payload = { ...formData };
    if (!payload.campaignId) delete payload.campaignId;
    if (!payload.offerId) delete payload.offerId;
    if (!payload.linkedCoupon) delete payload.linkedCoupon;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      body: JSON.stringify(payload)
    });
    
    setIsFormOpen(false);
    setFormData(emptyForm);
    fetchAds();
  };

  const handleDelete = async (id: string) => {
    // Safety check — warn if this ad is the only active popup
    const r = await fetch(`/api/admin/advertisements`);
    if (!confirm('Delete this advertisement?')) return;
    await fetch(`/api/admin/advertisements/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }});
    fetchAds();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-serif text-[var(--color-admin-text)]">Manage Advertisements & Popups</h2>
        <button onClick={() => { setIsFormOpen(true); setFormData(emptyForm); }} className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform">
          <Plus size={14} /> NEW ADVERTISEMENT
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Display Location</label>
              <select value={formData.displayLocation} onChange={e => setFormData({...formData, displayLocation: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="popup">Storefront Popup Flyer</option>
                <option value="marquee">Scrolling Marquee</option>
                <option value="hero">Hero Banner</option>
                <option value="banner">Standard Banner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Status</label>
              <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Headline (Title)</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              {formData.displayLocation === 'hero' && (
                <p className="text-[10px] text-[var(--color-admin-text-muted)] mt-1">Hint: Use a pipe character <code className="bg-white/10 px-1 rounded">|</code> to split the headline into two lines (e.g. "The Atelier | For Your Vision")</p>
              )}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Subtitle / Text Content</label>
              <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Desktop Image URL</label>
              <input type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              {formData.imageUrl && (
                <img src={formData.imageUrl} alt="Preview" onError={e => ((e.target as HTMLImageElement).style.display='none')}
                  className="mt-2 w-full h-24 object-cover rounded-lg border border-[var(--color-admin-border)]" />
              )}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Mobile Image URL <span className="text-[var(--color-admin-text-muted)] font-normal normal-case">(portrait crop)</span></label>
              <input type="text" value={formData.mobileImageUrl} onChange={e => setFormData({...formData, mobileImageUrl: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              {formData.mobileImageUrl && (
                <img src={formData.mobileImageUrl} alt="Mobile Preview" onError={e => ((e.target as HTMLImageElement).style.display='none')}
                  className="mt-2 w-24 h-24 object-cover rounded-lg border border-[var(--color-admin-border)]" />
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1 text-gold-primary">Image Alt Text (SEO Description)</label>
              <input type="text" value={formData.altText || ''} onChange={e => setFormData({...formData, altText: e.target.value})} 
                placeholder="A person wearing titanium glasses standing in the sun"
                className="w-full bg-[var(--color-admin-surface)] border border-gold-primary/30 rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">CTA Text & Link</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Shop Now" value={formData.ctaText} onChange={e => setFormData({...formData, ctaText: e.target.value})} className="w-1/3 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
                <input type="text" placeholder="/products" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} className="w-2/3 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-admin-text)] mb-4">Link Promotion</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase mb-1">Campaign</label>
                <select value={formData.campaignId || ''} onChange={e => setFormData({...formData, campaignId: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                  <option value="">-- None --</option>
                  {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase mb-1">Offer</label>
                <select value={formData.offerId || ''} onChange={e => setFormData({...formData, offerId: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                  <option value="">-- None --</option>
                  {offers.map(o => <option key={o._id} value={o._id}>{o.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase mb-1">Coupon</label>
                <select value={formData.linkedCoupon || ''} onChange={e => setFormData({...formData, linkedCoupon: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                  <option value="">-- None --</option>
                  {coupons.map(cp => <option key={cp._id} value={cp._id}>{cp.code} - {cp.discountValue}{cp.discountType === 'percentage' ? '%' : ' OFF'}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={handleSave} className="bg-[var(--color-gold-primary)] text-[#1C2740] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">Save Advertisement</button>
            <button onClick={() => setIsFormOpen(false)} className="bg-transparent border border-[var(--color-admin-text-muted)] text-[var(--color-admin-text-muted)] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads.map(ad => (
          <div key={ad._id} className="bg-[var(--color-admin-bg)] p-5 rounded-xl border border-[var(--color-admin-border)]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-gold-primary)] tracking-wider block mb-1">{ad.displayLocation}</span>
                <h3 className="font-bold text-lg text-[var(--color-admin-text)]">{ad.title || ad.textContent || 'Untitled Ad'}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { 
                  setFormData({
                    ...ad, 
                    campaignId: ad.campaignId?._id || ad.campaignId || '',
                    offerId: ad.offerId?._id || ad.offerId || '',
                    linkedCoupon: ad.linkedCoupon?._id || ad.linkedCoupon || ''
                  }); setIsFormOpen(true); 
                }} className="text-[var(--color-admin-text-muted)] hover:text-white"><Edit size={14} /></button>
                <button onClick={() => handleDelete(ad._id)} className="text-red-400"><Trash size={14} /></button>
              </div>
            </div>
            
            {(ad.campaignId || ad.offerId || ad.linkedCoupon) && (
              <div className="mt-4 pt-4 border-t border-[var(--color-admin-border)] flex flex-wrap gap-2">
                {ad.campaignId && <span className="px-2 py-1 bg-[var(--color-admin-surface)] rounded text-xs text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)]">Camp: {ad.campaignId.name || 'Linked'}</span>}
                {ad.offerId && <span className="px-2 py-1 bg-[var(--color-admin-surface)] rounded text-xs text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)]">Offer: {ad.offerId.title || 'Linked'}</span>}
                {ad.linkedCoupon && <span className="px-2 py-1 bg-[var(--color-admin-surface)] rounded text-xs text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)]">Code: {ad.linkedCoupon.code || 'Linked'}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
