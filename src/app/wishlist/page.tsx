'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useRegionStore } from '@/store/useRegionStore';

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  pricing?: {
    US?: { amount: number; compareAtAmount?: number };
    IN?: { amount: number; compareAtAmount?: number };
  };
  frameColor?: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { openCart } = useCartStore();
  const { region } = useRegionStore();

  const fetchWishlist = async () => {
    const token = localStorage.getItem('jemy_token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);

    try {
      const res = await fetch('/api/user/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.wishlist)) {
          setItems(data.wishlist);
        }
      }
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeItem = async (productId: string) => {
    const token = localStorage.getItem('jemy_token');
    setItems(prev => prev.filter(p => p._id !== productId));

    if (token) {
      try {
        await fetch('/api/user/wishlist', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
      } catch (err) {
        console.error('Failed to remove from wishlist', err);
      }
    }
  };

  const handleAddToCart = async (product: WishlistProduct) => {
    setAddingId(product._id);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1,
          config: { frameColor: product.frameColor },
        }),
      });
      if (res.ok) {
        openCart();
      }
    } catch (err) {
      console.error('Failed to add to cart', err);
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (pricing?: WishlistProduct['pricing']) => {
    const amount = region === 'US' ? pricing?.US?.amount : pricing?.IN?.amount;
    const currency = region === 'US' ? 'USD' : 'INR';
    if (!amount) return 'Contact for price';
    return new Intl.NumberFormat(region === 'US' ? 'en-US' : 'en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEBE6] pt-[68px]">
        <Loader2 size={32} className="animate-spin text-gold-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAEBE6] pt-[68px]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-indigo-900/10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart size={14} className="text-gold-primary fill-gold-primary" />
              <p className="text-[11px] uppercase tracking-[0.15em] text-gold-primary font-semibold">Saved Items</p>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-indigo-900 leading-tight">
              My Wishlist
            </h1>
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-indigo-900/50">
            {items.length} {items.length === 1 ? 'Frame' : 'Frames'} saved
          </p>
        </div>

        {/* Not Logged In State */}
        {!isLoggedIn && items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 lg:p-20 text-center max-w-xl mx-auto border border-indigo-900/5 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gold-primary/10 flex items-center justify-center mx-auto mb-6 text-gold-primary">
              <Heart size={28} />
            </div>
            <h2 className="font-serif text-3xl text-indigo-900 mb-3">Save Your Favorites</h2>
            <p className="text-indigo-900/60 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Sign in to your account to save frames, sync your wishlist across devices, and receive updates when styles restock.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-gold-primary hover:text-indigo-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto border border-indigo-900/15 text-indigo-900 text-[11px] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:border-gold-primary hover:text-gold-primary transition-colors"
              >
                Browse Frames
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Logged In, Empty Wishlist */
          <div className="bg-white rounded-3xl p-12 lg:p-20 text-center max-w-xl mx-auto border border-indigo-900/5 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-indigo-900/5 flex items-center justify-center mx-auto mb-6 text-indigo-900/30">
              <Heart size={28} />
            </div>
            <h2 className="font-serif text-3xl text-indigo-900 mb-3">Your Wishlist is Empty</h2>
            <p className="text-indigo-900/60 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Explore our handcrafted acetate frames and titanium optical collections to curate your personalized wishlist.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-gold-primary hover:text-indigo-900 transition-colors"
            >
              Explore Collection <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {items.map((product) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white rounded-2xl border border-indigo-900/5 overflow-hidden flex flex-col hover:border-indigo-900/15 transition-all shadow-sm"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-[#F4F4F0] overflow-hidden">
                    <Link href={`/products/${product.slug}`}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-900/20 font-serif text-sm">
                          No Image
                        </div>
                      )}
                    </Link>

                    {/* Quick Remove Button */}
                    <button
                      onClick={() => removeItem(product._id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-indigo-900/50 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                      title="Remove from wishlist"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-serif text-xl text-indigo-900 group-hover:text-gold-primary transition-colors mb-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="font-mono text-sm font-semibold text-indigo-900/80 mb-6">
                        {formatPrice(product.pricing)}
                      </p>
                    </div>

                    {/* Add to Bag CTA */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product._id}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-gold-primary hover:text-indigo-900 transition-colors disabled:opacity-60"
                    >
                      {addingId === product._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag size={14} /> Add to Bag
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
