'use client';

import { useCartStore } from '@/store/useCartStore';
import { useRegionStore } from '@/store/useRegionStore';
import { useCart, useUpdateCartQuantity, useRemoveFromCart } from '@/hooks/useCart';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function CartDrawer() {
  const { isOpen, closeCart } = useCartStore();
  const { region } = useRegionStore();
  const { data: cartData, isLoading } = useCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveFromCart();
  const queryClient = useQueryClient();

  const [addons, setAddons] = useState<any[]>([]);
  const [addingAddon, setAddingAddon] = useState<string | null>(null);
  const [addingMembership, setAddingMembership] = useState(false);
  const [membershipActive, setMembershipActive] = useState(false); // Can be derived from user context

  const cartItems = cartData?.cart?.items || [];
  const itemCount = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc: number, item: any) => acc + (item.priceSnapshot.amount * item.quantity), 0);

  // Determine if membership is already in cart
  const membershipInCart = cartItems.some((item: any) => item.product.slug === 'jemy-atelier-membership');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Fetch addons
      fetch('/api/products/addons')
        .then(res => res.json())
        .then(data => {
          if (data.success) setAddons(data.addons);
        })
        .catch(console.error);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleUpdateQuantity = (productId: string, newQty: number, stock: number) => {
    if (newQty < 1) return removeItem.mutate(productId);
    if (newQty > stock) return; 
    updateQuantity.mutate({ productId, quantity: newQty });
  };

  const addAddonToCart = async (addon: any) => {
    setAddingAddon(addon._id);
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: addon._id, quantity: 1 }),
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } finally {
      setAddingAddon(null);
    }
  };

  const addMembership = async () => {
    setAddingMembership(true);
    try {
      await fetch('/api/cart/membership', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } finally {
      setAddingMembership(false);
    }
  };

  const currencyFormatter = new Intl.NumberFormat(region === 'US' ? 'en-US' : 'en-IN', {
    style: 'currency',
    currency: region === 'US' ? 'USD' : 'INR',
    minimumFractionDigits: region === 'US' ? 2 : 0,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-indigo-950/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] bg-[#F9F9F8] shadow-2xl dark:bg-indigo-900 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-indigo-900/10 p-5 dark:border-platinum-100/10 bg-white dark:bg-indigo-950 z-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-indigo-900)] dark:text-white">
                Your Bag ({itemCount})
              </h2>
              <button
                onClick={closeCart}
                className="rounded-full p-2 text-indigo-900/50 hover:bg-platinum-200 hover:text-indigo-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items Area */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-900 border-t-transparent" />
                </div>
              ) : cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <ShoppingBag size={48} className="text-indigo-900/20" />
                  <p className="text-indigo-900 font-medium">Your bag is empty.</p>
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-6">
                  {cartItems.map((item: any) => (
                    <div key={item.product._id} className="flex gap-4">
                      {/* Thumbnail */}
                      <Link href={`/products/${item.product.slug}`} onClick={closeCart} className="relative h-28 w-24 shrink-0 bg-white rounded-xl overflow-hidden shadow-sm border border-black/5">
                        <Image
                          src={item.product.images[0] || '/placeholder.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-cover object-center"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-serif font-bold text-lg text-indigo-900">
                              {item.product.name}
                            </h3>
                            <span className="font-semibold text-indigo-900">
                              {currencyFormatter.format(item.priceSnapshot.amount * item.quantity)}
                            </span>
                          </div>
                          
                          {/* Composite Optical Info */}
                          {item.lensType && (
                            <div className="mt-1 text-xs text-gray-500 leading-relaxed">
                              <p><span className="font-medium text-indigo-900/70">Lens:</span> {item.lensType}</p>
                              {item.rxData?.od?.sph && (
                                <p><span className="font-medium text-indigo-900/70">Rx:</span> R {item.rxData.od.sph} / L {item.rxData.os.sph} {item.pd ? `· PD ${item.pd}` : ''}</p>
                              )}
                            </div>
                          )}

                          {item.prescriptionPending && (
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded">
                              Prescription Pending
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-indigo-900/20 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1, item.product.stock)}
                              className="p-2 text-indigo-900/60 hover:text-indigo-900 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-indigo-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1, item.product.stock)}
                              disabled={item.quantity >= item.product.stock}
                              className="p-2 text-indigo-900/60 hover:text-indigo-900 transition-colors disabled:opacity-30"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem.mutate(item.product._id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upsells Section */}
              {cartItems.length > 0 && (
                <div className="mt-auto border-t border-gray-200">
                  
                  {/* Membership Banner */}
                  {!membershipActive && !membershipInCart && (
                    <div className="p-5 bg-gradient-to-r from-indigo-900 to-indigo-950 text-white m-4 rounded-2xl shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle2 size={64} />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold-primary)] mb-1">Jemy Atelier</h4>
                      <p className="font-serif text-lg leading-tight mb-2">Add Membership & Save Instantly</p>
                      <p className="text-xs text-white/70 mb-4 max-w-[200px]">Get 30% off lenses today and for the next 12 months. Just {region === 'US' ? '$99' : '₹999'}/year.</p>
                      <button 
                        onClick={addMembership}
                        disabled={addingMembership}
                        className="bg-white text-indigo-900 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-[var(--color-gold-primary)] hover:text-white transition-colors"
                      >
                        {addingMembership ? 'Adding...' : 'Add to Order'}
                      </button>
                    </div>
                  )}

                  {/* 1-Click Add-ons */}
                  {addons.length > 0 && (
                    <div className="px-5 pb-5">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-900/50 mb-3">Complete Your Care</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                        {addons.map(addon => (
                          <div key={addon._id} className="snap-start shrink-0 w-[140px] bg-white border border-gray-100 rounded-xl p-3 flex flex-col justify-between">
                            <div className="relative h-16 w-full mb-2 bg-gray-50 rounded-lg overflow-hidden">
                               <Image src={addon.images[0] || '/placeholder.jpg'} alt={addon.name} fill className="object-cover" />
                            </div>
                            <p className="text-[10px] font-bold text-indigo-900 leading-tight mb-1">{addon.name}</p>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-xs text-gray-500 font-mono">{currencyFormatter.format(addon.pricing?.[region]?.amount || 0)}</span>
                              <button 
                                onClick={() => addAddonToCart(addon)}
                                disabled={addingAddon === addon._id}
                                className="w-6 h-6 bg-indigo-50 text-indigo-900 rounded-full flex items-center justify-center hover:bg-indigo-900 hover:text-white transition-colors"
                              >
                                {addingAddon === addon._id ? <div className="w-3 h-3 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" /> : <Plus size={12} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-5 bg-white z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                <div className="mb-4 flex justify-between items-center text-indigo-900">
                  <span className="font-bold">Subtotal</span>
                  <span className="font-mono text-xl font-bold tracking-tight">
                    {currencyFormatter.format(subtotal)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex w-full items-center justify-center rounded-xl bg-indigo-900 px-6 py-4 text-xs font-bold tracking-widest text-white uppercase hover:bg-[var(--color-gold-primary)] hover:scale-[1.02] transition-all"
                >
                  Proceed to Checkout
                </Link>
                <p className="mt-3 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                  Shipping & taxes calculated next
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
