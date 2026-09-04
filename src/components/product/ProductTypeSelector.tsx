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
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 hide-scrollbar">
        {TYPES.map((type) => {
          const isActive = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={`shrink-0 flex flex-col items-center justify-center px-6 py-3 rounded-full border-2 transition-all duration-300 ${
                isActive 
                  ? 'border-indigo-900 bg-white text-indigo-900 shadow-sm' 
                  : 'border-indigo-900/10 bg-white/50 text-indigo-900/60 hover:border-indigo-900/30'
              }`}
            >
              <span className="text-[13px] font-bold tracking-wide">{type.id}</span>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-indigo-900/60' : 'text-indigo-900/40'}`}>
                {type.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
