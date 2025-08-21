// Environment configuration for the app
// In production, these should be set via environment variables

export const ENV = {
  // Crossmint configuration
  CROSSMINT_SERVER_KEY: process.env.EXPO_PUBLIC_CROSSMINT_SERVER_KEY || 'your-crossmint-server-key',
  CROSSMINT_CLIENT_KEY: process.env.EXPO_PUBLIC_CROSSMINT_CLIENT_KEY || 'your-crossmint-client-key',
  CROSSMINT_PROJECT_ID: process.env.EXPO_PUBLIC_CROSSMINT_PROJECT_ID || 'your-crossmint-project-id',
  
  // Privy configuration
  PRIVY_APP_ID: process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id',
  
  // Solana configuration
  SOLANA_RPC_URL: process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  
  // Environment
  IS_DEVNET: process.env.EXPO_PUBLIC_USE_TESTNET === 'true' || true,
  
  // API endpoints
  CROSSMINT_API_URL: process.env.EXPO_PUBLIC_USE_TESTNET === 'true' 
    ? 'https://staging.crossmint.com/api/2022-06-09'
    : 'https://api.crossmint.com/api/2022-06-09',
};

  // Helper function to get Crossmint service with proper configuration
export const getCrossmintService = () => {
  if (
    ENV.CROSSMINT_SERVER_KEY === 'your-crossmint-server-key' ||
    ENV.CROSSMINT_CLIENT_KEY === 'your-crossmint-client-key'
  ) {
    console.warn('⚠️  Crossmint API key not configured. Please set CROSSMINT_SERVER_KEY in your environment variables.');
  }
  
  return new (require('../services/crossmint').CrossmintService)(ENV.CROSSMINT_CLIENT_KEY, ENV.CROSSMINT_SERVER_KEY);
};
