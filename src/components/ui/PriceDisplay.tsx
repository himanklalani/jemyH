'use client';

import { useRegionStore } from '@/store/useRegionStore';

interface PriceDisplayProps {
  pricing: {
    US?: { amount: number; currency: string; compareAtAmount?: number };
    IN?: { amount: number; currency: string; compareAtAmount?: number };
  };
  className?: string;
}

export default function PriceDisplay({ pricing, className = '' }: PriceDisplayProps) {
  const { region } = useRegionStore();

  const priceData = pricing[region];

  if (!priceData) return <span className={className}>Price unavailable</span>;

  const { amount, currency, compareAtAmount } = priceData;

  const formatter = new Intl.NumberFormat(region === 'US' ? 'en-US' : 'en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-semibold text-indigo-900 dark:text-platinum-100">
        {formatter.format(amount)}
      </span>
      {compareAtAmount && compareAtAmount > amount && (
        <span className="text-sm text-gray-500 line-through decoration-gray-400">
          {formatter.format(compareAtAmount)}
        </span>
      )}
    </div>
  );
}
