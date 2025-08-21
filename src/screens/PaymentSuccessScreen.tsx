import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccessScreen() {
  const router = useRouter();

  const handleContinueShopping = () => {
    router.replace('/(tabs)');
  };

  const handleViewOrders = () => {
    // TODO: Navigate to orders screen
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Your order has been processed and confirmed. You will receive an email confirmation shortly.
        </Text>

        {/* Order Details */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoTitle}>What happens next?</Text>
          <View style={styles.orderInfoItem}>
            <Ionicons name="mail-outline" size={20} color="#6b7280" />
            <Text style={styles.orderInfoText}>Email confirmation sent</Text>
          </View>
          <View style={styles.orderInfoItem}>
            <Ionicons name="time-outline" size={20} color="#6b7280" />
            <Text style={styles.orderInfoText}>Order processing (1-2 business days)</Text>
          </View>
          <View style={styles.orderInfoItem}>
            <Ionicons name="car-outline" size={20} color="#6b7280" />
            <Text style={styles.orderInfoText}>Shipping notification</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinueShopping}>
            <Text style={styles.primaryButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewOrders}>
            <Text style={styles.secondaryButtonText}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Support Info */}
        <View style={styles.supportInfo}>
          <Text style={styles.supportText}>
            Need help? Contact our support team at{' '}
            <Text style={styles.supportEmail}>support@vala.finance</Text>
          </Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  orderInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: 350,
  },
  orderInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  orderInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderInfoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
    flex: 1,
  },
  actionButtons: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
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
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  supportInfo: {
    alignItems: 'center',
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  supportEmail: {
    color: '#7c3aed',
    fontWeight: '500',
  },
});
