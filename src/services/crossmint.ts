import {
  CrossmintOrder,
  CrossmintOrderResponse,
  CrossmintLineItem,
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
        name: "Helioxco Assessment Products",
        imageUrl: "https://www.crossmint.com/assets/crossmint/logo.png",
        description: "Product collection for Helioxco Assessment app",
        symbol: "HELIOX"
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
    lineItems: CrossmintLineItem[];
    paymentCurrency: PaymentCurrency;
    collectionId: string;
    walletAddress: string;
  }): Promise<CrossmintOrderResponse> {
    const paymentMethod = getPaymentMethod(params.paymentCurrency);

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
      lineItems: params.lineItems,
    };

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

  async getOrderPaymentStatus (orderId: string, clientSecret: string): Promise<CrossmintOrder> {
    try {
      const res = await fetch(`${ENV.CROSSMINT_API_URL}/orders/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.serverKey,
          authorization: clientSecret,
        },
      });

      const refreshedOrder = await res.json();
      return refreshedOrder;
    } catch (e) {
        console.error(e);
        throw new Error("Failed to fetch order");
    }
  };

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
}