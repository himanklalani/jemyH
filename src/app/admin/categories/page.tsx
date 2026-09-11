'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  Edit3, 
  CornerDownRight, 
  ShieldCheck, 
  Sparkles, 
  FolderTree, 
  X, 
  Check, 
  Eye, 
  EyeOff,
  Package
} from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  parentSlug?: string | null;
  isSystem?: boolean;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
}

const QUICK_SUGGESTIONS: Record<string, { name: string; description: string }[]> = {
  eyeglasses: [
    { name: 'Reading Glasses', description: 'Pre-magnified reading lenses for close-up work and reading.' },
    { name: 'Blue Light Blockers', description: 'Screen protection lenses tailored for digital device comfort.' },
    { name: 'Titanium Optical', description: 'Ultra-lightweight Japanese titanium architectural frames.' },
    { name: 'Petite & Narrow Fit', description: 'Precision proportioned frames for narrower face profiles.' },
  ],
  sunglasses: [
    { name: 'Polarized Series', description: 'High-contrast glare-reduction lenses for driving and water.' },
    { name: 'Aviator Silhouettes', description: 'Timeless teardrop and navigator metal silhouettes.' },
    { name: 'Vintage Tint Archive', description: 'Subtle amber, rose, and green gradient tinted lenses.' },
    { name: 'Bold Acetate', description: 'Thick-gauge sculptural acetate silhouettes.' },
  ],
  accessories: [
    { name: 'Leather Hard Cases', description: 'Handcrafted Italian full-grain leather protective cases.' },
    { name: 'Eyewear Chains & Cords', description: 'Solid brass and woven cords for secure, stylish wear.' },
    { name: 'Microfiber Polishing Cloths', description: 'High-density scratch-free optical cleaning cloths.' },
  ],
  addon: [
    { name: 'Anti-Fog Lens Sprays', description: 'Long-lasting anti-condensation lens coating spray.' },
    { name: 'Travel Protection Sleeves', description: 'Compact velvet-lined travel sleeves for portability.' },
  ],
  perfume: [
    { name: 'Eau de Parfum', description: 'Concentrated artisanal artisanal signature fragrances.' },
    { name: 'Travel Atomizers', description: 'Pocket-sized refillable luxury fragrance vessels.' },
  ],
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    displayOrder: 0,
    isActive: true,
  });

  const router = useRouter();

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('jemy_token');
    if (!token) return router.push('/login');
    if (!localStorage.getItem('adminToken')) {
      localStorage.setItem('adminToken', token);
    }

    try {
      const res = await fetch(`/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        showNotification('error', data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Network error fetching taxonomy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Separate Root Categories vs Subcategories
  const { rootCategories, subcategoriesByParent } = useMemo(() => {
    const roots: CategoryItem[] = [];
    const subMap: Record<string, CategoryItem[]> = {};

    categories.forEach((cat) => {
      if (!cat.parentId && !cat.parentSlug) {
        roots.push(cat);
      } else {
        const parentKey = cat.parentSlug || cat.parentId || 'other';
        if (!subMap[parentKey]) subMap[parentKey] = [];
        subMap[parentKey].push(cat);
      }
    });

    // Also associate subcategories whose parentId matches a root's _id
    roots.forEach((root) => {
      const byIdChildren = categories.filter((c) => c.parentId === root._id && !subMap[root.slug]?.includes(c));
      if (byIdChildren.length > 0) {
        if (!subMap[root.slug]) subMap[root.slug] = [];
        subMap[root.slug].push(...byIdChildren);
      }
    });

    roots.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return { rootCategories: roots, subcategoriesByParent: subMap };
  }, [categories]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = categories.length;
    const coreCount = categories.filter((c) => c.isSystem).length;
    const subCount = categories.filter((c) => c.parentId || c.parentSlug).length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
    return { total, coreCount, subCount, totalProducts };
  }, [categories]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const openCreateModal = (parentCategory?: CategoryItem) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: parentCategory ? parentCategory._id : '',
      displayOrder: 0,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parentId: cat.parentId || '',
      displayOrder: cat.displayOrder || 0,
      isActive: cat.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleApplySuggestion = (parentCat: CategoryItem, suggestion: { name: string; description: string }) => {
    setEditingCategory(null);
    setFormData({
      name: suggestion.name,
      slug: slugify(suggestion.name),
      description: suggestion.description,
      parentId: parentCat._id,
      displayOrder: (subcategoriesByParent[parentCat.slug]?.length || 0) + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('error', 'Category name is required');
      return;
    }

    setActionLoading('save');
    const token = localStorage.getItem('adminToken');

    const payload = {
      ...formData,
      slug: formData.slug ? slugify(formData.slug) : slugify(formData.name),
      parentId: formData.parentId ? formData.parentId : null,
    };

    try {
      let res;
      if (editingCategory) {
        res = await fetch(`/api/admin/categories/${editingCategory._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setModalOpen(false);
        showNotification('success', editingCategory ? 'Category updated successfully' : 'Category created successfully');
        fetchCategories();
      } else {
        showNotification('error', data.message || 'Operation failed');
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Network error while saving category');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (cat.isSystem) {
      showNotification('error', 'Cannot delete core system categories.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${cat.name}"? Any subcategories under it will be detached.`)) {
      return;
    }

    setActionLoading(cat._id);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/categories/${cat._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `"${cat.name}" removed from taxonomy`);
        fetchCategories();
      } else {
        showNotification('error', data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Network error while deleting category');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (cat: CategoryItem) => {
    setActionLoading(`toggle-${cat._id}`);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/categories/${cat._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `${cat.name} is now ${!cat.isActive ? 'active' : 'hidden'}`);
        fetchCategories();
      } else {
        showNotification('error', data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin" />
        <p className="text-xs uppercase tracking-widest text-[var(--color-admin-text-muted)] font-mono">Synchronizing Taxonomy Hierarchy...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-36">
      
      {/* Notifications */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#0d2818] border border-emerald-500/40 text-emerald-300 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top-4">
          <Check size={18} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#351010] border border-red-500/40 text-red-300 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top-4">
          <X size={18} className="text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-admin-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[var(--color-gold-primary)]/10 text-[var(--color-gold-primary)] border border-[var(--color-gold-primary)]/30 font-semibold">
              Taxonomy Architecture
            </span>
          </div>
          <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight">Category & Subcategory Hierarchy</h1>
          <p className="text-[var(--color-admin-text-muted)] text-sm mt-1 max-w-2xl">
            Manage your store&apos;s core classifications, create nested collections, and organize eyewear into intuitive customer browsing paths.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 bg-[var(--color-admin-surface)] hover:bg-[var(--color-admin-surface-hover)] border border-[var(--color-admin-border)] text-[var(--color-admin-text)] px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all hover:scale-[1.02]"
          >
            <Plus size={15} />
            <span>New Root Category</span>
          </button>
          <button
            onClick={() => openCreateModal(rootCategories[0])}
            className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all hover:scale-105 shadow-lg shadow-[var(--color-gold-primary)]/10"
          >
            <FolderTree size={16} />
            <span>+ Add Subcategory</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--color-admin-surface)] p-5 rounded-xl border border-[var(--color-admin-border)] space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Total Classifications</span>
          <p className="text-2xl font-serif text-[var(--color-admin-text)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--color-admin-surface)] p-5 rounded-xl border border-[var(--color-admin-border)] space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Core Categories</span>
          <p className="text-2xl font-serif text-[var(--color-gold-primary)]">{stats.coreCount} <span className="text-xs text-[var(--color-admin-text-muted)] font-sans">Hardcoded</span></p>
        </div>
        <div className="bg-[var(--color-admin-surface)] p-5 rounded-xl border border-[var(--color-admin-border)] space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Nested Subcategories</span>
          <p className="text-2xl font-serif text-emerald-400">{stats.subCount}</p>
        </div>
        <div className="bg-[var(--color-admin-surface)] p-5 rounded-xl border border-[var(--color-admin-border)] space-y-1">
          <span className="text-[11px] font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Catalog Attachments</span>
          <p className="text-2xl font-serif text-[var(--color-admin-text)] flex items-center gap-2">
            <Package size={20} className="text-[var(--color-gold-primary)]" />
            <span>{stats.totalProducts}</span>
          </p>
        </div>
      </div>

      {/* Categories Hierarchy List */}
      <div className="space-y-6">
        {rootCategories.map((root) => {
          const subcategories = subcategoriesByParent[root.slug] || [];
          const suggestions = QUICK_SUGGESTIONS[root.slug] || [];
          const isCore = !!root.isSystem;

          return (
            <div 
              key={root._id}
              className="bg-[var(--color-admin-surface)] rounded-2xl border border-[var(--color-admin-border)] overflow-hidden shadow-sm transition-all hover:border-[var(--color-admin-border)]/80"
            >
              {/* Root Category Header Card */}
              <div className="p-6 border-b border-[var(--color-admin-border)]/60 bg-[var(--color-admin-surface)]/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-serif font-bold text-[var(--color-admin-text)] tracking-tight">{root.name}</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--color-admin-bg)] text-[var(--color-admin-text-muted)] border border-[var(--color-admin-border)]">
                        /{root.slug}
                      </span>
                      {isCore ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[var(--color-gold-primary)]/15 text-[var(--color-gold-primary)] border border-[var(--color-gold-primary)]/30">
                          <ShieldCheck size={12} /> System Core
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          Custom Root
                        </span>
                      )}

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${root.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-700 text-zinc-400'}`}>
                        {root.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    {root.description && (
                      <p className="text-xs text-[var(--color-admin-text-muted)] max-w-2xl leading-relaxed">
                        {root.description}
                      </p>
                    )}
                  </div>

                  {/* Actions on Root Category */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => openCreateModal(root)}
                      className="flex items-center gap-1.5 bg-[var(--color-gold-primary)]/10 hover:bg-[var(--color-gold-primary)]/20 text-[var(--color-gold-primary)] border border-[var(--color-gold-primary)]/40 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors"
                      title={`Add a new subcategory under ${root.name}`}
                    >
                      <Plus size={14} />
                      <span>Add Subcategory</span>
                    </button>

                    <button
                      onClick={() => openEditModal(root)}
                      className="p-2 text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg transition-colors"
                      title="Edit Category Details"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      onClick={() => handleToggleActive(root)}
                      disabled={actionLoading === `toggle-${root._id}`}
                      className="p-2 text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg transition-colors"
                      title={root.isActive ? 'Hide category from storefront' : 'Show category on storefront'}
                    >
                      {root.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    {!isCore && (
                      <button
                        onClick={() => handleDelete(root)}
                        disabled={actionLoading === root._id}
                        className="p-2 text-[var(--color-admin-text-muted)] hover:text-red-400 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] hover:border-red-400/40 rounded-lg transition-colors"
                        title="Delete Custom Category"
                      >
                        {actionLoading === root._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subcategories Body */}
              <div className="p-6 space-y-4">
                {subcategories.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--color-admin-text-muted)] px-3 pb-1">
                      <span className="flex items-center gap-2">
                        <CornerDownRight size={13} className="text-[var(--color-gold-primary)]" />
                        Subcategories &amp; Specialized Collections ({subcategories.length})
                      </span>
                      <span>Order</span>
                    </div>

                    <div className="divide-y divide-[var(--color-admin-border)]/40 rounded-xl bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] overflow-hidden">
                      {subcategories.map((sub) => (
                        <div 
                          key={sub._id}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-admin-surface)]/80 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <CornerDownRight size={16} className="text-[var(--color-gold-primary)] shrink-0 mt-1 opacity-70" />
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-[var(--color-admin-text)] truncate">{sub.name}</span>
                                <span className="font-mono text-xs text-[var(--color-admin-text-muted)] px-1.5 py-0.2 rounded bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)]">
                                  /{sub.slug}
                                </span>
                                {typeof sub.productCount === 'number' && sub.productCount > 0 ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {sub.productCount} {sub.productCount === 1 ? 'product' : 'products'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-[var(--color-admin-text-muted)]">
                                    0 products
                                  </span>
                                )}
                              </div>
                              {sub.description && (
                                <p className="text-xs text-[var(--color-admin-text-muted)] line-clamp-1">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-[var(--color-admin-text-muted)] font-mono">
                              #{sub.displayOrder ?? 0}
                            </span>
                            <button
                              onClick={() => openEditModal(sub)}
                              className="p-1.5 text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] hover:bg-[var(--color-admin-surface)] rounded transition-colors"
                              title="Edit Subcategory"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(sub)}
                              disabled={actionLoading === sub._id}
                              className="p-1.5 text-[var(--color-admin-text-muted)] hover:text-red-400 hover:bg-[var(--color-admin-surface)] rounded transition-colors"
                              title="Delete Subcategory"
                            >
                              {actionLoading === sub._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[var(--color-admin-bg)]/60 border border-dashed border-[var(--color-admin-border)] rounded-xl p-5 text-center space-y-3">
                    <p className="text-xs text-[var(--color-admin-text-muted)]">
                      No subcategories configured yet under <strong className="text-[var(--color-admin-text)]">{root.name}</strong>.
                    </p>
                    {suggestions.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold-primary)] flex items-center justify-center gap-1 mb-2">
                          <Sparkles size={12} /> 1-Click Recommended Subcategories:
                        </span>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {suggestions.map((sug) => (
                            <button
                              key={sug.name}
                              onClick={() => handleApplySuggestion(root, sug)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] hover:border-[var(--color-gold-primary)]/60 hover:text-[var(--color-gold-primary)] text-[var(--color-admin-text)] font-medium transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <Plus size={12} className="text-[var(--color-gold-primary)]" />
                              <span>{sug.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {rootCategories.length === 0 && (
          <div className="text-center py-16 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl space-y-4">
            <Layers size={48} className="mx-auto text-[var(--color-admin-text-muted)] opacity-30" />
            <h3 className="text-lg font-serif text-[var(--color-gold-primary)]">No Categories Found</h3>
            <p className="text-xs text-[var(--color-admin-text-muted)] max-w-sm mx-auto">
              Click below to initialize the standard core categories or create a custom root category.
            </p>
            <button
              onClick={() => openCreateModal()}
              className="bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-lg hover:scale-105 transition-transform"
            >
              + Create Category
            </button>
          </div>
        )}
      </div>

      {/* Slide-over / Modal for Category & Subcategory Creation / Editing */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-[var(--color-admin-border)] pb-4">
              <div>
                <h3 className="text-xl font-serif text-[var(--color-gold-primary)]">
                  {editingCategory ? `Edit: ${editingCategory.name}` : formData.parentId ? 'New Subcategory' : 'New Root Category'}
                </h3>
                <p className="text-xs text-[var(--color-admin-text-muted)] mt-0.5">
                  {formData.parentId ? 'Configuring nested collection within a parent category' : 'Creating a primary catalog classification'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Parent Category Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-admin-text-muted)] mb-1.5">
                  Parent Category (Hierarchy Level)
                </label>
                <select
                  value={formData.parentId}
                  disabled={!!(editingCategory && editingCategory.isSystem)}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)] disabled:opacity-50"
                >
                  <option value="">[None — Top-level Root Category]</option>
                  <optgroup label="Select Parent Category">
                    {rootCategories
                      .filter((r) => !editingCategory || r._id !== editingCategory._id)
                      .map((r) => (
                        <option key={r._id} value={r._id}>
                          ↳ Subcategory under: {r.name} ({r.slug})
                        </option>
                      ))}
                  </optgroup>
                </select>
                {editingCategory?.isSystem && (
                  <p className="text-[10px] text-[var(--color-admin-text-muted)] mt-1">
                    * Core system categories are permanently top-level roots.
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-admin-text-muted)] mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    if (!editingCategory || !editingCategory.slug) {
                      setFormData({ ...formData, name: newName, slug: slugify(newName) });
                    } else {
                      setFormData({ ...formData, name: newName });
                    }
                  }}
                  placeholder={formData.parentId ? 'e.g. Reading Glasses' : 'e.g. Optical Eyewear'}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-admin-text-muted)] mb-1.5">
                  Slug / URL Identifier
                </label>
                <input
                  type="text"
                  required
                  disabled={!!(editingCategory && editingCategory.isSystem)}
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                  placeholder="e.g. reading-glasses"
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)] font-mono disabled:opacity-50"
                />
                {editingCategory?.isSystem && (
                  <p className="text-[10px] text-[var(--color-admin-text-muted)] mt-1">
                    * System category slugs are locked to maintain optical discriminator compatibility.
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-admin-text-muted)] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief customer-facing summary of this category or collection..."
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                />
              </div>

              {/* Display Order & Active status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-admin-text-muted)] mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 accent-[var(--color-gold-primary)]"
                    />
                    <span className="text-xs text-[var(--color-admin-text)] font-medium">Active on Storefront</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-admin-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs uppercase tracking-wider font-semibold text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'save'}
                  className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 shadow-lg shadow-[var(--color-gold-primary)]/15"
                >
                  {actionLoading === 'save' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
