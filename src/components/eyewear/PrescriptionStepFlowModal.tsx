'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Eye, UploadCloud, Layers } from 'lucide-react';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (config: any) => void;
  productName: string;
}

export default function PrescriptionStepFlowModal({ isOpen, onClose, onAddToCart, productName }: PrescriptionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<any>({
    lensType: null,
    coatings: [],
    prescriptionMethod: null,
    pd: '',
    rxData: {
      od: { sph: '', cyl: '', axis: '', add: '' },
      os: { sph: '', cyl: '', axis: '', add: '' }
    },
    rxFile: null
  });

  const LENS_TYPES = [
    { id: 'single-vision', label: 'Single Vision', price: '$30', desc: 'For distance or reading. Single corrective power.' },
    { id: 'progressive', label: 'Progressive', price: '$120', desc: 'Multifocal without lines. Seamless transition.' },
    { id: 'non-prescription', label: 'Non-Prescription', price: '$0', desc: 'Fashion lenses. No vision correction.' }
  ];

  const COATINGS = [
    { id: 'blue-light', label: 'Blue Light Filter', price: '$20', desc: 'Reduces digital eye strain.' },
    { id: 'anti-reflective', label: 'Anti-Reflective', price: '$15', desc: 'Minimizes glare from screens and headlights.' }
  ];

  const handleNext = () => setStep(s => (s + 1) as 1|2|3);
  const handlePrev = () => setStep(s => (s - 1) as 1|2|3);
  
  const handleComplete = () => {
    onAddToCart(config);
    onClose();
    // Reset after animation
    setTimeout(() => {
      setStep(1);
      setConfig({ lensType: null, coatings: [], prescriptionMethod: null, rxData: {} });
    }, 500);
  };

  const toggleCoating = (id: string) => {
    setConfig((prev: any) => ({
      ...prev,
      coatings: prev.coatings.includes(id) 
        ? prev.coatings.filter((c: string) => c !== id)
        : [...prev.coatings, id]
    }));
  };

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
                
                {/* STEP 1: LENS TYPE */}
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
                        <Eye className="text-[var(--color-gold-primary)]" /> Select Lens Type
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Choose the type of optical correction you need.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {LENS_TYPES.map(lens => (
                        <button
                          key={lens.id}
                          onClick={() => setConfig({ ...config, lensType: lens.id })}
                          className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden
                            ${config.lensType === lens.id 
                              ? 'border-[var(--color-gold-primary)] bg-[var(--color-gold-primary)]/5 dark:bg-[var(--color-gold-primary)]/10 shadow-lg' 
                              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className={`text-lg font-bold ${config.lensType === lens.id ? 'text-[var(--color-gold-dark)]' : 'text-[var(--color-indigo-900)] dark:text-white'}`}>{lens.label}</h4>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{lens.desc}</p>
                          <p className="text-sm font-bold text-[var(--color-indigo-900)] dark:text-white mt-auto">{lens.price}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: COATINGS */}
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
                        <Layers className="text-[var(--color-gold-primary)]" /> Lens Treatments
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Enhance your lenses with premium coatings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {COATINGS.map(c => (
                        <button
                          key={c.id}
                          onClick={() => toggleCoating(c.id)}
                          className={`p-6 rounded-2xl border-2 text-left transition-all duration-300
                            ${config.coatings.includes(c.id)
                              ? 'border-[var(--color-gold-primary)] bg-[var(--color-gold-primary)]/5 dark:bg-[var(--color-gold-primary)]/10' 
                              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`text-lg font-bold ${config.coatings.includes(c.id) ? 'text-[var(--color-gold-dark)]' : 'text-[var(--color-indigo-900)] dark:text-white'}`}>{c.label}</h4>
                            <span className="text-sm font-bold text-[var(--color-indigo-900)] dark:text-white">{c.price}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{c.desc}</p>
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
                        <Layers className="text-[var(--color-gold-primary)]" /> Provide Prescription
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Select a saved prescription or enter values manually.</p>
                    </div>

                    {config.lensType === 'non-prescription' ? (
                      <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <p className="text-[var(--color-indigo-900)] dark:text-white font-serif text-lg mb-2">No prescription needed.</p>
                        <p className="text-gray-500 text-sm">You selected Non-Prescription lenses. You are ready to add to cart!</p>
                      </div>
                    ) : (
                        <div className="pt-2">
                          <p className="text-sm font-bold text-[var(--color-indigo-900)] dark:text-white mb-2">Pupillary Distance (PD)</p>
                          <input 
                            type="number" 
                            placeholder="e.g. 62" 
                            value={config.pd}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, pd: e.target.value, prescriptionMethod: 'manual' }))}
                            className="w-full md:w-1/3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[var(--color-indigo-900)] dark:text-white outline-none focus:border-[var(--color-gold-primary)] focus:ring-1 focus:ring-[var(--color-gold-primary)] mb-6 transition-all" 
                          />
                          
                          <p className="text-sm font-bold text-[var(--color-indigo-900)] dark:text-white mb-2">Prescription (Rx)</p>
                          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                                  <th className="p-4 font-semibold border-b border-gray-200 dark:border-white/10">Eye</th>
                                  <th className="p-4 font-semibold border-b border-gray-200 dark:border-white/10">SPH</th>
                                  <th className="p-4 font-semibold border-b border-gray-200 dark:border-white/10">CYL</th>
                                  <th className="p-4 font-semibold border-b border-gray-200 dark:border-white/10">AXIS</th>
                                  <th className="p-4 font-semibold border-b border-gray-200 dark:border-white/10">ADD</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-transparent">
                                {['od', 'os'].map((eye) => (
                                  <tr key={eye} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                                    <td className="p-4 text-xs font-bold uppercase tracking-wider text-[var(--color-indigo-900)] dark:text-white">
                                      {eye === 'od' ? 'OD (Right)' : 'OS (Left)'}
                                    </td>
                                    {['sph', 'cyl', 'axis', 'add'].map((field) => (
                                      <td key={field} className="p-2">
                                        <input 
                                          type="text" 
                                          placeholder="0.00"
                                          value={config.rxData[eye][field]}
                                          onChange={(e) => {
                                            setConfig((prev: any) => ({
                                              ...prev,
                                              prescriptionMethod: 'manual',
                                              rxData: {
                                                ...prev.rxData,
                                                [eye]: {
                                                  ...prev.rxData[eye],
                                                  [field]: e.target.value
                                                }
                                              }
                                            }));
                                          }}
                                          className="w-full bg-gray-50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-md px-3 py-2 text-sm text-[var(--color-indigo-900)] dark:text-white outline-none focus:border-[var(--color-gold-primary)] focus:bg-white transition-all text-center placeholder-gray-300 dark:placeholder-gray-600 font-mono" 
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[var(--color-indigo-950)] relative z-10">
              <button 
                onClick={handlePrev} 
                disabled={step === 1}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[var(--color-indigo-900)] dark:hover:text-white transition-colors disabled:opacity-0 disabled:pointer-events-none"
              >
                <ArrowLeft size={16} /> BACK
              </button>

              <button 
                onClick={step === 3 ? handleComplete : handleNext}
                disabled={step === 1 && !config.lensType}
                className="flex items-center gap-2 bg-[var(--color-indigo-900)] dark:bg-[var(--color-gold-primary)] text-white dark:text-[var(--color-indigo-950)] px-8 py-3.5 rounded-xl font-bold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              >
                {step === 3 ? 'ADD TO CART' : 'NEXT STEP'} <ArrowRight size={16} />
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
