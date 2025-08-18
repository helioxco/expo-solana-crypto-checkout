import { create } from 'zustand';
import { ShippingAddress, PaymentCurrency, WalletBalance } from '../types';

interface UserState {
  walletAddress: string | null;
  walletBalance: WalletBalance;
  selectedPaymentCurrency: PaymentCurrency;
  shippingAddress: ShippingAddress | null;
  setWalletAddress: (address: string | null) => void;
  setWalletBalance: (balance: WalletBalance) => void;
  setSelectedPaymentCurrency: (currency: PaymentCurrency) => void;
  setShippingAddress: (address: ShippingAddress) => void;
}

export const useUserStore = create<UserState>((set) => ({
  walletAddress: null,
  walletBalance: { sol: 0, usdc: 0 },
  selectedPaymentCurrency: 'sol',
  shippingAddress: null,
  
  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setSelectedPaymentCurrency: (currency) => set({ selectedPaymentCurrency: currency }),
  setShippingAddress: (address) => set({ shippingAddress: address })
}));