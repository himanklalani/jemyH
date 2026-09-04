'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash, Edit, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ name: '', description: '', status: 'active', priority: 0, startDate: '', endDate: '' });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const res = await fetch('/api/admin/marketing/campaigns', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const data = await res.json();
    if (data.success) setCampaigns(data.campaigns);
  };

  const handleSave = async () => {
    const url = formData._id ? `/api/admin/marketing/campaigns/${formData._id}` : '/api/admin/marketing/campaigns';
    const method = formData._id ? 'PATCH' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}` 
      },
      body: JSON.stringify(formData)
    });
    
    setIsFormOpen(false);
    setFormData({ name: '', description: '', status: 'active', priority: 0, startDate: '', endDate: '' });
    fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    // Safety check: see if any active ads are linked to this campaign
    const token = localStorage.getItem('adminToken');
    const safeRes = await fetch(`/api/admin/marketing/safety-check/campaign/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const safeData = await safeRes.json();
    if (!safeData.safe) {
      alert(`Cannot delete: this campaign is linked to ${safeData.linkedCount} active ad(s):\n${safeData.linkedAds.map((a: any) => `• ${a.title || 'Untitled'} (${a.displayLocation})`).join('\n')}\n\nDeactivate or unlink those ads first.`);
      return;
    }
    if (!confirm('Delete this campaign?')) return;
    await fetch(`/api/admin/marketing/campaigns/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
    fetchCampaigns();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-serif text-[var(--color-admin-text)]">Master Campaigns</h2>
        <button onClick={() => { setIsFormOpen(true); setFormData({ name: '', description: '', status: 'active', priority: 0, startDate: '', endDate: '' }); }} className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform">
          <Plus size={14} /> NEW CAMPAIGN
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-[var(--color-admin-bg)] p-6 rounded-xl border border-[var(--color-admin-border)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Campaign Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]">
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Start Date</label>
              <input type="datetime-local" value={formData.startDate ? formData.startDate.substring(0,16) : ''} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">End Date</label>
              <input type="datetime-local" value={formData.endDate ? formData.endDate.substring(0,16) : ''} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-[var(--color-admin-text)]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-[var(--color-gold-primary)] text-[#1C2740] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">Save Campaign</button>
            <button onClick={() => setIsFormOpen(false)} className="bg-transparent border border-[var(--color-admin-text-muted)] text-[var(--color-admin-text-muted)] px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {campaigns.map(camp => (
          <div key={camp._id} className="bg-[var(--color-admin-bg)] p-5 rounded-xl border border-[var(--color-admin-border)] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-bold text-lg text-[var(--color-admin-text)]">{camp.name}</span>
                {camp.status === 'active' && <span className="flex items-center gap-1 text-[10px] uppercase bg-green-500/10 text-green-400 px-2 py-1 rounded font-bold"><CheckCircle size={10} /> Active</span>}
                {camp.status === 'scheduled' && <span className="flex items-center gap-1 text-[10px] uppercase bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold"><Clock size={10} /> Scheduled</span>}
                {camp.status === 'inactive' && <span className="flex items-center gap-1 text-[10px] uppercase bg-red-500/10 text-red-400 px-2 py-1 rounded font-bold"><XCircle size={10} /> Inactive</span>}
              </div>
              <p className="text-sm text-[var(--color-admin-text-muted)]">{camp.description || 'No description provided.'}</p>
              <p className="text-xs text-[var(--color-admin-text-muted)] mt-2 font-mono">
                {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'Always'} → {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'Forever'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFormData(camp); setIsFormOpen(true); }} className="p-2 hover:bg-[var(--color-admin-surface)] rounded text-[var(--color-admin-text-muted)] hover:text-white transition-colors">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(camp._id)} className="p-2 hover:bg-red-500/10 rounded text-red-400 transition-colors">
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
