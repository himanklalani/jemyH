import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/store/useCartStore';
import { useRegionStore } from '@/store/useRegionStore';

interface CartItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    images: string[];
    pricing: any;
    stock: number;
    requiresPrescription: boolean;
    category: string;
  };
  quantity: number;
  priceSnapshot: {
    amount: number;
    currency: string;
  };
  prescriptionPending: boolean;
  prescription?: string | null;
}

interface CartResponse {
  success: boolean;
  cart: {
    items: CartItem[];
    region: string;
    currency: string;
  };
  message?: string;
}

// 1. Fetch Cart Data
export const useCart = () => {
  const { setItemCount } = useCartStore();
  
  return useQuery<CartResponse, Error>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await fetch('/api/cart');
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      
      // Sync global cart count on fetch
      if (data.success && data.cart?.items) {
        const count = data.cart.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
        setItemCount(count);
      }
      return data;
    },
  });
};

// 2. Add to Cart Mutation
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { openCart, setItemCount, itemCount } = useCartStore();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1, savedPrescriptionId = null }: { productId: string, quantity?: number, savedPrescriptionId?: string | null }) => {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, savedPrescriptionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to add item');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      
      // Update global count and open drawer
      if (data.cart?.items) {
        const count = data.cart.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
        setItemCount(count);
      }
      openCart();
    },
  });
};

// 3. Update Quantity Mutation
export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();
  const { setItemCount } = useCartStore();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string, quantity: number }) => {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update quantity');
      return data;
    },
    onSuccess: (data) => {
      // Invalidate cart to refetch fresh data with populated product fields
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      if (data.cart?.items) {
        const count = data.cart.items.reduce((total: number, item: any) => total + item.quantity, 0);
        setItemCount(count);
      }
    },
  });
};

// 4. Remove Item Mutation
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const { setItemCount } = useCartStore();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove item');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      if (data.cart?.items) {
        const count = data.cart.items.reduce((total: number, item: any) => total + item.quantity, 0);
        setItemCount(count);
      } else {
        setItemCount(0);
      }
    },
  });
};
