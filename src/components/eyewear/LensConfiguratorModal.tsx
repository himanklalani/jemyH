'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Eye, Sparkles, Activity } from 'lucide-react';
import PrescriptionInputStep from './PrescriptionInputStep';

interface LensConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (config: any) => void;
  productName: string;
}

export default function LensConfiguratorModal({ isOpen, onClose, onAddToCart, productName }: LensConfiguratorModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<any>({
    powerType: null, // 'with-power', 'zero-power', 'frame-only'
    lensPackage: null, // 'essential', 'anti-glare-pro', 'blue-cut-ultra'
    prescriptionMethod: null, // 'manual', 'saved', 'upload', 'later'
    pd: '',
    rxData: {
      od: { sph: '', cyl: '', axis: '', add: '' },
      os: { sph: '', cyl: '', axis: '', add: '' }
    },
    savedPrescriptionId: null
  });

  const POWER_TYPES = [
    { id: 'with-power', label: 'With Power', desc: 'For nearsighted, farsighted, or astigmatism.' },
    { id: 'zero-power', label: 'Zero Power', desc: 'Fashion or computer glasses, no vision correction.' },
    { id: 'frame-only', label: 'Frame Only', desc: 'No lenses, just the frame itself.' }
  ];

  const LENS_PACKAGES = [
    { id: 'essential', label: 'Essential', price: '+₹500', desc: 'Standard CR-39 lenses, 100% UV protection, scratch resistant.' },
    { id: 'anti-glare-pro', label: 'Anti-Glare Pro', price: '+₹1500', desc: 'Anti-reflective coating, reduces glare from screens & headlights.' },
    { id: 'blue-cut-ultra', label: 'Blue-Cut Ultra', price: '+₹2500', desc: 'Premium blue light filter, multi-coat water repellent, ultra thin.' }
  ];

  const handleNext = () => {
    if (step === 1 && config.powerType === 'frame-only') {
      handleComplete(); // Skip directly to cart
    } else if (step === 2 && config.powerType === 'zero-power') {
      handleComplete(); // No Rx needed, add to cart!
    } else {
      setStep(s => (s + 1) as 1|2|3);
    }
  };

  const handlePrev = () => setStep(s => (s - 1) as 1|2|3);
  
  const handleComplete = () => {
    const mappedLensType = config.powerType === 'zero-power' ? 'non-prescription' : config.powerType === 'with-power' ? 'single-vision' : null;
    const mappedCoatings = config.lensPackage ? [config.lensPackage] : [];
    onAddToCart({ ...config, lensType: mappedLensType, coatings: mappedCoatings });
    onClose();
    setTimeout(() => {
      setStep(1);
      setConfig({ powerType: null, lensPackage: null, prescriptionMethod: null, rxData: { od: {}, os: {} } });
    }, 500);
  };

  const handleFinalCheckoutStep = () => {
    if (config.powerType === 'zero-power') {
      handleComplete(); // No Rx needed
    } else {
      handleComplete(); // Has Rx data now
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--color-indigo-950)]/80 backdrop-blur-md"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-3xl bg-white dark:bg-[var(--color-indigo-950)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5 relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold-dark)] mb-1">Optical Configuration</p>
                <h3 className="font-serif text-xl text-[var(--color-indigo-900)] dark:text-white">{productName}</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 bg-white dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors border border-gray-200 dark:border-white/5">
                <X size={18} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex h-1 bg-gray-100 dark:bg-white/5 relative z-10">
              <motion.div 
                className="h-full bg-[var(--color-gold-primary)]"
                initial={{ width: '33.33%' }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {/* Main Content Area */}
            <div className="p-6 md:p-10 flex-1 overflow-y-auto relative bg-white dark:bg-transparent">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: POWER TYPE */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-serif text-[var(--color-indigo-900)] dark:text-white mb-2 flex items-center gap-3">
                        <Eye className="text-[var(--color-gold-primary)]" /> Select Power Type
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Choose the type of optical correction you need.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {POWER_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setConfig({ ...config, powerType: type.id })}
                          className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between
                            ${config.powerType === type.id 
                              ? 'border-[var(--color-gold-primary)] bg-[var(--color-gold-primary)]/5 dark:bg-[var(--color-gold-primary)]/10 shadow-lg' 
                              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
                            }`}
                        >
                          <div>
                            <h4 className={`text-lg font-bold mb-1 ${config.powerType === type.id ? 'text-[var(--color-gold-dark)]' : 'text-[var(--color-indigo-900)] dark:text-white'}`}>{type.label}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{type.desc}</p>
                          </div>
                          
                          <div className={`mt-4 md:mt-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${config.powerType === type.id ? 'border-[var(--color-gold-primary)]' : 'border-gray-300 dark:border-gray-600'}
                          `}>
                            {config.powerType === type.id && <div className="w-3 h-3 rounded-full bg-[var(--color-gold-primary)]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: LENS PACKAGES */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-serif text-[var(--color-indigo-900)] dark:text-white mb-2 flex items-center gap-3">
                        <Sparkles className="text-[var(--color-gold-primary)]" /> Select Lens Package
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Choose the lens quality and protective coatings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {LENS_PACKAGES.map(pkg => (
                        <button
                          key={pkg.id}
                          onClick={() => setConfig({ ...config, lensPackage: pkg.id })}
                          className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col
                            ${config.lensPackage === pkg.id
                              ? 'border-[var(--color-gold-primary)] bg-[var(--color-gold-primary)]/5 dark:bg-[var(--color-gold-primary)]/10 shadow-lg' 
                              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
                            }`}
                        >
                          <h4 className={`text-lg font-bold mb-2 ${config.lensPackage === pkg.id ? 'text-[var(--color-gold-dark)]' : 'text-[var(--color-indigo-900)] dark:text-white'}`}>{pkg.label}</h4>
                          <span className="text-sm font-bold text-[var(--color-indigo-900)] dark:text-white mb-4 bg-gray-200/50 dark:bg-white/10 self-start px-2 py-1 rounded">{pkg.price}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-auto">{pkg.desc}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: RX ENTRY */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-serif text-[var(--color-indigo-900)] dark:text-white mb-2 flex items-center gap-3">
                        <Activity className="text-[var(--color-gold-primary)]" /> Prescription Details
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Provide your optical measurements.</p>
                    </div>

                    <PrescriptionInputStep config={config} setConfig={setConfig} />
                  </motion.div>
                )}
                
              </AnimatePresence>
            </div>

            {/* Footer / Navigation */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex justify-between items-center relative z-10">
              {step > 1 ? (
                <button 
                  onClick={handlePrev}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft size={18} /> Back
                </button>
              ) : (
                <div /> // Spacer
              )}

              {step < 3 && config.powerType !== 'frame-only' && config.powerType !== 'zero-power' ? (
                <button 
                  onClick={handleNext}
                  disabled={(step === 1 && !config.powerType) || (step === 2 && !config.lensPackage)}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-[var(--color-indigo-900)] dark:bg-white text-white dark:text-[var(--color-indigo-900)] hover:bg-[var(--color-gold-primary)] dark:hover:bg-[var(--color-gold-primary)] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleFinalCheckoutStep}
                  disabled={
                    (step === 1 && !config.powerType) || 
                    (step === 2 && !config.lensPackage && config.powerType === 'zero-power') ||
                    (step === 3 && config.prescriptionMethod === 'manual' && (!config.rxData.od.sph && !config.pd))
                  }
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-[var(--color-gold-primary)] text-white hover:bg-[var(--color-gold-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
