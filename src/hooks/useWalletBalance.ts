import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ENV } from '../utils/env';

// USDC mint address on Solana Devnet
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export interface WalletBalance {
  sol: number;
  usdc: number;
}

export function useWalletBalance() {
  const { walletAddress, walletBalance, setWalletBalance } = useUserStore();
  const { wallets } = useEmbeddedSolanaWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!wallets?.[0]) {
      setWalletBalance({ sol: 0, usdc: 0 });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the wallet address from Privy wallet
      const privyWalletAddress = wallets[0].address;
      if (!privyWalletAddress) {
        throw new Error('No wallet address available from Privy wallet');
      }

      // Get balance directly from Solana RPC
      const connection = new Connection(ENV.SOLANA_RPC_URL, 'confirmed');
      const publicKey = new PublicKey(privyWalletAddress);

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      const solAmount = solBalance / LAMPORTS_PER_SOL;

      // Fetch USDC balance (SPL token)
      let usdcAmount = 0;
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: USDC_MINT_DEVNET,
        });

        if (tokenAccounts.value.length > 0) {
          const usdcAccount = tokenAccounts.value[0];
          const balance = usdcAccount.account.data.parsed.info.tokenAmount;
          usdcAmount = balance.uiAmount || 0;
          console.log('✅ USDC balance:', usdcAmount);
        } else {
          console.log('ℹ️ No USDC token accounts found');
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch USDC balance:', error);
      }

      const balance = {
        sol: solAmount,
        usdc: usdcAmount,
      };

      console.log('✅ Balance fetch successful - SOL:', solAmount, 'USDC:', usdcAmount);
      setWalletBalance(balance);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
      console.error('Error refreshing wallet balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wallets, setWalletBalance]);

  // Auto-refresh balance when wallets change
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Auto-refresh balance every 30 seconds when connected
  useEffect(() => {
    if (!wallets?.[0]) return;

    const interval = setInterval(refreshBalance, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [wallets, refreshBalance]);

  return {
    walletBalance,
    isLoading,
    lastUpdated,
    error,
    refreshBalance,
  };
}
