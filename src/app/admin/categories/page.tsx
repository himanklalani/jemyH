'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Plus, Trash2, Loader2, Save } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '', displayOrder: 0 });
  const router = useRouter();

  const fetchCategories = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const res = await fetch(`/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCat.name) return alert('Name is required');
    setActionLoading('create');
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/categories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newCat)
      });
      const data = await res.json();
      if (res.ok) {
        setNewCat({ name: '', description: '', displayOrder: 0 });
        setIsCreating(false);
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category completely?')) return;
    setActionLoading(id);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin mx-auto mt-20"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Category Taxonomy</h1>
          <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage product categories and catalog groupings.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded hover:bg-white transition-colors"
        >
          {isCreating ? 'Cancel' : <><Plus size={16} /> New Category</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-[var(--color-admin-surface)] p-6 rounded-xl border border-[var(--color-admin-border)] space-y-4 mb-8">
          <h3 className="text-[var(--color-gold-primary)] font-serif text-xl">Create New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-2">Category Name</label>
              <input 
                type="text" 
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded px-4 py-2 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                placeholder="e.g., Titanium Frames"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-admin-text-muted)] mb-2">Display Order</label>
              <input 
                type="number" 
                value={newCat.displayOrder}
                onChange={(e) => setNewCat({ ...newCat, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded px-4 py-2 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
              />
            </div>
          </div>
          <button 
            onClick={handleCreate}
            disabled={actionLoading === 'create'}
            className="flex items-center gap-2 bg-[var(--color-admin-text)] text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded hover:bg-[var(--color-gold-primary)] transition-colors"
          >
            {actionLoading === 'create' ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Category</>}
          </button>
        </div>
      )}

      <div className="bg-[var(--color-admin-surface)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
             <Layers size={48} className="text-[var(--color-admin-text-muted)] opacity-20 mb-4" />
             <p className="text-[var(--color-admin-text-muted)] text-sm mt-2">No categories defined yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-admin-bg)] border-b border-[var(--color-admin-border)]">
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Name & Slug</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Order</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b border-[var(--color-admin-border)] last:border-0 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-[var(--color-admin-text)]">{cat.name}</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] font-mono">{cat.slug}</p>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-admin-text-muted)]">{cat.displayOrder}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(cat._id)}
                      disabled={actionLoading === cat._id}
                      className="inline-flex items-center justify-center w-8 h-8 bg-[var(--color-admin-bg)] text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)] rounded hover:text-red-400 hover:border-red-400 transition-colors"
                    >
                      {actionLoading === cat._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
