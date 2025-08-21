import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MOCK_PRODUCTS, PAYMENT_METHODS } from '../utils/constants';
import { useCartStore } from '../store/cartStore';
import { useUserStore } from '../store/userStore';
import { useWalletBalance } from '../hooks/useWalletBalance';

export default function ProductListScreen() {
  const router = useRouter();
  const { addItem, items } = useCartStore();
  const { selectedPaymentCurrency } = useUserStore();
  const { walletBalance } = useWalletBalance();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);
  
  const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.currency === selectedPaymentCurrency);
  const currentBalance = walletBalance[selectedPaymentCurrency];

  const onProductClicked = (asin: string) => {
    router.push({ pathname: '/product-detail', params: { asin } });
  };

  const renderProduct = ({ item }: any) => {
    const cryptoPrice = item.price * (selectedPaymentMethod?.exchangeRate || 1);
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onProductClicked(item.asin)}
        style={styles.productCard}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
        <Text style={styles.cryptoPrice}>
          {cryptoPrice.toFixed(4)} {selectedPaymentCurrency.toUpperCase()}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            addItem(item);
            // TODO: Show toast or feedback
            console.log('Added to cart:', item.name);
          }}
        >
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Wallet Balance Header with Cart Button */}
        <View style={styles.balanceHeader}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceTitle}>Testnet Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceText}>
                {walletBalance.sol.toFixed(4)} SOL
              </Text>
              <Text style={styles.balanceDivider}>•</Text>
              <Text style={styles.balanceText}>
                {walletBalance.usdc.toFixed(2)} USDC
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
          >
            <Text style={styles.cartButtonText}>Cart ({cartItemCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.paymentSelector}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.currency}
              style={[
                styles.paymentOption,
                selectedPaymentCurrency === method.currency && styles.paymentOptionActive
              ]}
              onPress={() => {
                // Implement payment method selection
                useUserStore.getState().setSelectedPaymentCurrency(method.currency);
              }}
            >
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentCurrency === method.currency && styles.paymentOptionTextActive
              ]}>
                {method.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Product List */}
        <FlatList
          data={MOCK_PRODUCTS}
          renderItem={renderProduct}
          keyExtractor={(item) => item.asin}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          initialNumToRender={6}
          windowSize={10}
          removeClippedSubviews
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceContent: {
    flex: 1,
  },
  cartButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  cartButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  balanceTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceDivider: {
    marginHorizontal: 10,
    color: '#999',
  },
  paymentSelector: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  paymentOptionActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#666',
  },
  paymentOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 10,
  },
  productCard: {
    flex: 1,
    margin: 5,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cryptoPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
