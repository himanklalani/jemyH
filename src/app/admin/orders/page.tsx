'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, PackageOpen, Download, AlertTriangle, Truck, CornerUpLeft } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('FedEx');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin/login');

    try {
      const res = await fetch(`/api/admin/orders?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const handleShipOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          action: 'shipped',
          trackingNumber,
          courier: shippingProvider
        })
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchOrders();
      } else {
        const d = await res.json();
        alert(d.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to issue a full refund? This is irreversible.')) return;
    setActionLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ action: 'refund' })
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchOrders();
      } else {
        const d = await res.json();
        alert(d.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadInvoice = async (orderId: string) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download invoice');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert('Invoice generation failed');
    }
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 rounded-full border-2 border-[var(--color-admin-border)] border-t-[var(--color-gold-primary)] animate-spin mx-auto mt-20"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">Order Fulfillment</h1>
        <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide">Manage shipping pipelines and payment refunds.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--color-admin-surface)] p-4 rounded-xl border border-[var(--color-admin-border)] flex gap-4">
        <div className="flex-1 flex items-center gap-3 bg-[var(--color-admin-bg)] px-4 py-2 rounded-lg border border-[var(--color-admin-border)] focus-within:border-[var(--color-gold-primary)] transition-colors">
          <Search size={16} className="text-[var(--color-admin-text-muted)]" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Email..."
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
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Order ID & Date</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Customer</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Amount</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider">Status</th>
              <th className="p-4 font-semibold text-xs text-[var(--color-admin-text-muted)] uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-[var(--color-admin-border)] last:border-0 hover:bg-[var(--color-admin-surface-hover)] transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                <td className="p-4">
                  <p className="font-medium text-[var(--color-admin-text)] font-mono text-sm group-hover:text-[var(--color-gold-primary)] transition-colors">{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-[var(--color-admin-text)]">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                  <p className="text-xs text-[var(--color-admin-text-muted)]">{order.region}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-[var(--color-admin-text)]">
                    {order.region === 'US' ? '$' : '₹'}{order.totalPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--color-admin-text-muted)] uppercase">{order.paymentMethod}</p>
                </td>
                <td className="p-4">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold
                    ${order.orderStatus === 'pending' ? 'bg-orange-400/10 text-orange-400' : 
                      order.orderStatus === 'shipped' ? 'bg-[var(--color-admin-accent)]/10 text-[var(--color-admin-accent)]' :
                      order.orderStatus === 'refunded' ? 'bg-red-400/10 text-red-400' :
                      'bg-green-400/10 text-green-400'}`}>
                    {order.orderStatus}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-xs font-semibold text-[var(--color-gold-primary)] uppercase tracking-wider hover:underline">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="p-12 text-center text-[var(--color-admin-text-muted)]">
            <PackageOpen size={32} className="mx-auto mb-4 opacity-50" />
            <p>No orders found matching criteria.</p>
          </div>
        )}
      </div>

      {/* Order Details Sliding Drawer (Overlay) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          
          <div className="relative w-full max-w-md bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-500 ease-[var(--ease-power4-out)] flex flex-col">
            <div className="p-6 border-b border-[var(--color-admin-border)] flex justify-between items-center bg-[var(--color-admin-bg)] sticky top-0 z-10">
              <h2 className="text-xl font-serif text-[var(--color-gold-primary)]">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-[var(--color-admin-text-muted)] hover:text-white transition-colors">Close</button>
            </div>

            <div className="p-6 flex-1 space-y-8">
              
              {/* Order Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Summary</h3>
                  <button onClick={() => downloadInvoice(selectedOrder._id)} className="flex items-center gap-1 text-xs text-[var(--color-gold-primary)] hover:underline">
                    <Download size={14} /> PDF Invoice
                  </button>
                </div>
                <div className="bg-[var(--color-admin-bg)] p-4 rounded-lg border border-[var(--color-admin-border)] space-y-2 text-sm text-[var(--color-admin-text)]">
                  <p className="flex justify-between"><span className="text-[var(--color-admin-text-muted)]">Order ID</span> <span className="font-mono">{selectedOrder._id}</span></p>
                  <p className="flex justify-between"><span className="text-[var(--color-admin-text-muted)]">Payment</span> <span className="uppercase">{selectedOrder.paymentStatus}</span></p>
                  <p className="flex justify-between"><span className="text-[var(--color-admin-text-muted)]">Total Amount</span> <span>{selectedOrder.region === 'US' ? '$' : '₹'}{selectedOrder.totalPrice}</span></p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Line Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-[var(--color-admin-bg)] p-3 rounded-lg border border-[var(--color-admin-border)] flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-[var(--color-admin-surface)] shrink-0 overflow-hidden flex items-center justify-center">
                         {item.product?.images?.[0] ? <img src={item.product.images[0]} alt="Product" className="w-full h-full object-cover" /> : <PackageOpen size={14} className="opacity-50" />}
                      </div>
                      <div>
                        <p className="text-sm text-[var(--color-admin-text)] font-medium leading-tight">{item.product?.name || 'Unknown Product'}</p>
                        <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Qty: {item.quantity}</p>
                        {item.prescription && (
                           <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-admin-accent)]/20 text-[var(--color-admin-accent)] mt-1 inline-block">Rx Attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Panels */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-admin-border)]">
                {selectedOrder.orderStatus === 'pending' && (
                  <form onSubmit={handleShipOrder} className="bg-[var(--color-admin-bg)] p-5 rounded-xl border border-[var(--color-admin-accent)]/30 space-y-4">
                    <h4 className="text-sm font-bold text-[var(--color-admin-text)] flex items-center gap-2"><Truck size={16} className="text-[var(--color-admin-accent)]"/> Fulfill Shipment</h4>
                    <p className="text-xs text-[var(--color-admin-text-muted)]">Marking as shipped will dispatch an automated email to the customer with tracking details.</p>
                    
                    <div className="space-y-3">
                      <input 
                        type="text" required placeholder="Courier (e.g. FedEx, BlueDart)" value={shippingProvider} onChange={e => setShippingProvider(e.target.value)}
                        className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-md px-3 py-2 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-admin-accent)]" 
                      />
                      <input 
                        type="text" required placeholder="Tracking Number" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                        className="w-full bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-md px-3 py-2 text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-admin-accent)]" 
                      />
                      <button disabled={actionLoading} type="submit" className="w-full bg-[var(--color-admin-accent)] text-white font-bold py-2 rounded-md text-sm hover:bg-[var(--color-admin-accent)]/90 transition-colors disabled:opacity-50">
                        Confirm Shipment
                      </button>
                    </div>
                  </form>
                )}

                {['paid', 'pending'].includes(selectedOrder.paymentStatus) && selectedOrder.orderStatus !== 'refunded' && (
                  <div className="bg-red-500/5 p-5 rounded-xl border border-red-500/20 space-y-4">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-2"><CornerUpLeft size={16}/> Reverse Transaction</h4>
                    <p className="text-xs text-[var(--color-admin-text-muted)]">Issue a full refund to the customer's payment method. This will auto-restock inventory.</p>
                    <button onClick={handleRefund} disabled={actionLoading} className="w-full bg-red-500/10 text-red-400 border border-red-500/30 font-bold py-2 rounded-md text-sm hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50">
                      Process Full Refund
                    </button>
                  </div>
                )}

                {selectedOrder.orderStatus === 'shipped' && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                    <p className="text-sm text-green-400 font-bold">✓ Order Shipped</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Tracking: {selectedOrder.shippingDetails?.trackingNumber} ({selectedOrder.shippingDetails?.courier})</p>
                  </div>
                )}
                {selectedOrder.orderStatus === 'refunded' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <p className="text-sm text-red-400 font-bold">⤫ Order Refunded</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Transaction reversed and inventory restocked.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
