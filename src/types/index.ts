export type PaymentCurrency = 'sol' | 'usdc';
export type PaymentNetwork = 'solana-devnet';

export interface Product {
  asin: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: 'US';
}

export interface PaymentMethod {
  currency: PaymentCurrency;
  network: PaymentNetwork;
  displayName: string;
  exchangeRate: number; // USD to token rate
}

export interface CrossmintOrder {
  clientSecret: string;
  status: 'pending' | 'quote' | 'payment' | 'completed' | 'failed';
  quote?: {
    totalPrice: {
      amount: string;
      currency: string;
    };
    expiresAt: string;
    quotedAt?: string;
    status?: string;
  };
  payment?: {
    preparation?: {
      serializedTransaction?: string;
      payerAddress?: string;
      chain?: string;
      transactionParameters?: {
        amount: string;
        memo: string;
      };
    };
  };
}

export interface CrossmintLineItem {
  collectionLocator: string; // Format: "crossmint:collectionId"
  productLocator: string;    // Format: "amazon:ASIN"
  callData: {
    totalPrice: string;      // Total price for individual item
  };
}

export interface CrossmintOrderResponse {
  id: string;
  order: CrossmintOrder;
}

export interface WalletBalance {
  sol: number;
  usdc: number;
}