import { create } from 'zustand';

interface CartState {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Optimistic line item count
  itemCount: number;
  setItemCount: (count: number) => void;
}

export const useCartStore = create<CartState>((set) => ({
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
}));
