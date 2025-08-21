import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_PRODUCTS, PAYMENT_METHODS } from '../utils/constants';
import { useCartStore } from '../store/cartStore';
import { useUserStore } from '../store/userStore';

export default function ProductDetailScreen() {
  const { asin } = useLocalSearchParams<{ asin?: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { selectedPaymentCurrency } = useUserStore();

  const [quantity, setQuantity] = useState<number>(1);

  const product = MOCK_PRODUCTS.find((p) => p.asin === asin);
  const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.currency === selectedPaymentCurrency);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Product Not Found.</Text>
      </View>
    );
  }

  const cryptoPrice = product.price * (selectedPaymentMethod?.exchangeRate || 1);

  const onAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    Alert.alert('Added to cart', `${product.name} x${quantity}`);
    router.push('/cart');
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.container}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
        />
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <Text style={styles.cryptoPrice}>
            {cryptoPrice.toFixed(4)} {selectedPaymentCurrency.toUpperCase()}
          </Text>
        </View>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={styles.qtyButton}
          >
            <Text style={styles.qtyButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setQuantity((q) => q + 1)}
            style={styles.qtyButton}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAddToCart}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#ff4444',
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#eee',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cryptoPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    color: '#333',
  },
  quantityText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
