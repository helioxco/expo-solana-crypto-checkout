import { useEffect } from 'react';
import { usePrivy } from '@privy-io/expo';
import { usePhantomDeeplinkWalletConnector } from '@privy-io/expo/connectors';
import * as SecureStore from 'expo-secure-store';
import { useUserStore } from '../store/userStore';
import { fetchWalletBalance } from '../utils/wallet';

// TODO: Integrate with Privy for real wallet authentication

const ADDRESS_KEY = 'wallet_address';

export function useAuth() {
  const { walletAddress, setWalletAddress, setWalletBalance } = useUserStore();
  const { logout, user } = usePrivy();

  const {
    address,
    connect,
    disconnect,
    isConnected,
    signTransaction,
    signAndSendTransaction,
  } = usePhantomDeeplinkWalletConnector({
    appUrl: 'https://yourdapp.com',
    redirectUri: '/(tabs)/products',
  });

  const connectHandle = async () => {
    await connect();
  };

  const disconnectHandle = async () => {
    try {
      if (isConnected) {
        await disconnect();
      }
    } catch (err: any) {
      const message = String(err?.message || '');
      if (!message.includes('missing shared secret')) {
        throw err;
      }
    } finally {
      setWalletAddress(null);
      setWalletBalance({ sol: 0, usdc: 0 });
      try {
        await SecureStore.deleteItemAsync(ADDRESS_KEY);
      } catch {}
    }
  };

  // Sync address changes into app state and persistent storage
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
      (async () => {
        try {
          await SecureStore.setItemAsync(ADDRESS_KEY, address);
          // Fetch real wallet balance when address changes
          const balance = await fetchWalletBalance(address);
          setWalletBalance(balance);
        } catch {}
      })();
    }
  }, [address, setWalletAddress, setWalletBalance]);

  // On mount or Privy user changes, hydrate from Privy (persistent session)
  useEffect(() => {
    const solAccount: any = (user as any)?.linked_accounts?.find((a: any) => a.type === 'wallet' && a.chain_type === 'solana');
    if (solAccount?.address) {
      setWalletAddress(solAccount.address as string);
      // Fetch real wallet balance for Privy user
      (async () => {
        try {
          const balance = await fetchWalletBalance(solAccount.address as string);
          setWalletBalance(balance);
        } catch {}
      })();
    }
  }, [user, setWalletAddress, setWalletBalance]);

  return {
    walletAddress,
    isConnected: !!(walletAddress || isConnected),
    connectHandle,
    disconnectHandle,
    signTransaction,
    signAndSendTransaction,
    address,
  };
}