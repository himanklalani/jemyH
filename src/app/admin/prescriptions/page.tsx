'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle2, XCircle, User, Package, Calendar, Loader2 } from 'lucide-react';

export default function AdminPrescriptionsPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const router = useRouter();

  const fetchQueue = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const res = await fetch('/api/admin/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
        if (data.queue.length > 0 && !activeItem) {
          setActiveItem(data.queue[0]);
        } else if (data.queue.length === 0) {
          setActiveItem(null);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (status: 'verified' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      return alert('Rejection reason is mandatory.');
    }
    
    setActionLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/prescriptions/${activeItem.orderId}/${activeItem.itemId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined
        })
      });
      
      if (res.ok) {
        setRejectionReason('');
        await fetchQueue();
        if (queue.length > 1) {
          // Auto-advance to the next item
          setActiveItem(queue.find(q => q.itemId !== activeItem.itemId) || null);
        }
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin mx-auto mt-20"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 h-full flex flex-col">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Prescription Inspector</h1>
        <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Optical verification queue for complex lens orders.</p>
      </div>

      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-admin-border)] rounded-2xl p-12">
           <CheckCircle2 size={48} className="text-[var(--color-admin-text-muted)] opacity-20 mb-4" />
           <h2 className="text-xl text-[var(--color-admin-text)] font-serif">Queue is Empty</h2>
           <p className="text-[var(--color-admin-text-muted)] text-sm">All optical prescriptions have been verified.</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Queue List */}
          <div className="bg-[var(--color-admin-surface)] rounded-2xl border border-[var(--color-admin-border)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--color-admin-border)] bg-[var(--color-admin-bg)]">
              <h3 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Pending ({queue.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {queue.map(item => (
                <button 
                  key={item.itemId}
                  onClick={() => setActiveItem(item)}
                  className={`w-full text-left p-4 border-b border-[var(--color-admin-border)] transition-colors ${activeItem?.itemId === item.itemId ? 'bg-[var(--color-admin-bg)] border-l-4 border-l-[var(--color-gold-primary)]' : 'hover:bg-[var(--color-admin-surface-hover)] border-l-4 border-l-transparent'}`}
                >
                  <p className="text-sm font-medium text-[var(--color-admin-text)] truncate">{item.customer?.name || 'Customer'}</p>
                  <p className="text-xs text-[var(--color-admin-text-muted)] truncate">{item.product?.name}</p>
                  <p className="text-[10px] text-[var(--color-admin-text-muted)] mt-2 font-mono uppercase">ID: {item.orderId.slice(-8)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Inspector Workspace */}
          {activeItem && (
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Context Cards */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[var(--color-admin-surface)] p-5 rounded-2xl border border-[var(--color-admin-border)] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-admin-bg)] flex items-center justify-center shrink-0 border border-[var(--color-admin-border)]"><User size={16} className="text-[var(--color-gold-primary)]"/></div>
                  <div>
                    <p className="text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-1">Customer</p>
                    <p className="text-sm font-bold text-[var(--color-admin-text)]">{activeItem.customer?.name}</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)]">{activeItem.customer?.email}</p>
                  </div>
                </div>
                
                <div className="bg-[var(--color-admin-surface)] p-5 rounded-2xl border border-[var(--color-admin-border)] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-admin-bg)] overflow-hidden flex items-center justify-center shrink-0 border border-[var(--color-admin-border)]">
                    {activeItem.product?.images?.[0] ? <img src={activeItem.product.images[0]} className="w-full h-full object-cover"/> : <Package size={16} />}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-1">Frame Selected</p>
                    <p className="text-sm font-bold text-[var(--color-admin-text)] truncate">{activeItem.product?.name}</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] capitalize">{activeItem.prescription?.type || 'Single Vision'} Lens</p>
                  </div>
                </div>
              </div>

              {/* Prescription Data Viewer */}
              <div className="bg-[var(--color-admin-surface)] rounded-2xl border border-[var(--color-admin-border)] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[var(--color-admin-border)] bg-[var(--color-admin-bg)] flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[var(--color-gold-primary)] uppercase tracking-wider flex items-center gap-2"><FileText size={16}/> RX Details</h3>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-admin-text-muted)] bg-[var(--color-admin-border)] px-2 py-0.5 rounded font-bold">
                    {activeItem.prescription?.verificationMethod === 'file-upload' ? 'FILE UPLOAD' : 'MANUAL ENTRY'}
                  </span>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Values Table */}
                  <div className="space-y-4">
                    <table className="w-full text-sm text-[var(--color-admin-text)] border border-[var(--color-admin-border)] rounded-lg overflow-hidden hidden md:table">
                      <thead className="bg-[var(--color-admin-bg)] border-b border-[var(--color-admin-border)] text-xs text-[var(--color-admin-text-muted)] uppercase">
                        <tr>
                          <th className="p-2 text-left">Eye</th>
                          <th className="p-2">SPH</th>
                          <th className="p-2">CYL</th>
                          <th className="p-2">AXIS</th>
                          <th className="p-2">ADD</th>
                        </tr>
                      </thead>
                      <tbody className="text-center font-mono">
                        <tr className="border-b border-[var(--color-admin-border)]">
                          <td className="p-2 text-left font-bold text-[var(--color-admin-text-muted)]">OD (Right)</td>
                          <td className="p-2">{activeItem.prescription?.od?.sphere || '0.00'}</td>
                          <td className="p-2">{activeItem.prescription?.od?.cylinder || '0.00'}</td>
                          <td className="p-2">{activeItem.prescription?.od?.axis || '0'}</td>
                          <td className="p-2">{activeItem.prescription?.od?.add || '0.00'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-left font-bold text-[var(--color-admin-text-muted)]">OS (Left)</td>
                          <td className="p-2">{activeItem.prescription?.os?.sphere || '0.00'}</td>
                          <td className="p-2">{activeItem.prescription?.os?.cylinder || '0.00'}</td>
                          <td className="p-2">{activeItem.prescription?.os?.axis || '0'}</td>
                          <td className="p-2">{activeItem.prescription?.os?.add || '0.00'}</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="flex gap-4">
                      <div className="bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] px-4 py-2 rounded-lg flex-1">
                        <p className="text-[10px] text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-1">Pupillary Distance</p>
                        <p className="font-mono text-lg">{activeItem.prescription?.pd || 'N/A'} <span className="text-xs text-[var(--color-admin-text-muted)]">mm</span></p>
                      </div>
                      {(activeItem.prescription?.doctorName || activeItem.prescription?.prescriptionDate) && (
                        <div className="bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] px-4 py-2 rounded-lg flex-1">
                          <p className="text-[10px] text-[var(--color-admin-text-muted)] uppercase tracking-wider mb-1">Doctor / Date</p>
                          <p className="text-sm truncate">{activeItem.prescription?.doctorName || 'Unknown'}</p>
                          <p className="text-xs text-[var(--color-admin-text-muted)]">{activeItem.prescription?.prescriptionDate ? new Date(activeItem.prescription.prescriptionDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Viewer */}
                  <div className="border border-[var(--color-admin-border)] rounded-lg bg-[var(--color-admin-bg)] flex items-center justify-center p-2 h-48 md:h-full relative group overflow-hidden">
                    {activeItem.prescription?.prescriptionFileUrl ? (
                      <img src={activeItem.prescription.prescriptionFileUrl} alt="Prescription Upload" className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-transform" onClick={() => window.open(activeItem.prescription.prescriptionFileUrl, '_blank')} />
                    ) : (
                      <div className="text-center text-[var(--color-admin-text-muted)]">
                        <FileText size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs uppercase tracking-wider">No Document Uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="p-6 bg-[var(--color-admin-bg)] border-t border-[var(--color-admin-border)]">
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <button 
                      onClick={() => handleAction('verified')}
                      disabled={actionLoading}
                      className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 font-bold py-4 rounded-xl hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      VERIFY & APPROVE
                    </button>
                    
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Reason for rejection (mandatory)..."
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="flex-1 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl px-4 text-sm text-[var(--color-admin-text)] outline-none focus:border-red-400"
                      />
                      <button 
                        onClick={() => handleAction('rejected')}
                        disabled={actionLoading}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-6 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 shrink-0"
                      >
                        <XCircle size={18} /> REJECT
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
