import React, { useState, useEffect, useCallback } from 'react';
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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);


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

  // Timer for quote expiration
  useEffect(() => {
    if (!crossmintOrder?.quote?.expiresAt) return;

    const timer = setInterval(() => {
      const remaining = getCrossmintService().getTimeRemaining(crossmintOrder.quote!.expiresAt);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setError('Quote has expired. Please create a new quote.');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [crossmintOrder]);

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
      
      // Create line items with product information
      const lineItems = items.map(item => ({
        productLocator: item.asin,
        quantity: item.quantity,
      }));

      const order: CrossmintOrderResponse = await crossmintService.createOrder({
        email: 'user@example.com', // TODO: Get from user profile
        shippingAddress,
        lineItems,
        paymentCurrency: selectedPaymentCurrency,
        totalPrice: totalUSD,
        collectionId: currentCollectionId,
        walletAddress: wallets?.[0]?.address ?? '',
      });

      const serializedTransaction = order.order.payment?.preparation?.serializedTransaction ?? "";

      try {
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

        setPaymentStatus(order.order.status);
        handlePaymentSuccess();
      } catch (signError) {
        console.error('Error in signAndSendTransaction:', signError);
        throw new Error(`Transaction signing failed: ${signError instanceof Error ? signError.message : 'Unknown error'}`);
      }
      
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

  const handlePaymentSuccess = () => {
    Alert.alert(
      'Payment successful',
      '',
      [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)');
            clearCart();
          }
        },
      ]
    );
  }

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setCrossmintOrder(null);
    setPaymentStatus('pending');
    setTimeRemaining(0);
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
      case 'payment':
        return styles.statuspayment;
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

          {/* Collection Status */}
          <View style={styles.collectionSection}>
            <Text style={styles.collectionTitle}>Collection Setup</Text>
            {!collectionId ? (
              <>
                <Text style={styles.collectionText}>
                  Setting up product collection for your order...
                </Text>
                {isCreatingCollection && (
                  <View style={styles.collectionStatus}>
                    <ActivityIndicator color="#007AFF" />
                    <Text style={styles.collectionStatusText}>Creating collection...</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.collectionText}>
                  Collection ready! Using collection ID: {collectionId}
                </Text>
                <Text style={styles.collectionInfo}>
                  ✓ Collection created successfully
                </Text>
              </>
            )}
          </View>

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

          {/* Quote Display */}
          {crossmintOrder && crossmintOrder.quote && (
            <View style={styles.quoteDisplay}>
              <Text style={styles.quoteTitle}>Payment Quote</Text>
              <View style={styles.quoteDetails}>
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteLabel}>Amount:</Text>
                  <Text style={styles.quoteValue}>
                    {crossmintOrder.quote.totalPrice.amount} {crossmintOrder.quote.totalPrice.currency}
                  </Text>
                </View>
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteLabel}>Expires in:</Text>
                  <Text style={[styles.quoteValue, timeRemaining <= 30000 && styles.expiringSoon]}>
                    {formatTimeRemaining(timeRemaining)}
                  </Text>
                </View>
              </View>
              
              {/* Transaction Details */}
              {crossmintOrder.payment?.preparation && (
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>Transaction Ready</Text>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Chain:</Text>
                    <Text style={styles.transactionValue}>
                      {crossmintOrder.payment.preparation.chain || 'Solana'}
                    </Text>
                  </View>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Amount:</Text>
                    <Text style={styles.transactionValue}>
                      {crossmintOrder.payment.preparation.transactionParameters?.amount 
                        ? `${parseInt(crossmintOrder.payment.preparation.transactionParameters.amount) / 1000000000} SOL`
                        : 'N/A'
                      }
                    </Text>
                  </View>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Status:</Text>
                    <Text style={[styles.transactionValue, styles.statusReady]}>
                      Ready to Sign & Submit
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Payment Status */}
          {paymentStatus !== 'pending' && (
            <View style={styles.statusSection}>
              <Text style={styles.statusTitle}>Payment Status</Text>
              <View style={[styles.statusIndicator, getStatusStyle(paymentStatus)]}>
                <Text style={styles.statusText}>
                  {paymentStatus === 'completed' ? 'Payment Successful' :
                  paymentStatus === 'failed' ? 'Payment Failed' :
                  paymentStatus === 'payment' ? 'Processing Payment' :
                  paymentStatus}
                </Text>
              </View>
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
  },
  statuspending: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  statuspayment: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
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
