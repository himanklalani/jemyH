'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Search, ArchiveRestore, Trash2, CheckCircle2 } from 'lucide-react';

export default function AdminRMAPage() {
  const [rmas, setRmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchRmas = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const res = await fetch('/api/admin/rma', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRmas(data.rmas || []); // Assuming we have a GET route for this
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRmas();
  }, []);

  const handleAction = async (id: string, action: 'restock' | 'write-off') => {
    if (!confirm(`Are you sure you want to ${action} this returned item?`)) return;
    
    setActionLoading(id);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/rma/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        fetchRmas();
      } else {
        const data = await res.json();
        alert(data.message);
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
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Returns & Exchanges (RMA)</h1>
        <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage customer returns, restock inventory, or write-off damages.</p>
      </div>

      <div className="bg-[var(--color-admin-surface)] rounded-xl border border-[var(--color-admin-border)] overflow-hidden flex flex-col">
        {rmas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
             <RotateCcw size={48} className="text-[var(--color-admin-text-muted)] opacity-20 mb-4" />
             <h2 className="text-xl text-[var(--color-admin-text)] font-serif">No Pending Returns</h2>
             <p className="text-[var(--color-admin-text-muted)] text-sm mt-2">All RMA requests have been processed.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-admin-bg)] border-b border-[var(--color-admin-border)]">
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">RMA / Order ID</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Customer & Reason</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Item Details</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider text-right">Processing</th>
              </tr>
            </thead>
            <tbody>
              {rmas.map((rma) => (
                <tr key={rma._id} className="border-b border-[var(--color-admin-border)] last:border-0 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-[var(--color-admin-text)] font-mono text-sm">{rma._id.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-[var(--color-admin-text-muted)] uppercase mt-1">Order: {rma.orderId?.slice(-8).toUpperCase()}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-[var(--color-admin-text)]">{rma.user?.name || 'Customer'}</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] mt-1 max-w-[200px] truncate" title={rma.reason}>"{rma.reason}"</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-[var(--color-admin-bg)] flex items-center justify-center border border-[var(--color-admin-border)] shrink-0 overflow-hidden">
                        {rma.product?.images?.[0] ? <img src={rma.product.images[0]} alt="" className="w-full h-full object-cover" /> : <RotateCcw size={14} className="text-[var(--color-admin-text-muted)]" />}
                      </div>
                      <div>
                        <p className="text-sm text-[var(--color-admin-text)] font-medium leading-tight">{rma.product?.name || 'Product'}</p>
                        <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Qty: {rma.quantity}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold
                      ${rma.status === 'requested' ? 'bg-orange-400/10 text-orange-400' : 
                        rma.status === 'approved' ? 'bg-[var(--color-gold-primary)]/10 text-[var(--color-gold-primary)]' :
                        rma.status === 'processed' ? 'bg-green-400/10 text-green-400' :
                        'bg-red-400/10 text-red-400'}`}>
                      {rma.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {rma.status === 'approved' || rma.status === 'requested' ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAction(rma._id, 'restock')}
                          disabled={actionLoading === rma._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500 hover:text-white transition-colors text-xs font-bold"
                          title="Restock Inventory"
                        >
                          <ArchiveRestore size={14} /> RESTOCK
                        </button>
                        <button 
                          onClick={() => handleAction(rma._id, 'write-off')}
                          disabled={actionLoading === rma._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition-colors text-xs font-bold"
                          title="Write-off as damaged"
                        >
                          <Trash2 size={14} /> WRITE-OFF
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end items-center gap-2 text-xs font-semibold text-[var(--color-admin-text-muted)]">
                        <CheckCircle2 size={14} /> PROCESSED
                      </div>
                    )}
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
