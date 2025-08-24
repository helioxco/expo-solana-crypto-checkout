import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { usePrivy } from '@privy-io/expo';
import AuthScreen from '../screens/AuthScreen';

export default function HomeScreen() {
  const router = useRouter();
  const { isReady, user } = usePrivy();

  useEffect(() => {
    // TODO: Check if wallet is already connected from secure storage
    // For now, if wallet is connected in store, navigate to tabs
    if (isReady && user) {
      router.replace('/(tabs)');
    }
  }, [isReady, user]);

  return <AuthScreen />;
}