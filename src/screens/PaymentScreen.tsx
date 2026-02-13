import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Connection, Transaction } from '@solana/web3.js';
import bs58 from "bs58";
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { useUserStore } from '../store/userStore';
import { useCartStore } from '../store/cartStore';
import { CrossmintOrder, CrossmintOrderResponse, ShippingAddress } from '../types';
import { PAYMENT_METHODS } from '../utils/constants';
import { ENV, getCrossmintService } from '../utils/env';
import { useAuth } from '@/hooks/useAuth';
import { useWalletBalance } from '../hooks/useWalletBalance';


export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shippingAddressParam = params.shippingAddress as string;
  const { walletAddress, selectedPaymentCurrency } = useUserStore();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { isConnected } = useAuth();
  const { wallets } = useEmbeddedSolanaWallet();
  const { walletBalance, isLoading: balanceLoading, error: balanceError } = useWalletBalance();

  const [crossmintOrder, setCrossmintOrder] = useState<CrossmintOrder | null>(null);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] = useState<number | null>(null);

  const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.currency === selectedPaymentCurrency);
  const totalUSD = getTotalPrice();
  const totalCrypto = selectedPaymentMethod ? totalUSD * selectedPaymentMethod.exchangeRate : 0;
  const currentBalance = walletBalance[selectedPaymentCurrency];

  // Parse shipping address from params
  const shippingAddress: ShippingAddress = shippingAddressParam 
    ? JSON.parse(decodeURIComponent(shippingAddressParam))
    : null;

  // Check if user has sufficient balance
  const hasSufficientBalance = currentBalance >= totalCrypto;

  // Get order status
  const orderStatus = useMemo(() => {
    return crossmintOrder?.payment?.status ?? 'pending';
  }, [crossmintOrder]);

  // Timer for order expiration
  useEffect(() => {
    if (!crossmintOrder?.quote?.expiresAt) return;

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(crossmintOrder.quote!.expiresAt);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setError('Order has expired. Please create a new order.');
        clearInterval(timer);
        // Stop polling when order expires
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          setPollingIntervalId(null);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [crossmintOrder, pollingIntervalId]);

  // Get quote expiration time
  const getQuoteExpirationTime = (quoteExpiresAt: string): Date => {
    return new Date(quoteExpiresAt);
  }

  // Get time remaining until quote expires
  const getTimeRemaining = (quoteExpiresAt: string): number => {
    const expirationTime = getQuoteExpirationTime(quoteExpiresAt);
    const now = new Date();
    return Math.max(0, expirationTime.getTime() - now.getTime());
  }

  const pollPaymentStatus = async (orderId: string, clientSecret: string) => {
    const intervalId = setInterval(async () => {
      try {
        const order = await getCrossmintService().getOrderPaymentStatus(orderId, clientSecret);
        console.log("payment status: ", order);
        if (order.payment.status === "completed") {
          setCrossmintOrder(order);
          clearInterval(intervalId);
          setPollingIntervalId(null);
          setPaymentStatus('completed');
          handlePaymentSuccess();
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
    }, 2500);

    setPollingIntervalId(intervalId);
  };

  useEffect(() => {
    if (pollingIntervalId && timeRemaining <= 0) {
      clearInterval(pollingIntervalId);
    }
  }, [timeRemaining]);

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Ensure collection exists before creating quote
  const ensureCollectionExists = useCallback(async () => {
    if (collectionId) return collectionId;
    
    setIsCreatingCollection(true);
    setError(null);
    
    try {
      const crossmintService = getCrossmintService();
      const newCollection = await crossmintService.createCollection();
      setCollectionId(newCollection.id);
      return newCollection.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreatingCollection(false);
    }
  }, [collectionId]);

  // Create Crossmint quote
  const createQuote = useCallback(async () => {
    if (!shippingAddress) {
      setError('Missing shipping address');
      return;
    }

    setIsCreatingQuote(true);
    setError(null);

    try {
      // Ensure collection exists first
      // const currentCollectionId = await ensureCollectionExists();
      const currentCollectionId = "a7979cd5-8787-48e0-8672-d5681343322b";
      
      const crossmintService = getCrossmintService();
      
      // Create line items with the correct Crossmint format
      const lineItems = items.map(item => ({
        collectionLocator: `crossmint:${currentCollectionId}`,
        productLocator: `amazon:${item.asin}`,
        callData: {
          totalPrice: (item.price * item.quantity).toString()
        }
      }));

      const orderResponse: CrossmintOrderResponse = await crossmintService.createOrder({
        email: 'user@heliox.co', // TODO: Get from user profile
        shippingAddress,
        lineItems,
        paymentCurrency: selectedPaymentCurrency,
        collectionId: currentCollectionId,
        walletAddress: wallets?.[0]?.address ?? '',
      });

      setCrossmintOrder(orderResponse.order);
      setPaymentStatus(orderResponse.order.payment?.status ?? 'awaiting-payment');
      pollPaymentStatus(orderResponse.order.orderId, orderResponse.clientSecret);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create quote';
      console.error('Error in createQuote:', err);
      setError(errorMessage);
    } finally {
      setIsCreatingQuote(false);
    }
  }, [
    shippingAddress,
    walletAddress,
    items,
    selectedPaymentCurrency,
    ensureCollectionExists,
    isConnected,
  ]);

  const handleSignAndSendTransaction = async () => {
    if (!crossmintOrder?.payment?.preparation?.serializedTransaction) {
      setError('Transaction not ready. Please try again.');
      return;
    }

    setIsProcessingPayment(true);
    setError(null);

    try {
      const serializedTransaction = crossmintOrder.payment.preparation.serializedTransaction;
      const wallet = wallets?.[0];
      const provider = await wallet?.getProvider();

      // Create a connection to the Solana network
      const connection = new Connection(ENV.SOLANA_RPC_URL, 'confirmed');

      // Create your transaction (either legacy Transaction or VersionedTransaction)
      const transaction = Transaction.from(bs58.decode(serializedTransaction));

      // Sign And Send the transaction
      const res = await provider?.request({
        method: 'signAndSendTransaction',
        params: {
          transaction: transaction,
          connection: connection,
        },
      });

      const { signature } = res ?? {};

      if (signature) {
        setPaymentStatus('completed');
        // Stop polling when payment is completed
        // if (pollingIntervalId) {
        //   clearInterval(pollingIntervalId);
        //   setPollingIntervalId(null);
        // }
      }

    } catch (signError) {
      console.error('Error in signAndSendTransaction:', signError);
      const errorMessage = `Transaction signing failed: ${signError instanceof Error ? signError.message : 'Unknown error'}`;
      setError(errorMessage);
      setPaymentStatus('failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Payment success is now handled by the UI state
    // No need to show alert immediately
  };

  const handleDone = () => {
    router.replace('/(tabs)');
    clearCart();
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setCrossmintOrder(null);
    setPaymentStatus('pending');
    setTimeRemaining(0);
    // Clear any existing polling
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  };

  // Handle back to checkout
  const handleBackToCheckout = () => {
    router.back();
  };

  // Get status style based on payment status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statuspending;
      case 'awaiting-payment':
        return styles.statusawaitingpayment;
      case 'processing':
        return styles.statusprocessing;
      case 'completed':
        return styles.statuscompleted;
      case 'failed':
        return styles.statusfailed;
      default:
        return styles.statuspending;
    }
  };

  if (!shippingAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Missing Information</Text>
          <Text style={styles.errorText}>Shipping address is required to proceed with payment.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBackToCheckout}>
            <Text style={styles.retryButtonText}>Back to Checkout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasSufficientBalance) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Insufficient Balance</Text>
          <Text style={styles.errorText}>
            You need {totalCrypto.toFixed(4)} {selectedPaymentCurrency.toUpperCase()} to complete this purchase.
            Current balance: {currentBalance.toFixed(4)} {selectedPaymentCurrency.toUpperCase()}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBackToCheckout}>
            <Text style={styles.retryButtonText}>Back to Checkout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show success state when payment is completed
  if (paymentStatus === 'completed' || orderStatus === 'completed') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Payment Successful!</Text>
              <Text style={styles.subtitle}>Your order has been processed successfully</Text>
            </View>

            {/* Success Message */}
            <View style={styles.successSection}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Payment Completed</Text>
              <Text style={styles.successText}>
                Your payment of {totalCrypto.toFixed(4)} {selectedPaymentCurrency.toUpperCase()} has been processed successfully.
              </Text>
              <Text style={styles.successSubtext}>
                Order ID: {crossmintOrder?.orderId}
              </Text>
            </View>

            {/* Action Button */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Payment</Text>
            <Text style={styles.subtitle}>Complete your purchase with {selectedPaymentCurrency.toUpperCase()}</Text>
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({items.length})</Text>
              <Text style={styles.summaryValue}>${totalUSD.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <View>
                <Text style={styles.summaryTotal}>${totalUSD.toFixed(2)}</Text>
                <Text style={styles.summaryCrypto}>
                  {totalCrypto.toFixed(4)} {selectedPaymentCurrency.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Wallet Information */}
          <View style={styles.walletInfo}>
            <Text style={styles.walletTitle}>Wallet Information</Text>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Address:</Text>
              <Text style={styles.walletValue} numberOfLines={1} ellipsizeMode="middle">
                {wallets?.[0]?.address || walletAddress || 'Not connected'}
              </Text>
            </View>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Balance:</Text>
              {balanceLoading ? (
                <View style={styles.balanceLoading}>
                  <ActivityIndicator size="small" color="#7c3aed" />
                  <Text style={styles.balanceLoadingText}>Loading...</Text>
                </View>
              ) : balanceError ? (
                <Text style={styles.balanceError}>Error loading balance</Text>
              ) : (
                <Text style={styles.walletValue}>
                  {currentBalance.toFixed(4)} {selectedPaymentCurrency.toUpperCase()}
                </Text>
              )}
            </View>
            {balanceError && (
              <Text style={styles.balanceErrorText}>{balanceError}</Text>
            )}
          </View>

          {/* Order Status */}
          {crossmintOrder && (
            <View style={styles.statusSection}>
              <Text style={styles.statusTitle}>Order Status</Text>
              <View style={[styles.statusIndicator, getStatusStyle(orderStatus)]}>
                <Text style={styles.statusText}>
                  {orderStatus === 'pending' ? 'Creating Order...' :
                   orderStatus === 'awaiting-payment' ? 'Awaiting Payment' :
                   orderStatus === 'processing' ? 'Processing Payment' :
                   orderStatus === 'completed' ? 'Payment Successful' :
                   orderStatus === 'failed' ? 'Payment Failed' :
                   orderStatus}
                </Text>
              </View>
              
              {/* Time Remaining */}
              {orderStatus === 'awaiting-payment' && crossmintOrder.quote?.expiresAt && (
                <View style={styles.timeRemainingSection}>
                  <Text style={styles.timeRemainingTitle}>Time Remaining</Text>
                  <Text style={[styles.timeRemainingText, timeRemaining <= 30000 && styles.expiringSoon]}>
                    {formatTimeRemaining(timeRemaining)}
                  </Text>
                  <Text style={styles.timeRemainingSubtext}>
                    Order expires at {new Date(crossmintOrder.quote.expiresAt).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Quote Section */}
          {!crossmintOrder && (
            <View style={styles.quoteSection}>
              <Text style={styles.quoteTitle}>Create Payment Quote</Text>
              <Text style={styles.quoteText}>
                Click below to create a payment quote from Crossmint. This will reserve the payment amount.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, (isCreatingQuote || isCreatingCollection) && styles.buttonDisabled]}
                onPress={createQuote}
                disabled={isCreatingQuote || isCreatingCollection}
              >
                {isCreatingQuote ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Quote</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Payment Action Button */}
          {orderStatus === 'awaiting-payment' && (
            <View style={styles.paymentActionSection}>
              <Text style={styles.paymentActionTitle}>Process Payment</Text>
              <Text style={styles.paymentActionText}>
                Your order is ready. Click below to sign and submit the payment transaction.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, isProcessingPayment && styles.buttonDisabled]}
                onPress={handleSignAndSendTransaction}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Process Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorText}>{error}</Text>
              <View style={styles.errorActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
                  <Text style={styles.secondaryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToCheckout}>
                  <Text style={styles.secondaryButtonText}>Back to Checkout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToCheckout}>
              <Text style={styles.secondaryButtonText}>Back to Checkout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  orderSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCrypto: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
  },
  walletInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletLabel: {
    fontSize: 16,
    color: '#666',
  },
  walletValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  quoteSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  quoteText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  collectionSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  collectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  collectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  collectionStatusText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    fontStyle: 'italic',
  },
  collectionInfo: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
    marginTop: 10,
  },
  transactionDetails: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
  },
  transactionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusReady: {
    color: '#10b981',
    fontWeight: '600',
  },
  quoteDisplay: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteDetails: {
    marginBottom: 20,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quoteLabel: {
    fontSize: 16,
    color: '#666',
  },
  quoteValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  expiringSoon: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  statusSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statusIndicator: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  statuspending: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  statusawaitingpayment: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  statusprocessing: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  statuscompleted: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  statusfailed: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeRemainingSection: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  timeRemainingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  timeRemainingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 5,
  },
  timeRemainingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paymentActionSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentActionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  paymentActionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  successSection: {
    backgroundColor: '#d1fae5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIconText: {
    fontSize: 30,
    color: '#fff',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 15,
  },
  successSubtext: {
    fontSize: 14,
    color: '#16a34a',
    fontStyle: 'italic',
  },
  errorSection: {
    backgroundColor: '#fee2e2',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    lineHeight: 22,
    marginBottom: 15,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  actionButtons: {
    marginTop: 20,
  },
  balanceLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLoadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  balanceError: {
    fontSize: 14,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  balanceErrorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 5,
    fontStyle: 'italic',
  },
});
