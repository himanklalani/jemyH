'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, Archive, Activity } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Stock adjustment modal state
  const [stockModal, setStockModal] = useState<{ isOpen: boolean; product: any; adjustment: number; reason: string }>({
    isOpen: false,
    product: null,
    adjustment: 0,
    reason: ''
  });

  const fetchProducts = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const res = await fetch(`/api/admin/products?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
        return;
      }
      
      try {
        const text = await res.text();
        if (!text) {
          console.error(`Empty response from API (Status: ${res.status} ${res.statusText})`);
          return;
        }
        
        const data = JSON.parse(text);
        if (data.success) {
          setProducts(data.products);
        }
      } catch (parseError) {
        console.error(`Failed to parse products API response (Status: ${res.status}):`, parseError);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]); // re-fetch on search change

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch(`/api/admin/products/${stockModal.product._id}/stock`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          stockAdjustment: Number(stockModal.adjustment),
          reason: stockModal.reason
        })
      });
      
      if (res.ok) {
        setStockModal({ isOpen: false, product: null, adjustment: 0, reason: '' });
        fetchProducts();
      } else {
        alert('Failed to adjust stock');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Master Catalog</h1>
          <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage eyewear inventory, pricing, and technical attributes.</p>
        </div>
        <Link 
          href="/admin/products/editor/new"
          className="flex items-center gap-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] px-6 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={16} />
          <span>NEW PRODUCT</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--color-admin-surface)] p-4 rounded-xl border border-[var(--color-admin-border)] flex gap-4">
        <div className="flex-1 flex items-center gap-3 bg-[var(--color-admin-bg)] px-4 py-2 rounded-lg border border-[var(--color-admin-border)] focus-within:border-[var(--color-gold-primary)] transition-colors">
          <Search size={16} className="text-[var(--color-admin-text-muted)]" />
          <input 
            type="text" 
            placeholder="Search by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-[var(--color-admin-text)]"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[var(--color-admin-surface)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-admin-bg)] border-b border-[var(--color-admin-border)]">
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Product</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Category</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Price (US / IN)</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Stock</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-[var(--color-admin-border)] last:border-0 hover:bg-[var(--color-admin-surface-hover)] transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] overflow-hidden flex items-center justify-center shrink-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Archive size={16} className="text-[var(--color-admin-text-muted)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-admin-text)] group-hover:text-[var(--color-gold-primary)] transition-colors">{product.name}</p>
                      {product.type === 'EyewearProduct' && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-admin-accent)]/10 text-[var(--color-admin-accent)] mt-1 inline-block">Optical</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-[var(--color-admin-text-muted)] capitalize">{product.category}</td>
                <td className="p-4 text-sm text-[var(--color-admin-text-muted)]">
                  ${product.pricing?.US?.amount || 0} / ₹{product.pricing?.IN?.amount || 0}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-400' : 'text-[var(--color-admin-text)]'}`}>
                      {product.stock} units
                    </span>
                    <button 
                      onClick={() => setStockModal({ isOpen: true, product, adjustment: 0, reason: '' })}
                      className="p-1.5 rounded bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] text-[var(--color-admin-text-muted)] hover:text-[var(--color-gold-primary)] hover:border-[var(--color-gold-primary)] transition-colors"
                      title="Adjust Stock"
                    >
                      <Activity size={14} />
                    </button>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link 
                      href={`/admin/products/editor/${product._id}`}
                      className="p-2 text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] bg-[var(--color-admin-bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--color-admin-border)]"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(product._id)}
                      className="p-2 text-[var(--color-admin-text-muted)] hover:text-red-400 bg-[var(--color-admin-bg)] rounded-lg transition-colors border border-transparent hover:border-red-400/30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-12 text-center text-[var(--color-admin-text-muted)]">
            <Archive size={32} className="mx-auto mb-4 opacity-50" />
            <p>No products found in the catalog.</p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {stockModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-serif text-[var(--color-gold-primary)] mb-2">Adjust Inventory</h3>
            <p className="text-sm text-[var(--color-admin-text-muted)] mb-6">
              Modifying stock for <strong className="text-[var(--color-admin-text)]">{stockModal.product.name}</strong>. Current: {stockModal.product.stock}
            </p>
            <form onSubmit={handleStockAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-2">Adjustment (±)</label>
                <input 
                  type="number" 
                  required
                  value={stockModal.adjustment}
                  onChange={(e) => setStockModal({ ...stockModal, adjustment: parseInt(e.target.value) })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                />
                <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">
                  New stock will be: {Math.max(0, stockModal.product.stock + stockModal.adjustment)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-2">Reason for Audit</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Damaged in warehouse, restock delivery"
                  value={stockModal.reason}
                  onChange={(e) => setStockModal({ ...stockModal, reason: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none focus:border-[var(--color-gold-primary)]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-admin-border)]">
                <button 
                  type="button"
                  onClick={() => setStockModal({ isOpen: false, product: null, adjustment: 0, reason: '' })}
                  className="px-4 py-2 text-sm text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] font-bold text-sm rounded-lg hover:scale-105 transition-transform"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
