'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-indigo-900/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-display font-bold text-sm tracking-widest uppercase text-indigo-900 group-hover:text-gold-primary transition-colors">
          {title}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-indigo-900/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm text-indigo-900/60 leading-relaxed text-pretty">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductAccordion({ description }: { description: string }) {
  return (
    <div className="w-full">
      <AccordionItem title="Description" defaultOpen>
        <p>{description}</p>
      </AccordionItem>
      <AccordionItem title="Shipping & Delivery">
        <ul className="list-disc pl-4 space-y-2">
          <li><strong>Free Global Shipping</strong> via Shiprocket (India) & Shippo (US) on all orders.</li>
          <li>Standard delivery times are 3-5 business days for domestic, and 7-10 days for international.</li>
          <li>All shipments are fully insured and tracked.</li>
        </ul>
      </AccordionItem>
      <AccordionItem title="Returns & Exchange">
        <ul className="list-disc pl-4 space-y-2">
          <li><strong>No Questions Asked Returns</strong> within 14 days of receiving your order.</li>
          <li>Instant RMA processing via our returns portal.</li>
          <li>Original packaging must be intact for a full refund.</li>
        </ul>
      </AccordionItem>
    </div>
  );
}
