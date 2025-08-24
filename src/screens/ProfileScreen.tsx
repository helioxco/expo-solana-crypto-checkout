import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useAuth } from '../hooks/useAuth';
import { useWalletBalance } from '../hooks/useWalletBalance';

export default function ProfileScreen() {
  const { walletAddress } = useUserStore();
  const { disconnectHandle } = useAuth();
  const router = useRouter();
  const { walletBalance, isLoading, error, lastUpdated, refreshBalance } = useWalletBalance();
  const { wallets } = useEmbeddedSolanaWallet();

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
          onPress: async () => {
            await disconnectHandle();
            router.replace('/auth');
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

  const onRefresh = React.useCallback(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.mainContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your wallet and settings</Text>
          </View>
          {(walletAddress || wallets?.[0]) && (
            <TouchableOpacity style={styles.refreshButton} onPress={refreshBalance}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {(walletAddress || wallets?.[0]) ? (
          <>
            <View style={styles.balanceSection}>
              <View style={styles.balanceHeader}>
                <Ionicons name="cash-outline" size={24} color="#34C759" />
                <Text style={styles.sectionTitle}>Wallet Balance</Text>
                {lastUpdated && (
                  <Text style={styles.lastUpdated}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Text>
                )}
              </View>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="warning-outline" size={20} color="#FF9500" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={refreshBalance}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.balanceGrid}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>SOL</Text>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.balanceValue}>{walletBalance.sol.toFixed(4)}</Text>
                  )}
                  <Text style={styles.balanceNetwork}>Devnet</Text>
                </View>
                
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>USDC</Text>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.balanceValue}>{walletBalance.usdc.toFixed(2)}</Text>
                  )}
                  <Text style={styles.balanceNetwork}>Devnet</Text>
                </View>
              </View>
            </View>

            <View style={styles.networkSection}>
              <View style={styles.networkHeader}>
                <Ionicons name="globe-outline" size={24} color="#FF9500" />
                <Text style={styles.sectionTitle}>Network Information</Text>
                {wallets?.[0] && (
                  <Text style={styles.privyIndicator}>Connected via Privy</Text>
                )}
              </View>
              
              <View style={styles.networkInfo}>
                <Text style={styles.label}>Network:</Text>
                <Text style={styles.networkValue}>Solana Devnet</Text>
              </View>

              <View style={styles.networkInfo}>
                <Text style={styles.label}>RPC Endpoint:</Text>
                <Text style={styles.networkValue}>https://api.devnet.solana.com</Text>
              </View>

              <View style={styles.networkInfo}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
                  {formatWalletAddress(wallets?.[0]?.address || walletAddress)}
                </Text>
              </View>

              <View style={styles.networkInfo}>
                <Text style={styles.label}>Full Address:</Text>
                <Text style={styles.fullAddress} numberOfLines={2} ellipsizeMode="middle">
                  {wallets?.[0]?.address || walletAddress}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noWalletSection}>
            <Ionicons name="wallet-outline" size={48} color="#666666" />
            <Text style={styles.noWalletTitle}>No Wallet Connected</Text>
            <Text style={styles.noWalletText}>Connect your wallet to view balances and manage your profile</Text>
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDisconnect}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.disconnectText]}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  header: {
    padding: 20,
    paddingBottom: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  balanceSection: {
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
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  balanceNetwork: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  networkSection: {
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
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkInfo: {
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
  lastUpdated: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 'auto',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
  noWalletSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noWalletTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  noWalletText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  privyIndicator: {
    fontSize: 12,
    color: '#7c3aed',
    marginLeft: 'auto',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
