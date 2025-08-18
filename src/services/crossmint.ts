import { ShippingAddress, CrossmintOrder, PaymentCurrency } from '../types';

const CROSSMINT_API_URL = 'https://api.crossmint.com/api/2022-06-09';

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

export class CrossmintService {
  private clientSecret: string;

  constructor(clientSecret: string) {
    this.clientSecret = clientSecret;
  }

  async createOrder(params: {
    email: string;
    shippingAddress: ShippingAddress;
    lineItems: Array<{ productLocator: string; quantity: number }>;
    paymentCurrency: PaymentCurrency;
  }): Promise<CrossmintOrder> {
    // TODO: Implement Crossmint order creation
    const paymentMethod = getPaymentMethod(params.paymentCurrency);
    
    const response = await fetch(`${CROSSMINT_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-secret': this.clientSecret,
      },
      body: JSON.stringify({
        recipient: {
          email: params.email,
          physicalAddress: params.shippingAddress,
        },
        payment: paymentMethod,
        lineItems: params.lineItems,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create order: ${error}`);
    }

    return response.json();
  }

  async updatePayerAddress(orderId: string, payerAddress: string): Promise<CrossmintOrder> {
    // TODO: Implement payer address update for crypto payment
    const response = await fetch(`${CROSSMINT_API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-client-secret': this.clientSecret,
      },
      body: JSON.stringify({
        payment: {
          payerAddress,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update payer address');
    }

    return response.json();
  }

  async getOrderStatus(orderId: string): Promise<CrossmintOrder> {
    // TODO: Implement order status polling
    const response = await fetch(`${CROSSMINT_API_URL}/orders/${orderId}`, {
      headers: {
        'x-client-secret': this.clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get order status');
    }

    return response.json();
  }

  // Helper method for polling order status
  async pollOrderStatus(
    orderId: string,
    onStatusUpdate?: (order: CrossmintOrder) => void,
    maxAttempts: number = 120
  ): Promise<CrossmintOrder> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const order = await this.getOrderStatus(orderId);
      
      if (onStatusUpdate) {
        onStatusUpdate(order);
      }
      
      if (order.status === 'completed' || order.status === 'failed') {
        return order;
      }
      
      // Wait 2.5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2500));
      attempts++;
    }
    
    throw new Error('Order status polling timeout');
  }
}