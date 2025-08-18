import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProductDetailScreen() {
  // TODO: Implement product detail screen
  // - Show product image, name, description, price
  // - Add to cart functionality
  // - Show crypto price based on selected payment method
  
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Product Detail Screen</Text>
      <Text style={styles.todo}>TODO: Implement product details</Text>
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