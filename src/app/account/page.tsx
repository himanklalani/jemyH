'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, FileText, MapPin, LogOut, ChevronRight, Clock, CheckCircle2, Loader2, XCircle } from 'lucide-react';

type Tab = 'orders' | 'prescriptions' | 'addresses';

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700',
  confirmed:  'bg-blue-50 text-blue-700',
  shipped:    'bg-indigo-50 text-indigo-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-700',
};

const RX_STYLES: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  verified:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-700',
};

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('orders');
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jemy_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/user/profile', { headers }).then(r => r.json()),
      fetch('/api/user/orders', { headers }).then(r => r.json()),
    ]).then(([userData, ordersData]) => {
      if (!userData.success) { router.push('/login'); return; }
      setUser(userData.user);
      if (ordersData.success) setOrders(ordersData.orders);
    }).catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('jemy_token');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const currencyFmt = (amount: number, currency: string) =>
    new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEBE6] pt-[68px]">
        <Loader2 size={32} className="animate-spin text-gold-primary" />
      </div>
    );
  }

  const TABS = [
    { id: 'orders' as Tab,        label: 'Orders',        icon: Package },
    { id: 'prescriptions' as Tab, label: 'Prescriptions', icon: FileText },
    { id: 'addresses' as Tab,     label: 'Addresses',     icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-[#EAEBE6] pt-[68px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between mb-14 pb-10 border-b border-indigo-900/10"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-gold-primary font-semibold mb-2">My Account</p>
            <h1 className="font-serif text-4xl md:text-5xl text-indigo-900 leading-tight">
              Welcome back,<br />{user?.name?.split(' ')[0]}.
            </h1>
            <p className="text-indigo-900/50 text-sm mt-2">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] font-semibold text-indigo-900/50 hover:text-red-500 transition-colors border border-indigo-900/10 hover:border-red-200 px-4 py-2 rounded-lg"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap w-full text-left ${
                    tab === t.id
                      ? 'bg-indigo-900 text-platinum-100'
                      : 'text-indigo-900/60 hover:text-indigo-900 hover:bg-indigo-900/5'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="md:hidden flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all w-full text-left"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* ORDERS TAB */}
            {tab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-indigo-900/5">
                    <Package size={48} className="text-indigo-900/15 mb-4" />
                    <h3 className="font-serif text-2xl text-indigo-900 mb-2">No orders yet.</h3>
                    <p className="text-indigo-900/50 text-sm mb-6">Your order history will appear here.</p>
                    <Link href="/products" className="inline-flex items-center gap-2 bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-gold-primary hover:text-indigo-900 transition-all">
                      Shop Frames <ChevronRight size={13} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order._id} className="bg-white rounded-2xl border border-indigo-900/5 p-6 hover:border-indigo-900/15 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-indigo-900/40 font-semibold mb-1">Order</p>
                            <p className="font-mono text-sm font-bold text-indigo-900">#{order._id.slice(-8).toUpperCase()}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.orderStatus] || 'bg-gray-50 text-gray-600'}`}>
                              {order.orderStatus}
                            </span>
                            <p className="text-indigo-900/40 text-xs mt-2">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                          {order.items?.slice(0, 3).map((item: any) => (
                            <div key={item._id} className="w-14 h-14 rounded-xl bg-[#F4F4F0] overflow-hidden shrink-0">
                              {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                            </div>
                          ))}
                          {order.items?.length > 3 && (
                            <div className="w-14 h-14 rounded-xl bg-indigo-900/5 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-indigo-900/50">+{order.items.length - 3}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-indigo-900/5">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-indigo-900/40 font-semibold">Total</p>
                            <p className="font-semibold text-indigo-900">{currencyFmt(order.totalAmount, order.currency)}</p>
                          </div>
                          {order.shippingTracking?.trackingNumber && (
                            <div className="flex items-center gap-2 text-xs font-medium text-indigo-900/60">
                              <Clock size={12} /> Track: {order.shippingTracking.trackingNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PRESCRIPTIONS TAB */}
            {tab === 'prescriptions' && (
              <motion.div
                key="prescriptions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {orders.filter((o: any) => o.items?.some((i: any) => i.prescription)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-indigo-900/5">
                    <FileText size={48} className="text-indigo-900/15 mb-4" />
                    <h3 className="font-serif text-2xl text-indigo-900 mb-2">No prescriptions on file.</h3>
                    <p className="text-indigo-900/50 text-sm">Prescriptions submitted with optical orders will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.flatMap((order: any) =>
                      order.items?.filter((item: any) => item.prescription).map((item: any) => (
                        <div key={`${order._id}-${item._id}`} className="bg-white rounded-2xl border border-indigo-900/5 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-semibold text-indigo-900">{item.product?.name || 'Optical Product'}</p>
                              <p className="text-[10px] uppercase tracking-widest text-indigo-900/40 font-semibold mt-1">Order #{order._id.slice(-8).toUpperCase()}</p>
                            </div>
                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${RX_STYLES[item.prescription.verificationStatus] || 'bg-gray-50 text-gray-600'}`}>
                              {item.prescription.verificationStatus === 'verified' ? <CheckCircle2 size={10} className="inline mr-1" /> : item.prescription.verificationStatus === 'rejected' ? <XCircle size={10} className="inline mr-1" /> : <Clock size={10} className="inline mr-1" />}
                              {item.prescription.verificationStatus}
                            </span>
                          </div>
                          {item.prescription.rejectionReason && (
                            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                              Rejection reason: {item.prescription.rejectionReason}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ADDRESSES TAB */}
            {tab === 'addresses' && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-indigo-900/5">
                  <MapPin size={48} className="text-indigo-900/15 mb-4" />
                  <h3 className="font-serif text-2xl text-indigo-900 mb-2">No saved addresses.</h3>
                  <p className="text-indigo-900/50 text-sm">Addresses from your orders will be saved here for faster checkout.</p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
