'use client';

export type ProductType = 'Powered Eyeglass' | 'Zero Power' | 'Reading Glasses';

interface Props {
  selectedType: ProductType;
  onChange: (type: ProductType) => void;
}

const TYPES: { id: ProductType; subtitle: string }[] = [
  { id: 'Powered Eyeglass', subtitle: 'With Power' },
  { id: 'Zero Power', subtitle: 'Screen Glass' },
  { id: 'Reading Glasses', subtitle: '+ Positive Power' },
];

export default function ProductTypeSelector({ selectedType, onChange }: Props) {
  return (
    <div className="mb-8">
      <h3 className="font-display font-bold text-xl text-indigo-900 mb-4">Product Type</h3>
      <div className="grid grid-cols-3 gap-2 w-full">
        {TYPES.map((type) => {
          const isActive = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border-2 transition-all duration-300 min-w-0 ${
                isActive 
                  ? 'border-indigo-900 bg-white text-indigo-900 shadow-sm' 
                  : 'border-indigo-900/10 bg-white/50 text-indigo-900/60 hover:border-indigo-900/30'
              }`}
            >
              <span className="text-[11px] sm:text-[13px] font-bold tracking-wide leading-tight text-center break-words w-full">{type.id}</span>
              <span className={`text-[9px] sm:text-[10px] mt-0.5 text-center leading-tight ${
                isActive ? 'text-indigo-900/60' : 'text-indigo-900/40'
              }`}>
                {type.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
