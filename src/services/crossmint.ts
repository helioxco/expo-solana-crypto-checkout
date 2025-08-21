import {
  CrossmintOrder,
  CrossmintOrderResponse,
  ShippingAddress,
  PaymentCurrency,
} from '../types';
import { ENV } from '../utils/env';

// Map our payment types to Crossmint's expected format
const getPaymentMethod = (currency: PaymentCurrency) => {
  switch (currency) {
    case 'sol':
      return { method: 'solana-devnet', currency: 'sol' };
    case 'usdc':
      return { method: 'solana-devnet', currency: 'usdc' };
    default:
      throw new Error(`Unsupported currency: ${currency}`);
  }
};

export interface CrossmintCollection {
  id: string;
  chain: string;
  metadata: {
    name: string;
    imageUrl: string;
    description: string;
    symbol: string;
  };
  fungibility: string;
  transferable: boolean;
  supplyLimit: number;
  payments?: {
    price: string;
    recipientAddress: string;
    currency: string;
  };
  subscription: {
    enabled: boolean;
  };
  reuploadLinkedFiles: boolean;
}

export interface CrossmintTransaction {
  id: string;
  orderId: string;
  serializedTransaction: string;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  chain: string;
  transactionParameters?: {
    amount: string;
    memo: string;
  };
}

export interface CrossmintWallet {
  id: string;
  address: string;
  chainType: string;
  type: string;
  status: string;
  config?: {
    adminSigner: {
      type: string;
      address: string;
    };
  };
  owner?: string;
}

export class CrossmintService {
  private serverKey: string;
  private clientSecret: string;

  constructor(clientSecret: string, serverKey: string) {
    this.clientSecret = clientSecret;
    this.serverKey = serverKey;
  }

  async createCollection(): Promise<CrossmintCollection> {
    const params = {
      chain: "solana", // Using Solana for crypto payments
      metadata: {
        name: "VALA Assessment Products",
        imageUrl: "https://www.crossmint.com/assets/crossmint/logo.png",
        description: "Product collection for VALA Assessment app",
        symbol: "VALA"
      },
      fungibility: "non-fungible",
      transferable: true,
      supplyLimit: 1000,
      payments: {
        price: "0.01", // Minimum price for the collection
        recipientAddress: "11111111111111111111111111111111", // Solana address placeholder
        currency: "sol" // Solana currency
      },
      // Enable crypto payments for the collection
      // Note: This might need to be configured in the Crossmint dashboard
      // The API might not support enabling crypto payments during creation
      subscription: {
        enabled: false
      },
      reuploadLinkedFiles: true
    };

    const requestBody = {
      chain: params.chain,
      metadata: params.metadata,
      fungibility: params.fungibility,
      transferable: params.transferable,
      supplyLimit: params.supplyLimit,
      payments: params.payments,
      subscription: params.subscription || { enabled: false },
      reuploadLinkedFiles: params.reuploadLinkedFiles !== false
    };

    console.log('Collection creation request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${ENV.CROSSMINT_API_URL}/collections/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.serverKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Crossmint collection creation error:', errorData);
      throw new Error(`Failed to create collection: ${errorData.message || response.statusText}`);
    }

    const collection = await response.json();
    console.log('Collection created successfully:', collection);
    return collection;
  }

  async createOrder(params: {
    email: string;
    shippingAddress: ShippingAddress;
    lineItems: Array<{ productLocator: string; quantity: number }>;
    paymentCurrency: PaymentCurrency;
    totalPrice: number;
    collectionId: string;
    walletAddress: string;
  }): Promise<CrossmintOrderResponse> {

    const paymentMethod = getPaymentMethod(params.paymentCurrency);
    
    const totalPrice = params.totalPrice || 0;

    const lineItems = {
      collectionLocator: `crossmint:${params.collectionId}`,
      callData: {
        totalPrice: totalPrice.toString()
      }
    };

    const requestBody = {
      recipient: {
        email: params.email,
        physicalAddress: params.shippingAddress,
      },
      locale: "en-US",
      payment: {
        receiptEmail: params.email,
        method: 'solana',
        currency: paymentMethod.currency,
        payerAddress: params.walletAddress,
      },
      lineItems: lineItems,
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${ENV.CROSSMINT_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.clientSecret,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Crossmint API error:', errorData);
      throw new Error(`Failed to create quote: ${errorData.message || response.statusText}`);
    }

    const order = await response.json();
    console.log('Crossmint order created:', JSON.parse(JSON.stringify(order)));
    return order;
  }

  async createWallet(walletAddress: string): Promise<CrossmintWallet> {
    console.log('Creating wallet for address:', walletAddress, 'on chain: solana');
    
    try {
      const walletResponse = await fetch(`${ENV.CROSSMINT_API_URL}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.serverKey,
        },
        body: JSON.stringify({
          chainType: "solana", // For Solana chain
          type: "solana-smart-wallet", // Correct wallet type for Solana
          config: {
            adminSigner: {
              type: "solana-fireblocks-custodial",
              address: walletAddress
            }
          },
          owner: `email:user@example.com` // You might want to make this configurable
        }),
      });

      if (!walletResponse.ok) {
        const errorData = await walletResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Crossmint wallet creation error:', errorData);
        throw new Error(`Failed to create wallet: ${errorData.message || walletResponse.statusText}`);
      }

      const wallet = await walletResponse.json();
      console.log('✅ Wallet created successfully:', wallet);
      return wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  async signAndSubmitTransaction(orderId: string, serializedTransaction: string, walletAddress: string): Promise<CrossmintOrder> {
    console.log('Signing and submitting transaction for order:', orderId);
    
    try {
      // Step 1: Ensure wallet exists in Crossmint system
      console.log('🔄 Ensuring wallet exists in Crossmint...');
      let wallet: CrossmintWallet;
      
      try {
        // Try to get existing wallet first
        const walletResponse = await fetch(`${ENV.CROSSMINT_API_URL}/wallets/${walletAddress}`, {
          method: 'GET',
          headers: {
            'X-API-KEY': this.serverKey,
          },
        });
        
        if (walletResponse.ok) {
          wallet = await walletResponse.json();
          console.log('✅ Wallet already exists:', wallet);
        } else {
          // Wallet doesn't exist, create it
          console.log('🔄 Wallet not found, creating new wallet...');
        }
      } catch (error) {
        console.log('🔄 Error getting wallet');
      }

      // Step 2: Create a transaction using Crossmint's API
      console.log('🔄 Creating transaction via Crossmint API...');
      
      // Create transaction using the correct Crossmint API format
      const API_URL = `${ENV.CROSSMINT_API_URL}/wallets/${walletAddress}/transactions`;
      console.log("Creating transaction for wallet:", walletAddress);
      console.log("API URL:", API_URL);
      
      const transactionResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.serverKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          params: {
            transaction: serializedTransaction,
            chain: "solana",
            requiredSigners: [
              `${walletAddress}`
            ],
            signer: [
              `${walletAddress}`
            ]
          }
        })
      });

      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Crossmint transaction creation error:', errorData);
        throw new Error(`Failed to create transaction: ${errorData.message || transactionResponse.statusText}`);
      }

      const transaction = await transactionResponse.json();
      console.log('✅ Transaction created successfully:', transaction);

      // Step 2: Approve the transaction
      console.log('🔄 Approving transaction...');
      
      const approveResponse = await fetch(`${ENV.CROSSMINT_API_URL}/transactions/${transaction.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.serverKey,
        },
        body: JSON.stringify({
          // Approval parameters as needed
        }),
      });

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Crossmint transaction approval error:', errorData);
        throw new Error(`Failed to approve transaction: ${errorData.message || approveResponse.statusText}`);
      }

      const approvedTransaction = await approveResponse.json();
      console.log('✅ Transaction approved successfully:', approvedTransaction);

      // Step 3: Poll for transaction status and order completion
      console.log('🔄 Polling for transaction completion...');
      
      return await this.pollOrderStatus(
        orderId,
        (order: CrossmintOrder) => {
          console.log('Order status updated:', order.status);
        },
        30, // Poll for up to 5 minutes
        10000 // Every 10 seconds
      );
    } catch (error) {
      console.error('Failed to sign and submit transaction:', error);
      throw error;
    }
  }

  async updatePayerAddress(orderId: string, payerAddress: string): Promise<CrossmintOrder> {
    const response = await fetch(`${ENV.CROSSMINT_API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.serverKey,
      },
      body: JSON.stringify({
        payment: {
          payerAddress,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Crossmint API error:', errorData);
      throw new Error(`Failed to update payer address: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  async getOrderStatus(orderId: string): Promise<CrossmintOrder> {
    const response = await fetch(`${ENV.CROSSMINT_API_URL}/orders/${orderId}`, {
      headers: {
        'X-API-KEY': this.clientSecret,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Crossmint API error:', errorData);
      throw new Error(`Failed to get order status: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  // Helper method for polling order status
  async pollOrderStatus(
    orderId: string,
    onStatusUpdate?: (order: CrossmintOrder) => void,
    maxAttempts: number = 120, // 5 minutes max (120 * 2.5s)
    interval: number = 2500 // 2.5 seconds
  ): Promise<CrossmintOrder> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const order = await this.getOrderStatus(orderId);
        
        if (onStatusUpdate) {
          onStatusUpdate(order);
        }
        
        if (order.status === 'completed' || order.status === 'failed') {
          return order;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        console.error(`Polling attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        // Continue polling even if one request fails
        if (attempts >= maxAttempts) {
          throw new Error('Order status polling timeout after network failures');
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Order status polling timeout');
  }

  // Get quote expiration time
  getQuoteExpirationTime(quoteExpiresAt: string): Date {
    return new Date(quoteExpiresAt);
  }

  // Check if quote is expired
  isQuoteExpired(quoteExpiresAt: string): boolean {
    const expirationTime = this.getQuoteExpirationTime(quoteExpiresAt);
    return new Date() > expirationTime;
  }

  // Get time remaining until quote expires
  getTimeRemaining(quoteExpiresAt: string): number {
    const expirationTime = this.getQuoteExpirationTime(quoteExpiresAt);
    const now = new Date();
    return Math.max(0, expirationTime.getTime() - now.getTime());
  }
}