import { useEffect, useState } from 'react';
import { usePrivy, useEmbeddedSolanaWallet } from '@privy-io/expo';
import { useLogin } from '@privy-io/expo/ui';
import * as SecureStore from 'expo-secure-store';
import { useUserStore } from '../store/userStore';
import { fetchWalletBalance } from '../utils/wallet';

// TODO: Integrate with Privy for real wallet authentication

const ADDRESS_KEY = 'wallet_address';

export function useAuth() {
  const { walletAddress, setWalletAddress, setWalletBalance } = useUserStore();
  const { login } = useLogin();
  const { logout, user } = usePrivy();
  const { wallets } = useEmbeddedSolanaWallet();

  const [walletError, setWalletError] = useState<string | null>(null);

  const connectHandle = async () => {
    try {
      await login({ loginMethods: ['email']})
        .then((session) => {
          console.log('User logged in', session.user);
        })
    } catch (error) {
      console.log('error', error);
    }
  };

  const disconnectHandle = async () => {
    try {
      await logout();
      setWalletAddress(null);
      setWalletBalance({ sol: 0, usdc: 0 });
      await SecureStore.deleteItemAsync(ADDRESS_KEY);
      setWalletError(null);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // Check for existing wallet address on mount
  useEffect(() => {
    const checkExistingWallet = async () => {
      try {
        const storedAddress = await SecureStore.getItemAsync(ADDRESS_KEY);
        if (storedAddress) {
          setWalletAddress(storedAddress);
          // Fetch balance for existing wallet
          try {
            const balance = await fetchWalletBalance(storedAddress);
            setWalletBalance(balance);
          } catch (error) {
            console.warn('Failed to fetch balance for existing wallet:', error);
          }
        }
      } catch (error) {
        console.error('Error checking existing wallet:', error);
      }
    };
    
    checkExistingWallet();
  }, [setWalletAddress, setWalletBalance]);

  return {
    walletAddress,
    isConnected: !!walletAddress,
    walletError,
    connectHandle,
    disconnectHandle,
    user,
    wallets,
  };
}