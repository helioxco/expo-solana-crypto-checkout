import React from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { PrivyElements } from '@privy-io/expo/ui';

// TODO: Import and wrap with Privy provider
// import { PrivyProvider } from '../services/privy';
import { PrivyProviderWrapper } from '../services/privy';

const queryClient = new QueryClient();

export default function RootLayout() {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  return (
    <PrivyProviderWrapper>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="product-detail" options={{ title: 'Product Details' }} />
          <Stack.Screen name="cart" options={{ title: 'Cart' }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="payment" options={{ title: 'Payment', headerShown: false }} />
          <Stack.Screen name="payment-success" options={{ title: 'Payment Success', headerShown: false }} />
        </Stack>
      </QueryClientProvider>
      <PrivyElements />
    </PrivyProviderWrapper>
  );
}