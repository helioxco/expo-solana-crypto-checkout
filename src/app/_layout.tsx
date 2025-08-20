import React from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// TODO: Import and wrap with Privy provider
// import { PrivyProvider } from '../services/privy';
import { PrivyProviderWrapper } from '../services/privy';

const queryClient = new QueryClient();

export default function RootLayout() {
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
        </Stack>
      </QueryClientProvider>
    </PrivyProviderWrapper>
  );
}