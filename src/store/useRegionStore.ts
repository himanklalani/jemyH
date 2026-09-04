import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Region = 'US' | 'IN';

interface RegionState {
  region: Region;
  currency: string;
  setRegion: (region: Region) => void;
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      region: 'IN', // Default fallback
      currency: 'INR',
      setRegion: (region) => {
        // When region is updated, also update the cookie so the server knows
        if (typeof document !== 'undefined') {
          document.cookie = `jemy_region=${region}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
        set({ region, currency: region === 'US' ? 'USD' : 'INR' });
      },
    }),
    {
      name: 'jemy-region-storage',
    }
  )
);
