import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function AuthScreen() {
  const { connectHandle } = useAuth();
  
  const handleConnect = async () => {
    connectHandle();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VALA Assessment</Text>
      <Text style={styles.subtitle}>Connect your wallet to purchase with crypto</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Testnet Only</Text>
        <Text style={styles.infoText}>This app uses Solana Devnet</Text>
        <Text style={styles.infoText}>You'll receive test SOL and USDC</Text>
      </View>

      <TouchableOpacity
        style={styles.connectButton}
        onPress={handleConnect}
      >
        <Text style={styles.connectButtonText}>Connect Wallet</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By connecting, you agree to use testnet tokens only
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#b3d9e8',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0066cc',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  connectButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
