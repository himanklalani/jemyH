'use client';

import { Plus, Package, Droplets, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const ADDONS = [
  { id: 'cleaning-kit', name: 'Anti-Fog Cleaning Kit', price: 15, icon: Droplets, desc: 'Premium microfiber cloth and anti-fog spray.' },
  { id: 'hard-case', name: 'Premium Leather Hard Case', price: 25, icon: Package, desc: 'Maximum protection for your opticals.' },
  { id: 'warranty', name: '1-Year Lens Protection', price: 35, icon: Shield, desc: 'Covers accidental scratches and breaks.' },
];

export default function CartAddons({ onAdd }: { onAdd: (addonId: string, price: number) => void }) {
  return (
    <div className="mt-8 border-t border-gray-100 dark:border-white/10 pt-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-indigo-900)] dark:text-white">Complete Your Care</h3>
          <p className="text-xs text-gray-500 mt-1">Recommended add-ons for your eyewear.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
        {ADDONS.map((addon, i) => (
          <motion.div 
            key={addon.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[240px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4 rounded-2xl snap-start flex flex-col group hover:border-[var(--color-gold-primary)] transition-colors"
          >
            <div className="w-10 h-10 bg-white dark:bg-[var(--color-indigo-950)] rounded-full flex items-center justify-center mb-3 text-[var(--color-gold-primary)] shadow-sm">
              <addon.icon size={18} />
            </div>
            <h4 className="text-sm font-bold text-[var(--color-indigo-900)] dark:text-white mb-1">{addon.name}</h4>
            <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-4">{addon.desc}</p>
            
            <button 
              onClick={() => onAdd(addon.id, addon.price)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-[var(--color-indigo-950)] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-[var(--color-indigo-900)] dark:text-white hover:text-[var(--color-gold-dark)] dark:hover:text-[var(--color-gold-primary)] transition-colors"
            >
              <Plus size={14} /> ADD • ${addon.price}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
