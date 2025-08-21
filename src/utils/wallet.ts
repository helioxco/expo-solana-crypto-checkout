import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ENV } from './env';

// USDC mint address on Solana Devnet
const USDC_MINT_DEVNET = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

export interface WalletBalance {
  sol: number;
  usdc: number;
}

/**
 * Fetch real wallet balances from Solana blockchain
 */
export async function fetchWalletBalance(walletAddress: string): Promise<WalletBalance> {
  try {
    const connection = new Connection(ENV.SOLANA_RPC_URL, 'confirmed');
    const publicKey = new PublicKey(walletAddress);

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
        // Get the first USDC account (most users have only one)
        const usdcAccount = tokenAccounts.value[0];
        const balance = usdcAccount.account.data.parsed.info.tokenAmount;
        usdcAmount = balance.uiAmount || 0;
      }
    } catch (error) {
      console.warn('Failed to fetch USDC balance:', error);
      // USDC balance will remain 0 if there's an error
    }

    return {
      sol: solAmount,
      usdc: usdcAmount,
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    // Return zero balances on error
    return {
      sol: 0,
      usdc: 0,
    };
  }
}

/**
 * Format balance for display
 */
export function formatBalance(amount: number, decimals: number = 4): string {
  if (amount === 0) return '0';
  if (amount < 0.0001) return '< 0.0001';
  return amount.toFixed(decimals);
}

/**
 * Check if wallet has sufficient balance for a transaction
 */
export function hasSufficientBalance(
  walletBalance: WalletBalance,
  requiredAmount: number,
  currency: 'sol' | 'usdc'
): boolean {
  return walletBalance[currency] >= requiredAmount;
}
