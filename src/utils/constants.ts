import { PaymentMethod } from '../types';

export const MOCK_PRODUCTS = [
  {
    asin: "B09WNK39JN",
    name: "Echo Pop | Full sound compact smart speaker with Alexa",
    price: 39.99,
    image: "https://m.media-amazon.com/images/I/61bTwy0ooPL._AC_SX679_.jpg",
    description: "Compact smart speaker with Alexa that fits anywhere"
  },
  {
    asin: "B09JVG3TWX",
    name: "Fire HD 8 tablet, 8\" HD Display",
    price: 99.99,
    image: "https://m.media-amazon.com/images/I/712wyKsNmML.__AC_SX300_SY300_QL70_FMwebp_.jpg",
    description: "8\" HD display, 32 GB storage, 30% faster processor"
  },
  {
    asin: "B0BVM1PSYN",
    name: "Amazon Basics Wireless Bluetooth Headphones",
    price: 29.99,
    image: "https://m.media-amazon.com/images/I/612ayXw-rlL._AC_SX679_.jpg",
    description: "Over-ear wireless headphones with built-in microphone"
  },
  {
    asin: "B0CMJTSVRW",
    name: "Mini Mic Pro - Professional Wireless Microphone",
    price: 49.99,
    image: "https://m.media-amazon.com/images/I/711s6fypzWL._AC_SX679_.jpg",
    description: "Professional wireless microphone for iPhone, iPad & Android"
  }
];

// Payment methods available on testnet
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    currency: 'sol',
    network: 'solana-devnet',
    displayName: 'Solana (Devnet)',
    exchangeRate: 0.05 // 1 SOL = $20 (mock rate for testnet)
  },
  {
    currency: 'usdc',
    network: 'solana-devnet',
    displayName: 'USDC (Devnet)',
    exchangeRate: 1.0 // 1 USDC = $1
  }
];

// Testnet configuration
export const SOLANA_DEVNET_URL = 'https://api.devnet.solana.com';
export const POLLING_INTERVAL = 2500; // 2.5 seconds for order status polling
export const MAX_POLLING_ATTEMPTS = 120; // 5 minutes max

// Mock testnet balances
export const MOCK_WALLET_BALANCE = {
  sol: 5.0,  // 5 SOL on devnet
  usdc: 100.0 // 100 USDC on devnet
};