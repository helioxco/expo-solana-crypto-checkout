import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (asin: string) => void;
  updateQuantity: (asin: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalInCrypto: (exchangeRate: number) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (product) => set((state) => {
    const existingItem = state.items.find(item => item.asin === product.asin);
    if (existingItem) {
      return {
        items: state.items.map(item =>
          item.asin === product.asin
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    }
    return { items: [...state.items, { ...product, quantity: 1 }] };
  }),
  
  removeItem: (asin) => set((state) => ({
    items: state.items.filter(item => item.asin !== asin)
  })),
  
  updateQuantity: (asin, quantity) => set((state) => ({
    items: state.items.map(item =>
      item.asin === asin ? { ...item, quantity } : item
    )
  })),
  
  clearCart: () => set({ items: [] }),
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  getTotalInCrypto: (exchangeRate: number) => {
    const totalUSD = get().getTotalPrice();
    return totalUSD * exchangeRate;
  }
}));