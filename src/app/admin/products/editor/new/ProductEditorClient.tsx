'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Info, Plus, Trash2, Palette, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function ProductEditorClient({ productId }: { productId: string }) {
  const router = useRouter();
  const isNew = productId === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<{ name: string; slug: string }[]>([]);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    slug: '',
    description: '',
    category: 'eyeglasses',
    subcategory: '',
    stock: 0,
    regionAvailability: 'BOTH',
    pricing: { US: { amount: 0, currency: 'USD' }, IN: { amount: 0, currency: 'INR' } },
    images: [''],
    colorVariants: [],
    requiresPrescription: true,
    isPublished: true,
    isAddon: false,
    sku: '',
    brand: 'Jemy',
    tags: [],
    features: [],
    // Eyewear Specific
    frameMeasurements: { lensWidth: 0, bridgeWidth: 0, templeLength: 0 },
    frameMaterial: 'Acetate',
    frameShape: 'round',
    frameColor: '',
    frameSize: 'M',
    // Eyeglasses Specific
    lensTypes: ['single-vision'],
    rxPowerRange: { minSphere: -6.0, maxSphere: 4.0, minCylinder: -2.0, maxCylinder: 0 },
    blueLightFilter: false,
    antiGlare: false,
    scratchCoating: false,
    // Sunglasses Specific
    isPolarized: false,
    uvRating: 'UV400',
    lensTint: 'Gray',
    isPhotochromic: false,
  });

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const addColorVariant = (preset?: { color: string; hex: string }) => {
    setFormData((prev: any) => ({
      ...prev,
      colorVariants: [
        ...(prev.colorVariants || []),
        { color: preset?.color || '', hex: preset?.hex || '#1A1F2C', imageUrl: '' }
      ]
    }));
  };

  const updateColorVariant = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = [...(prev.colorVariants || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, colorVariants: updated };
    });
  };

  const removeColorVariant = (index: number) => {
    setFormData((prev: any) => {
      const updated = [...(prev.colorVariants || [])];
      updated.splice(index, 1);
      return { ...prev, colorVariants: updated };
    });
  };

  useEffect(() => {
    // Fetch custom categories for dynamic options
    const fetchCustomCategories = async () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('jemy_token');
      try {
        const res = await fetch('/api/admin/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setAllCategories(data.categories);
          setCustomCategories(data.categories.filter((c: any) => !c.parentId && !c.parentSlug).map((c: any) => ({ name: c.name, slug: c.slug })));
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCustomCategories();

    // Check query params for preset category or addon flag
    if (typeof window !== 'undefined' && isNew) {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      const addonParam = params.get('isAddon');
      if (catParam || addonParam) {
        setFormData((prev: any) => {
          const nextCat = catParam || prev.category;
          return {
            ...prev,
            category: nextCat,
            isAddon: addonParam === 'true' || nextCat === 'addon' || prev.isAddon,
            requiresPrescription: nextCat === 'eyeglasses',
          };
        });
      }
    }
  }, [isNew]);

  useEffect(() => {
    if (!isNew) {
      const fetchProduct = async () => {
        const token = localStorage.getItem('adminToken');
        try {
          const res = await fetch(`/api/admin/products/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            const prod = data.product;
            let variants = prod.colorVariants || [];
            if (variants.length === 0 && prod.frameColor) {
              variants = [{ color: prod.frameColor, hex: '#1A1F2C', imageUrl: prod.images?.[0] || '' }];
            }
            setFormData({ ...formData, ...prod, colorVariants: variants });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('adminToken');

    // Mongoose Discriminator Logic
    let type = 'Product';
    if (formData.category === 'eyeglasses') type = 'EyewearProduct';
    if (formData.category === 'sunglasses') type = 'SunglassesProduct';

    // Clean up colorVariants: keep only rows with a color name
    const cleanedColorVariants = (formData.colorVariants || [])
      .filter((cv: any) => cv && cv.color && cv.color.trim() !== '')
      .map((cv: any) => ({
        color: cv.color.trim(),
        hex: cv.hex?.trim() || '#1A1F2C',
        imageUrl: cv.imageUrl?.trim() || '',
      }));

    // Synchronize primary frameColor with first variant if available
    const primaryColor = cleanedColorVariants[0]?.color || formData.frameColor || '';

    const payload = { 
      ...formData, 
      colorVariants: cleanedColorVariants,
      frameColor: primaryColor,
      type 
    };
    
    // Clean up pricing based on availability
    if (payload.regionAvailability === 'US') delete payload.pricing.IN;
    if (payload.regionAvailability === 'IN') delete payload.pricing.US;

    try {
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${productId}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/admin/products');
      } else {
        alert(data.message || 'Failed to save product');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-[var(--color-admin-text-muted)] flex items-center gap-3"><Loader2 className="animate-spin" /> Loading product data...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[var(--color-admin-surface)] p-4 md:p-6 rounded-2xl border border-[var(--color-admin-border)] sticky top-20 md:top-24 z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/admin/products" className="p-2 bg-[var(--color-admin-bg)] rounded-lg text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-serif text-[var(--color-gold-primary)] truncate">{isNew ? 'Create New Product' : 'Edit Product'}</h1>
            <p className="text-[var(--color-admin-text-muted)] text-xs md:text-sm tracking-wide hidden sm:block">Optical precision required.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold tracking-wide hover:scale-105 transition-transform disabled:opacity-50 text-sm shrink-0"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isNew ? 'PUBLISH CATALOG' : 'SAVE CHANGES'}</span>
        </button>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        
        {/* Core Details */}
        <div className="bg-[var(--color-admin-surface)] p-4 md:p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
          <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4">Core Identification</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Name <span className="text-red-500 ml-1">*</span></label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => {
                  const newName = e.target.value;
                  if (isNew && (!formData.slug || formData.slug === slugify(formData.name))) {
                    setFormData({ ...formData, name: newName, slug: slugify(newName) });
                  } else {
                    setFormData({ ...formData, name: newName });
                  }
                }} 
                placeholder="e.g. Leather Protective Case"
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Slug / URL <span className="text-red-500 ml-1">*</span></label>
              <input 
                type="text" 
                required 
                value={formData.slug} 
                onChange={e => setFormData({...formData, slug: slugify(e.target.value)})} 
                placeholder="e.g. leather-protective-case"
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">SKU / Internal Code</label>
              <input type="text" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. ACC-CASE-01" className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Brand</label>
              <input type="text" value={formData.brand || 'Jemy'} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
            </div>
          </div>

          {/* Dynamic Available Subcategories */}
          {(() => {
            const availableSubcategories = allCategories.filter(
              (c: any) => (c.parentSlug && c.parentSlug.toLowerCase() === formData.category?.toLowerCase()) ||
                          (c.parentId && allCategories.find((p: any) => p._id === c.parentId)?.slug.toLowerCase() === formData.category?.toLowerCase())
            );

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Category <span className="text-red-500 ml-1">*</span></label>
                  <select 
                    value={formData.category} 
                    onChange={e => {
                      const nextCat = e.target.value;
                      const isNowAddon = nextCat === 'addon' ? true : formData.isAddon;
                      const reqRx = nextCat === 'eyeglasses';
                      setFormData({
                        ...formData, 
                        category: nextCat,
                        subcategory: '',
                        isAddon: isNowAddon,
                        requiresPrescription: reqRx,
                      });
                    }} 
                    className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                  >
                    <optgroup label="Core Eyewear">
                      <option value="eyeglasses">Eyeglasses (Optical)</option>
                      <option value="sunglasses">Sunglasses</option>
                    </optgroup>
                    <optgroup label="Accessories & Essentials">
                      <option value="accessories">Accessories (Cases, Chains, Cloths)</option>
                      <option value="addon">Add-on / Upsell</option>
                      <option value="perfume">Perfume & Fragrance</option>
                    </optgroup>
                    {customCategories.length > 0 && (
                      <optgroup label="Custom Root Categories">
                        {customCategories
                          .filter(c => !['eyeglasses', 'sunglasses', 'accessories', 'addon', 'perfume'].includes(c.slug))
                          .map(c => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Sub-category</label>
                    <Link href="/admin/categories" target="_blank" className="text-[10px] text-[var(--color-gold-primary)] hover:underline font-mono">
                      + Manage
                    </Link>
                  </div>
                  <select
                    value={formData.subcategory || ''}
                    onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                    disabled={availableSubcategories.length === 0}
                    className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)] disabled:opacity-40"
                  >
                    <option value="">
                      {availableSubcategories.length > 0 ? '[General / None]' : `[No subcategories]`}
                    </option>
                    {availableSubcategories.map((sub: any) => (
                      <option key={sub.slug} value={sub.slug}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Base Stock <span className="text-red-500 ml-1">*</span></label>
                  <input type="number" required value={formData.stock ?? ''} onChange={e => setFormData({...formData, stock: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Availability</label>
                  <select value={formData.regionAvailability} onChange={e => setFormData({...formData, regionAvailability: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]">
                    <option value="BOTH">Available in Both (US & IN)</option>
                    <option value="US">Available in US Only</option>
                    <option value="IN">Available in IN Only</option>
                  </select>
                </div>
              </div>
            );
          })()}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Description <span className="text-red-500 ml-1">*</span></label>
            <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe product material, craftsmanship, and specifications..." className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="flex items-center gap-3 p-4 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg cursor-pointer">
              <input type="checkbox" checked={formData.isPublished !== false} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="w-5 h-5 accent-[var(--color-gold-primary)]" />
              <div>
                <span className="block text-sm font-medium text-[var(--color-admin-text)]">Published on Storefront</span>
                <span className="block text-xs text-[var(--color-admin-text-muted)]">If unchecked, this product will be hidden from public catalogs.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg cursor-pointer">
              <input type="checkbox" checked={!!formData.isAddon} onChange={e => setFormData({...formData, isAddon: e.target.checked})} className="w-5 h-5 accent-[var(--color-gold-primary)]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="block text-sm font-medium text-[var(--color-admin-text)]">Feature as Cart Add-on (Upsell)</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-gold-primary)]/15 text-[var(--color-gold-primary)]">Cart Upsell</span>
                </div>
                <span className="block text-xs text-[var(--color-admin-text-muted)]">Shows in the 1-click "Complete Your Care" carousel inside the Cart Drawer.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Metadata & Discovery */}
        <div className="bg-[var(--color-admin-surface)] p-4 md:p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
          <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4">Metadata & Discovery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Tags (comma separated)</label>
              <input 
                type="text" 
                value={(formData.tags || []).join(', ')} 
                onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                placeholder="e.g. vintage, summer, lightweight"
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Features (comma separated)</label>
              <input 
                type="text" 
                value={(formData.features || []).join(', ')} 
                onChange={e => setFormData({...formData, features: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                placeholder="e.g. Anti-reflective, UV400, Spring hinges"
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" 
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Images (comma separated URLs)</label>
              <textarea 
                rows={3}
                value={(formData.images || []).join(',\n')} 
                onChange={e => setFormData({...formData, images: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                placeholder="e.g. https://res.cloudinary.com/..., https://res.cloudinary.com/..."
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)] font-mono text-sm" 
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-[var(--color-admin-surface)] p-4 md:p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
          <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4">Dual-Region Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(formData.regionAvailability === 'BOTH' || formData.regionAvailability === 'US') && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">USA Price (USD) <span className="text-red-500 ml-1">*</span></label>
                <input type="number" required value={formData.pricing?.US?.amount ?? ''} onChange={e => setFormData({...formData, pricing: { ...formData.pricing, US: { ...formData.pricing.US, amount: e.target.value === '' ? '' : parseInt(e.target.value) } }})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
            )}
            {(formData.regionAvailability === 'BOTH' || formData.regionAvailability === 'IN') && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">India Price (INR) <span className="text-red-500 ml-1">*</span></label>
                <input type="number" required value={formData.pricing?.IN?.amount ?? ''} onChange={e => setFormData({...formData, pricing: { ...formData.pricing, IN: { ...formData.pricing.IN, amount: e.target.value === '' ? '' : parseInt(e.target.value) } }})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
            )}
          </div>
        </div>

        {/* Optical Specific (Only for Glasses) */}
        {(formData.category === 'eyeglasses' || formData.category === 'sunglasses') && (
          <div className="bg-[var(--color-admin-surface)] p-4 md:p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
            <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4 flex items-center gap-2">
              <Info size={16} className="text-[var(--color-gold-primary)]" /> Technical Optical Specifications
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Frame Shape</label>
                <select value={formData.frameShape} onChange={e => setFormData({...formData, frameShape: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]">
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="aviator">Aviator</option>
                  <option value="cat-eye">Cat-Eye</option>
                  <option value="wayfarer">Wayfarer</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Frame Material</label>
                <input type="text" value={formData.frameMaterial} onChange={e => setFormData({...formData, frameMaterial: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Frame Color</label>
                <input
                  type="text"
                  value={formData.frameColor || ''}
                  onChange={e => setFormData({...formData, frameColor: e.target.value})}
                  placeholder="e.g. Matte Black, Tortoise, Gold, Navy"
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Frame Size</label>
                <select value={formData.frameSize || 'M'} onChange={e => setFormData({...formData, frameSize: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]">
                  <option value="S">S — Small</option>
                  <option value="M">M — Medium</option>
                  <option value="L">L — Large</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Lens Width (mm)</label>
                <input type="number" value={formData.frameMeasurements?.lensWidth} onChange={e => setFormData({...formData, frameMeasurements: { ...formData.frameMeasurements, lensWidth: parseInt(e.target.value) }})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Bridge (mm)</label>
                <input type="number" value={formData.frameMeasurements?.bridgeWidth} onChange={e => setFormData({...formData, frameMeasurements: { ...formData.frameMeasurements, bridgeWidth: parseInt(e.target.value) }})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Temple (mm)</label>
                <input type="number" value={formData.frameMeasurements?.templeLength} onChange={e => setFormData({...formData, frameMeasurements: { ...formData.frameMeasurements, templeLength: parseInt(e.target.value) }})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
              </div>
            </div>
            
            <label className="flex items-center gap-3 p-4 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg cursor-pointer">
              <input type="checkbox" checked={formData.requiresPrescription} onChange={e => setFormData({...formData, requiresPrescription: e.target.checked})} className="w-5 h-5 accent-[var(--color-gold-primary)]" />
              <span className="text-sm font-medium text-[var(--color-admin-text)]">Requires Customer Prescription (Rx) Verification?</span>
            </label>
          </div>
        )}

        {/* Color Variants & Color-Specific Images */}
        <div className="bg-[var(--color-admin-surface)] p-4 md:p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-admin-border)] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <Palette size={16} className="text-[var(--color-gold-primary)]" /> Color Variants & Color-Specific Images
              </h2>
              <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">
                Define available color choices and assign a specific product image for each color. Customers selecting this color on the store will see its dedicated image.
              </p>
            </div>
            <button
              type="button"
              onClick={() => addColorVariant()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] hover:scale-105 transition-transform text-xs font-bold uppercase tracking-wider shrink-0"
            >
              <Plus size={14} /> Add Color Variant
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-[var(--color-admin-text-muted)]">Quick Presets:</span>
            {[
              { label: 'Tortoiseshell', color: 'Tortoiseshell', hex: '#5B3A29' },
              { label: 'Onyx Black', color: 'Onyx Black', hex: '#11131A' },
              { label: 'Clear Acetate', color: 'Clear Acetate', hex: '#EAEBE6' },
              { label: 'Champagne Gold', color: 'Champagne Gold', hex: '#D4AF37' },
              { label: 'Titanium Silver', color: 'Titanium Silver', hex: '#C0C0C0' },
              { label: 'Deep Navy', color: 'Deep Navy', hex: '#1B2A4A' },
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const exists = (formData.colorVariants || []).some((cv: any) => cv.color?.toLowerCase() === preset.color.toLowerCase());
                  if (!exists) {
                    addColorVariant({ color: preset.color, hex: preset.hex });
                  }
                }}
                className="text-[10px] px-2.5 py-1 rounded-md bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] hover:border-[var(--color-gold-primary)] text-[var(--color-admin-text)] flex items-center gap-1.5 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-white/20" style={{ background: preset.hex }} />
                + {preset.label}
              </button>
            ))}
          </div>

          {/* List of Variants */}
          {(!formData.colorVariants || formData.colorVariants.length === 0) ? (
            <div className="p-8 rounded-xl border border-dashed border-[var(--color-admin-border)] text-center text-[var(--color-admin-text-muted)] text-sm space-y-3">
              <Palette size={24} className="mx-auto text-[var(--color-admin-text-muted)]/50" />
              <p>No color variants added yet. Click &quot;+ Add Color Variant&quot; or choose a quick preset above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.colorVariants.map((variant: any, idx: number) => (
                <div key={idx} className="p-5 rounded-xl bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0" style={{ background: variant.hex || '#1A1F2C' }} />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-admin-text)]">
                        {variant.color ? variant.color : `Color Variant #${idx + 1}`}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--color-gold-primary)]/15 text-[var(--color-gold-primary)]">
                          Primary Color
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeColorVariant(idx)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Remove color variant"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Color Name */}
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="block text-[11px] font-semibold text-[var(--color-admin-text)] uppercase">Color Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Classic Tortoise"
                        value={variant.color || ''}
                        onChange={e => updateColorVariant(idx, 'color', e.target.value)}
                        className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                      />
                    </div>

                    {/* Swatch Hex / Picker */}
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="block text-[11px] font-semibold text-[var(--color-admin-text)] uppercase">Swatch / Hex</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={variant.hex?.startsWith('#') && variant.hex.length === 7 ? variant.hex : '#1A1F2C'}
                          onChange={e => updateColorVariant(idx, 'hex', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-[var(--color-admin-border)] p-1 shrink-0"
                          title="Pick color"
                        />
                        <input
                          type="text"
                          placeholder="#1A1F2C"
                          value={variant.hex || ''}
                          onChange={e => updateColorVariant(idx, 'hex', e.target.value)}
                          className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                        />
                      </div>
                    </div>

                    {/* Color-Specific Image URL */}
                    <div className="md:col-span-5 space-y-1.5">
                      <label className="block text-[11px] font-semibold text-[var(--color-admin-text)] uppercase">
                        Product Image for this Color
                      </label>
                      <div className="flex gap-2 items-center">
                        {/* Live Preview Thumbnail */}
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] overflow-hidden shrink-0 flex items-center justify-center">
                          {variant.imageUrl ? (
                            <img
                              src={variant.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <ImageIcon size={16} className="text-[var(--color-admin-text-muted)]" />
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Image URL (e.g. https://... or /images/...)"
                          value={variant.imageUrl || ''}
                          onChange={e => updateColorVariant(idx, 'imageUrl', e.target.value)}
                          className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                        />
                      </div>

                      {/* Quick Pick from Uploaded Product Images if any */}
                      {formData.images && formData.images.filter(Boolean).length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 overflow-x-auto py-1">
                          <span className="text-[10px] text-[var(--color-admin-text-muted)] shrink-0">Select from images:</span>
                          {formData.images.filter(Boolean).map((imgUrl: string, imgIdx: number) => (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() => updateColorVariant(idx, 'imageUrl', imgUrl)}
                              className={`w-6 h-6 rounded border shrink-0 overflow-hidden transition-all ${
                                variant.imageUrl === imgUrl ? 'border-[var(--color-gold-primary)] ring-1 ring-[var(--color-gold-primary)]' : 'border-[var(--color-admin-border)] opacity-60 hover:opacity-100'
                              }`}
                              title={`Use image #${imgIdx + 1}`}
                            >
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accessory Specific (Cases, Chains, Cloths, Kits, Add-ons) */}
        {(formData.category === 'accessories' || formData.category === 'addon') && (
          <div className="bg-[var(--color-admin-surface)] p-4 md:p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
            <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4 flex items-center gap-2">
              <Info size={16} className="text-[var(--color-gold-primary)]" /> Accessory Details & Specifications
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Accessory Type</label>
                <input 
                  type="text" 
                  value={formData.frameMaterial || ''} 
                  onChange={e => setFormData({...formData, frameMaterial: e.target.value})} 
                  placeholder="e.g. Leather Hard Case, Microfiber Cloth, Gold Eyewear Chain"
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Compatibility / Size</label>
                <input 
                  type="text" 
                  value={formData.frameShape || ''} 
                  onChange={e => setFormData({...formData, frameShape: e.target.value})} 
                  placeholder="e.g. Fits all frames, Universal size, For oversized silhouettes"
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" 
                />
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
