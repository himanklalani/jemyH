'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useRegionStore } from '@/store/useRegionStore';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, CheckCircle2, Tag, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Step = 'contact' | 'shipping' | 'payment';

const STEPS: { id: Step; label: string }[] = [
  { id: 'contact',  label: 'Contact' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment',  label: 'Payment' },
];

const inputCls = 'w-full bg-white border border-indigo-900/10 focus:border-gold-primary rounded-xl px-4 py-3.5 text-sm text-indigo-900 placeholder:text-indigo-900/30 outline-none transition-colors';
const labelCls = 'block text-[11px] uppercase tracking-[0.1em] font-semibold text-indigo-900/55 mb-1.5';

export default function CheckoutPage() {
  const { data: cartData, isLoading } = useCart();
  const { region } = useRegionStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep]       = useState<Step>('contact');
  const [email, setEmail]     = useState('');
  const [address, setAddress] = useState({ name: '', street: '', city: '', state: '', zip: '', country: region === 'US' ? 'US' : 'India' });
  const [coupon, setCoupon]   = useState('');
  const [discount, setDiscount] = useState<{ value: number; type: 'percentage' | 'fixed' | null }>({ value: 0, type: null });
  const [processing, setProcessing] = useState(false);
  const [error, setError]     = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAEBE6] pt-[68px]">
      <Loader2 size={28} className="animate-spin text-gold-primary" />
    </div>
  );

  const cart  = cartData?.cart;
  const items = cart?.items || [];

  if (items.length === 0 && !orderPlaced) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EAEBE6] pt-[68px] text-center px-4 space-y-4">
      <h1 className="font-serif text-4xl text-indigo-900">Your bag is empty.</h1>
      <Link href="/products" className="inline-flex items-center gap-2 bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-gold-primary hover:text-indigo-900 transition-all">
        Shop Frames <ChevronRight size={14} />
      </Link>
    </div>
  );

  const fmt = new Intl.NumberFormat(region === 'US' ? 'en-US' : 'en-IN', {
    style: 'currency', currency: region === 'US' ? 'USD' : 'INR', minimumFractionDigits: 0,
  });

  const subtotal = items.reduce((a: number, i: any) => a + i.priceSnapshot.amount * i.quantity, 0);
  const discountAmt = discount.type === 'percentage' ? subtotal * discount.value / 100 : discount.type === 'fixed' ? discount.value : 0;
  const total = Math.max(0, subtotal - discountAmt);

  const applyC = async () => {
    setError('');
    const res = await fetch('/api/checkout/coupon-validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: coupon, cartTotal: subtotal }),
    });
    const d = await res.json();
    if (d.success) setDiscount({ value: d.discountValue, type: d.discountType });
    else setError(d.message || 'Invalid coupon.');
  };

  const placeOrder = async () => {
    if (!email || !address.name || !address.street || !address.city) {
      setError('Please fill all required fields.'); return;
    }
    setProcessing(true); setError('');
    try {
      const cartId = (cart as any)?._id;
      
      const nameParts = address.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      const formattedAddress = {
        firstName,
        lastName,
        addressLine1: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.zip,
        country: address.country
      };

      const res = await fetch('/api/checkout/cod', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cartId, 
          totalAmount: total, 
          currency: region === 'US' ? 'USD' : 'INR', 
          couponCode: discountAmt > 0 ? coupon : undefined, 
          shippingAddress: formattedAddress, 
          billingAddress: formattedAddress, 
          customerEmail: email 
        }),
      });
      const d = await res.json();
      if (d.success) {
        setOrderPlaced(true);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
      else setError(d.message || 'Order failed.');
    } catch { setError('Something went wrong.'); }
    finally { setProcessing(false); }
  };

  if (orderPlaced) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EAEBE6] pt-[68px] px-4 text-center space-y-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-100">
        <CheckCircle2 size={40} className="text-green-500" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-[11px] uppercase tracking-[0.15em] text-gold-primary font-semibold mb-2">Order Confirmed</p>
        <h1 className="font-serif text-5xl text-indigo-900 mb-3">Thank you.</h1>
        <p className="text-indigo-900/55 max-w-md mx-auto">A confirmation email has been sent to <span className="font-semibold text-indigo-900">{email}</span>. We'll notify you when your frames ship.</p>
      </motion.div>
      <Link href="/" className="inline-flex items-center gap-2 bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-gold-primary hover:text-indigo-900 transition-all">
        Return to Shop
      </Link>
    </div>
  );

  const currentIdx = STEPS.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-[#F4F4F0] pt-[68px]">

      {/* Top bar */}
      <div className="bg-[#EAEBE6] border-b border-indigo-900/8">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-[0.25em] text-gold-gradient">JEMY</Link>

          {/* Step breadcrumb */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => i < currentIdx && setStep(s.id)}
                  className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                    s.id === step ? 'text-gold-primary' :
                    i < currentIdx ? 'text-indigo-900/60 hover:text-indigo-900 cursor-pointer' :
                    'text-indigo-900/25 cursor-default'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    i < currentIdx ? 'bg-green-500 text-white' :
                    s.id === step ? 'bg-gold-primary text-indigo-950' :
                    'bg-indigo-900/10 text-indigo-900/30'
                  }`}>
                    {i < currentIdx ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight size={14} className="text-indigo-900/20" />}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-indigo-900/40 font-semibold uppercase tracking-wider">
            <Lock size={12} /> Secure
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* ─── Left: Steps ─── */}
        <div className="lg:col-span-7 space-y-6">

          {/* CONTACT */}
          <AnimatePresence mode="wait">
            {step === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="bg-white rounded-2xl border border-indigo-900/6 p-8 space-y-5">
                <h2 className="font-serif text-2xl text-indigo-900">Contact</h2>
                <div>
                  <label className={labelCls}>Email Address *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                </div>
                <button
                  onClick={() => { if (!email) { setError('Email is required.'); return; } setError(''); setStep('shipping'); }}
                  className="w-full flex items-center justify-between bg-indigo-900 text-platinum-100 px-7 py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.12em] hover:bg-gold-primary hover:text-indigo-900 transition-all"
                >
                  Continue to Shipping <ChevronRight size={16} />
                </button>
                {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
              </motion.div>
            )}

            {/* SHIPPING */}
            {step === 'shipping' && (
              <motion.div key="shipping" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="bg-white rounded-2xl border border-indigo-900/6 p-8 space-y-5">
                <h2 className="font-serif text-2xl text-indigo-900">Shipping Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Full Name *</label>
                    <input type="text" value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} placeholder="Jane Doe" className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Street Address *</label>
                    <input type="text" value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="123 Main Street, Apt 4B" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>City *</label>
                    <input type="text" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="New York" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>State / Province</label>
                    <input type="text" value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="NY" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>ZIP / Postal Code</label>
                    <input type="text" value={address.zip} onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))} placeholder="10001" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <select value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))} className={inputCls}>
                      <option value="US">United States</option>
                      <option value="India">India</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => { if (!address.name || !address.street || !address.city) { setError('Please fill all required fields.'); return; } setError(''); setStep('payment'); }}
                  className="w-full flex items-center justify-between bg-indigo-900 text-platinum-100 px-7 py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.12em] hover:bg-gold-primary hover:text-indigo-900 transition-all"
                >
                  Continue to Payment <ChevronRight size={16} />
                </button>
                {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
              </motion.div>
            )}

            {/* PAYMENT */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="bg-white rounded-2xl border border-indigo-900/6 p-8 space-y-6">
                <h2 className="font-serif text-2xl text-indigo-900">Payment</h2>

                <div className="space-y-3">
                  <div className="p-5 border-2 border-gold-primary rounded-xl bg-gold-primary/5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark mb-1">Cash on Delivery (Test Mode)</p>
                    <p className="text-sm text-indigo-900/60">Pay when your frame arrives. Temporarily enabled for all regions for testing.</p>
                  </div>
                  
                  {region === 'IN' ? (
                    <div className="p-5 border border-indigo-900/8 rounded-xl opacity-40 cursor-not-allowed">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-900/50 mb-1">Razorpay - Coming Soon</p>
                      <p className="text-sm text-indigo-900/40">UPI, NetBanking, Cards</p>
                    </div>
                  ) : (
                    <div className="p-5 border border-indigo-900/8 rounded-xl opacity-40 cursor-not-allowed">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-900/50 mb-1">Stripe - Coming Soon</p>
                      <p className="text-sm text-indigo-900/40">Credit / Debit cards, Apple Pay</p>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

                <button
                  onClick={placeOrder}
                  disabled={processing}
                  className="w-full flex items-center justify-between bg-indigo-900 text-platinum-100 px-7 py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.12em] hover:bg-gold-primary hover:text-indigo-900 transition-all disabled:opacity-60"
                >
                  <span>{processing ? 'Placing Order…' : 'Place Order'}</span>
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                </button>

                <p className="flex items-center gap-2 justify-center text-[11px] text-indigo-900/35 font-medium">
                  <Lock size={11} /> Payments processed securely
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right: Order Summary ─── */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-indigo-900/6 p-6 sticky top-24">
            <h2 className="font-serif text-xl text-indigo-900 mb-6 pb-5 border-b border-indigo-900/8">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 no-scrollbar">
              {items.map((item: any) => (
                <div key={item.product._id} className="flex gap-4">
                  <div className="relative w-16 h-16 bg-[#F4F4F0] rounded-xl overflow-hidden shrink-0">
                    {item.product.images?.[0] && (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    )}
                    <span className="absolute -top-1.5 -right-1.5 bg-indigo-900 text-platinum-100 text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-indigo-900 leading-tight truncate">{item.product.name}</p>
                    {item.prescriptionPending && <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">Rx Pending</p>}
                  </div>
                  <p className="text-sm font-semibold text-indigo-900 shrink-0">{fmt.format(item.priceSnapshot.amount * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-900/30" />
                <input
                  type="text"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="COUPON CODE"
                  className="w-full bg-[#F4F4F0] border border-indigo-900/8 focus:border-gold-primary rounded-xl px-4 py-3 pl-9 text-sm text-indigo-900 placeholder:text-indigo-900/30 outline-none font-mono tracking-widest transition-colors"
                />
              </div>
              <button onClick={applyC} className="px-4 bg-indigo-900 text-platinum-100 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-gold-primary hover:text-indigo-900 transition-all">
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-indigo-900/8 pt-5 mb-6">
              <div className="flex justify-between text-sm text-indigo-900/60"><span>Subtotal</span><span>{fmt.format(subtotal)}</span></div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm font-semibold text-green-600"><span>Discount</span><span>−{fmt.format(discountAmt)}</span></div>
              )}
              <div className="flex justify-between text-sm text-indigo-900/60"><span>Shipping</span><span className="text-green-600 font-semibold">Calculated at delivery</span></div>
            </div>

            <div className="flex justify-between items-end border-t border-indigo-900/8 pt-5">
              <span className="text-base font-semibold text-indigo-900">Total</span>
              <span className="font-serif text-3xl text-indigo-900">{fmt.format(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
