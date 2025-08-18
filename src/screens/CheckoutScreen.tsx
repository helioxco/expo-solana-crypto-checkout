import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CheckoutScreen() {
  // TODO: Implement checkout screen
  // - Shipping address form
  // - Payment method selection (SOL or USDC)
  // - Create Crossmint order
  // - Sign transaction with wallet
  // - Poll for payment status
  
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Checkout Screen</Text>
      <Text style={styles.todo}>TODO: Implement Crossmint checkout</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  todo: {
    fontSize: 14,
    color: '#666',
  },
});