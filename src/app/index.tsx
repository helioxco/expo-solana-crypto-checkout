import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AuthScreen from '../screens/AuthScreen';
import { useUserStore } from '../store/userStore';

export default function HomeScreen() {
  const router = useRouter();
  const walletAddress = useUserStore((state) => state.walletAddress);

  useEffect(() => {
    // TODO: Check if wallet is already connected from secure storage
    // For now, if wallet is connected in store, navigate to tabs
    if (walletAddress) {
      router.replace('/(tabs)');
    }
  }, [walletAddress, router]);

  return <AuthScreen />;
}