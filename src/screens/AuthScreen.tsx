import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { MOCK_WALLET_BALANCE } from '../utils/constants';

export default function AuthScreen() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { setWalletAddress, setWalletBalance } = useUserStore();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // TODO: Implement actual Privy wallet connection
    // For now, simulate connection with mock data
    setTimeout(() => {
      const mockAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Mock Solana devnet address
      setWalletAddress(mockAddress);
      setWalletBalance(MOCK_WALLET_BALANCE);
      setIsConnecting(false);
      
      // Navigate to tabs after successful connection
      router.replace('/(tabs)');
    }, 1500);
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
        style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
        onPress={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.connectButtonText}>Connect Wallet</Text>
        )}
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