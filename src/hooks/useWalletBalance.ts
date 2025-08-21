import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { fetchWalletBalance, WalletBalance } from '../utils/wallet';

export function useWalletBalance() {
  const { walletAddress, walletBalance, setWalletBalance } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) {
      setWalletBalance({ sol: 0, usdc: 0 });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const balance = await fetchWalletBalance(walletAddress);
      setWalletBalance(balance);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
      console.error('Error refreshing wallet balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, setWalletBalance]);

  // Auto-refresh balance when wallet address changes
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Auto-refresh balance every 30 seconds when connected
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(refreshBalance, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress, refreshBalance]);

  return {
    walletBalance,
    isLoading,
    lastUpdated,
    error,
    refreshBalance,
  };
}
