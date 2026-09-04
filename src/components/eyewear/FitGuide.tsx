import React from 'react';

interface FitGuideProps {
  frameSize: 'S' | 'M' | 'L' | 'Custom';
  dimensions?: {
    lensWidth?: number;
    bridgeWidth?: number;
    templeLength?: number;
  };
}

const FitGuide: React.FC<FitGuideProps> = ({ frameSize, dimensions }) => {
  const getFitLabel = (size: string) => {
    switch (size) {
      case 'S': return 'Narrow Fit';
      case 'M': return 'Regular Fit';
      case 'L': return 'Wide Fit';
      case 'Custom': return 'Custom Fit (Measured)';
      default: return 'Regular Fit';
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-gold-dark)] mb-6">Fit & Dimensions</h3>
      
      <div className="grid grid-cols-2 gap-8 items-center">
        {/* Visual Diagram */}
        <div className="relative aspect-[2/1] w-full border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center p-4 bg-gray-50 dark:bg-white/5">
          {/* Simple abstracted glasses vector */}
          <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[120px] stroke-[var(--color-indigo-900)] dark:stroke-white">
            <path d="M10 20C10 10 20 10 30 10C40 10 45 15 45 20C45 30 35 35 25 35C15 35 10 30 10 20Z" strokeWidth="2"/>
            <path d="M90 20C90 10 80 10 70 10C60 10 55 15 55 20C55 30 65 35 75 35C85 35 90 30 90 20Z" strokeWidth="2"/>
            <path d="M45 20C48 18 52 18 55 20" strokeWidth="2"/>
            <path d="M10 20C5 18 2 15 2 15" strokeWidth="2"/>
            <path d="M90 20C95 18 98 15 98 15" strokeWidth="2"/>
          </svg>
          
          {/* Dimension Overlays */}
          {dimensions?.lensWidth && (
            <div className="absolute top-2 left-[30%] text-[10px] text-gray-500 font-mono">{dimensions.lensWidth}</div>
          )}
          {dimensions?.bridgeWidth && (
            <div className="absolute top-2 left-[50%] -translate-x-1/2 text-[10px] text-gray-500 font-mono">{dimensions.bridgeWidth}</div>
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Fit</p>
            <p className="font-serif text-xl text-[var(--color-indigo-900)] dark:text-white">{getFitLabel(frameSize)}</p>
          </div>
          
          {dimensions && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Measurements</p>
              <p className="font-mono text-sm text-[var(--color-indigo-900)] dark:text-white bg-gray-100 dark:bg-white/10 py-1 px-3 rounded inline-block">
                {dimensions.lensWidth || '00'} - {dimensions.bridgeWidth || '00'} - {dimensions.templeLength || '000'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FitGuide;
