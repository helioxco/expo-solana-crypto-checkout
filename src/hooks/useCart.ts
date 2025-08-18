import { useCartStore } from '../store/cartStore';
import { useUserStore } from '../store/userStore';
import { PAYMENT_METHODS } from '../utils/constants';

export function useCart() {
  const cartStore = useCartStore();
  const { selectedPaymentCurrency } = useUserStore();

  const selectedPaymentMethod = PAYMENT_METHODS.find(
    m => m.currency === selectedPaymentCurrency
  );

  const totalUSD = cartStore.getTotalPrice();
  const totalCrypto = selectedPaymentMethod 
    ? cartStore.getTotalInCrypto(selectedPaymentMethod.exchangeRate)
    : 0;

  return {
    ...cartStore,
    totalUSD,
    totalCrypto,
    selectedPaymentMethod,
    selectedPaymentCurrency,
  };
}