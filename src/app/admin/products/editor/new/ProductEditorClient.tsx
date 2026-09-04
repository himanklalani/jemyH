'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Info } from 'lucide-react';
import Link from 'next/link';

export default function ProductEditorClient({ productId }: { productId: string }) {
  const router = useRouter();
  const isNew = productId === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    slug: '',
    description: '',
    category: 'eyeglasses',
    stock: 0,
    regionAvailability: 'BOTH',
    pricing: { US: { amount: 0, currency: 'USD' }, IN: { amount: 0, currency: 'INR' } },
    images: [''],
    requiresPrescription: true,
    isPublished: true,
    sku: '',
    brand: 'Jemy',
    tags: [],
    features: [],
    // Eyewear Specific
    frameMeasurements: { lensWidth: 0, bridgeWidth: 0, templeLength: 0 },
    frameMaterial: 'Acetate',
    frameShape: 'round',
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
            setFormData({ ...formData, ...data.product });
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

    const payload = { ...formData, type };
    
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
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-[var(--color-admin-surface)] p-6 rounded-2xl border border-[var(--color-admin-border)] sticky top-24 z-10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-[var(--color-admin-bg)] rounded-lg text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-serif text-[var(--color-gold-primary)]">{isNew ? 'Create New Product' : 'Edit Product'}</h1>
            <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Optical precision required.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-6 py-3 rounded-lg font-bold tracking-wide hover:scale-105 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isNew ? 'PUBLISH CATALOG' : 'SAVE CHANGES'}</span>
        </button>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        
        {/* Core Details */}
        <div className="bg-[var(--color-admin-surface)] p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
          <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4">Core Identification</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Name <span className="text-red-500 ml-1">*</span></label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Slug / URL <span className="text-red-500 ml-1">*</span></label>
              <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">SKU / Internal Code</label>
              <input type="text" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Brand</label>
              <input type="text" value={formData.brand || 'Jemy'} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]">
                <option value="eyeglasses">Eyeglasses</option>
                <option value="sunglasses">Sunglasses</option>
                <option value="perfume">Perfume</option>
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

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--color-admin-text)] uppercase">Description <span className="text-red-500 ml-1">*</span></label>
            <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]" />
          </div>
          
          <label className="flex items-center gap-3 p-4 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg cursor-pointer mt-4">
            <input type="checkbox" checked={formData.isPublished !== false} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="w-5 h-5 accent-[var(--color-gold-primary)]" />
            <div>
              <span className="block text-sm font-medium text-[var(--color-admin-text)]">Published on Storefront</span>
              <span className="block text-xs text-[var(--color-admin-text-muted)]">If unchecked, this product will be hidden from public catalogs.</span>
            </div>
          </label>
        </div>

        {/* Metadata & Discovery */}
        <div className="bg-[var(--color-admin-surface)] p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
          <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4">Metadata & Discovery</h2>
          <div className="grid grid-cols-2 gap-6">
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
            <div className="space-y-2 col-span-2">
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
        <div className="bg-[var(--color-admin-surface)] p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
          <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4">Dual-Region Pricing</h2>
          <div className="grid grid-cols-2 gap-6">
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
          <div className="bg-[var(--color-admin-surface)] p-8 rounded-2xl border border-[var(--color-admin-border)] space-y-6">
            <h2 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider border-b border-[var(--color-admin-border)] pb-4 flex items-center gap-2">
              <Info size={16} className="text-[var(--color-gold-primary)]" /> Technical Optical Specifications
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
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

            <div className="grid grid-cols-3 gap-6 pt-4">
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

      </form>
    </div>
  );
}
