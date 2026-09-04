'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface RxData {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
}

interface PrescriptionInputStepProps {
  config: any;
  setConfig: (config: any) => void;
}

const PrescriptionInputStep: React.FC<PrescriptionInputStepProps> = ({ config, setConfig }) => {
  const [savedPrescriptions, setSavedPrescriptions] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [hasCyl, setHasCyl] = useState(false);
  const [samePower, setSamePower] = useState(false);

  // Generate dropdown options
  const sphOptions = Array.from({ length: 129 }, (_, i) => (i * -0.25 + 12).toFixed(2));
  const cylOptions = Array.from({ length: 49 }, (_, i) => (i * -0.25 + 6).toFixed(2));
  const addOptions = Array.from({ length: 13 }, (_, i) => (i * 0.25).toFixed(2));

  useEffect(() => {
    // Fetch saved prescriptions if user is logged in
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('jemy_token');
        if (!token) {
          setLoadingSaved(false);
          return;
        }
        const res = await fetch('/api/user/prescriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSavedPrescriptions(data.prescriptions || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch prescriptions", error);
      } finally {
        setLoadingSaved(false);
      }
    };
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (samePower && config.rxData?.od) {
      setConfig({
        ...config,
        rxData: {
          ...config.rxData,
          os: { ...config.rxData.od }
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samePower]);

  const handleManualChange = (eye: 'od' | 'os', field: keyof RxData, value: string) => {
    const newRxData = { ...config.rxData };
    newRxData[eye] = { ...newRxData[eye], [field]: value };
    
    if (samePower && eye === 'od') {
      newRxData['os'] = { ...newRxData['os'], [field]: value };
    }
    
    setConfig({ ...config, rxData: newRxData, prescriptionMethod: 'manual' });
  };

  const handlePdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, pd: e.target.value, prescriptionMethod: 'manual' });
  };

  const selectSaved = (id: string) => {
    setConfig({ ...config, prescriptionMethod: 'saved', savedPrescriptionId: id });
  };

  return (
    <div className="space-y-8">
      {/* Saved Prescriptions Section */}
      {!loadingSaved && savedPrescriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-gold-dark)] mb-4">Saved Prescriptions</h3>
          <div className="grid grid-cols-1 gap-3">
            {savedPrescriptions.map((rx) => (
              <button
                key={rx._id}
                onClick={() => selectSaved(rx._id)}
                className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden flex items-center justify-between
                  ${config.savedPrescriptionId === rx._id 
                    ? 'border-[var(--color-gold-primary)] bg-[var(--color-gold-primary)]/5 dark:bg-[var(--color-gold-primary)]/10' 
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 bg-gray-50 dark:bg-white/5'
                  }`}
              >
                <div>
                  <p className="font-bold text-[var(--color-indigo-900)] dark:text-white">{rx.doctorName || 'Prescription'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    OD: SPH {rx.od?.sphere} | OS: SPH {rx.os?.sphere}
                  </p>
                </div>
                {config.savedPrescriptionId === rx._id && (
                  <div className="w-6 h-6 rounded-full bg-[var(--color-gold-primary)] flex items-center justify-center text-white">
                    <Check size={14} />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
            <span className="px-4 text-xs font-medium text-gray-400 uppercase tracking-widest">OR ENTER MANUALLY</span>
            <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      <div className={`transition-opacity duration-300 ${config.prescriptionMethod === 'saved' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-gold-dark)] mb-6">Manual Entry</h3>
        
        <div className="flex flex-wrap gap-6 mb-6">
          <label className="flex items-center gap-2 text-sm text-[var(--color-indigo-900)] dark:text-white cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-[var(--color-gold-primary)] w-4 h-4"
              checked={hasCyl}
              onChange={(e) => setHasCyl(e.target.checked)}
            />
            I have cylinder (astigmatism) power
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-indigo-900)] dark:text-white cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-[var(--color-gold-primary)] w-4 h-4"
              checked={samePower}
              onChange={(e) => setSamePower(e.target.checked)}
            />
            Both eyes have the same power
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 text-sm font-medium text-gray-500 w-1/4">Eye</th>
                <th className="pb-3 text-sm font-medium text-gray-500 w-1/4">SPH</th>
                {hasCyl && <th className="pb-3 text-sm font-medium text-gray-500 w-1/4">CYL</th>}
                {hasCyl && <th className="pb-3 text-sm font-medium text-gray-500 w-1/4">AXIS</th>}
                <th className="pb-3 text-sm font-medium text-gray-500 w-1/4">ADD</th>
              </tr>
            </thead>
            <tbody>
              {/* Right Eye (OD) */}
              <tr className="border-b border-gray-100 dark:border-white/5">
                <td className="py-4 font-medium text-[var(--color-indigo-900)] dark:text-white">Right (OD)</td>
                <td className="py-4 pr-2">
                  <select 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white"
                    value={config.rxData?.od?.sph || ''}
                    onChange={(e) => handleManualChange('od', 'sph', e.target.value)}
                  >
                    <option value="" className="text-gray-900 bg-white">Select</option>
                    {sphOptions.map(opt => <option key={opt} value={opt} className="text-gray-900 bg-white">{Number(opt) > 0 ? `+${opt}` : opt}</option>)}
                  </select>
                </td>
                {hasCyl && (
                  <>
                    <td className="py-4 pr-2">
                      <select 
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white"
                        value={config.rxData?.od?.cyl || ''}
                        onChange={(e) => handleManualChange('od', 'cyl', e.target.value)}
                      >
                        <option value="" className="text-gray-900 bg-white">Select</option>
                        {cylOptions.map(opt => <option key={opt} value={opt} className="text-gray-900 bg-white">{Number(opt) > 0 ? `+${opt}` : opt}</option>)}
                      </select>
                    </td>
                    <td className="py-4 pr-2">
                      <input 
                        type="number" 
                        min="1" max="180"
                        placeholder="1-180"
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white"
                        value={config.rxData?.od?.axis || ''}
                        onChange={(e) => handleManualChange('od', 'axis', e.target.value)}
                      />
                    </td>
                  </>
                )}
                <td className="py-4 pr-2">
                  <select 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white"
                    value={config.rxData?.od?.add || ''}
                    onChange={(e) => handleManualChange('od', 'add', e.target.value)}
                  >
                    <option value="" className="text-gray-900 bg-white">Select</option>
                    {addOptions.map(opt => <option key={opt} value={opt} className="text-gray-900 bg-white">+{opt}</option>)}
                  </select>
                </td>
              </tr>

              {/* Left Eye (OS) */}
              <tr className="border-b border-gray-100 dark:border-white/5">
                <td className="py-4 font-medium text-[var(--color-indigo-900)] dark:text-white">Left (OS)</td>
                <td className="py-4 pr-2">
                  <select 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white"
                    value={config.rxData?.os?.sph || ''}
                    onChange={(e) => handleManualChange('os', 'sph', e.target.value)}
                    disabled={samePower}
                  >
                    <option value="" className="text-gray-900 bg-white">Select</option>
                    {sphOptions.map(opt => <option key={opt} value={opt} className="text-gray-900 bg-white">{Number(opt) > 0 ? `+${opt}` : opt}</option>)}
                  </select>
                </td>
                {hasCyl && (
                  <>
                    <td className="py-4 pr-2">
                      <select 
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white"
                        value={config.rxData?.os?.cyl || ''}
                        onChange={(e) => handleManualChange('os', 'cyl', e.target.value)}
                        disabled={samePower}
                      >
                        <option value="" className="text-gray-900 bg-white">Select</option>
                        {cylOptions.map(opt => <option key={opt} value={opt} className="text-gray-900 bg-white">{Number(opt) > 0 ? `+${opt}` : opt}</option>)}
                      </select>
                    </td>
                    <td className="py-4 pr-2">
                      <input 
                        type="number" 
                        min="1" max="180"
                        placeholder="1-180"
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white disabled:opacity-50"
                        value={config.rxData?.os?.axis || ''}
                        onChange={(e) => handleManualChange('os', 'axis', e.target.value)}
                        disabled={samePower}
                      />
                    </td>
                  </>
                )}
                <td className="py-4 pr-2">
                  <select 
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white disabled:opacity-50"
                    value={config.rxData?.os?.add || ''}
                    onChange={(e) => handleManualChange('os', 'add', e.target.value)}
                    disabled={samePower}
                  >
                    <option value="" className="text-gray-900 bg-white">Select</option>
                    {addOptions.map(opt => <option key={opt} value={opt} className="text-gray-900 bg-white">+{opt}</option>)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pupillary Distance (PD) - in mm</label>
          <input 
            type="number" 
            min="50"
            max="80"
            placeholder="e.g. 64"
            className="w-full md:w-1/3 p-3 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-[var(--color-indigo-900)] dark:text-white"
            value={config.pd || ''}
            onChange={handlePdChange}
          />
          <p className="text-xs text-gray-500 mt-2">Required for accurate lens alignment.</p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionInputStep;
