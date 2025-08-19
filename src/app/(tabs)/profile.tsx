import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { walletAddress, disconnect } = useUserStore();
  const router = useRouter();

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnect();
            router.replace('/');
          },
        },
      ]
    );
  };

  const formatWalletAddress = (address: string | null) => {
    if (!address) return 'Not connected';
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.walletSection}>
          <View style={styles.walletHeader}>
            <Ionicons name="wallet" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Solana Wallet</Text>
          </View>
          
          <View style={styles.walletInfo}>
            <Text style={styles.label}>Network:</Text>
            <Text style={styles.networkValue}>Solana Devnet</Text>
          </View>

          <View style={styles.walletInfo}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
              {formatWalletAddress(walletAddress)}
            </Text>
          </View>

          {walletAddress && (
            <View style={styles.walletInfo}>
              <Text style={styles.label}>Full Address:</Text>
              <Text style={styles.fullAddress} numberOfLines={2} ellipsizeMode="middle">
                {walletAddress}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDisconnect}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.disconnectText]}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mainContainer: {
    flex: 1,
  },
  walletSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  walletInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  networkValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  fullAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'monospace',
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 6,
  },
  actionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  disconnectText: {
    color: '#FF3B30',
  },
});
