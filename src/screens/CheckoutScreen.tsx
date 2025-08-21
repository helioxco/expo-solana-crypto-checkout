import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { useUserStore } from '../store/userStore';
import { PAYMENT_METHODS } from '../utils/constants';
import { ShippingAddress } from '../types';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getTotalPrice } = useCartStore();
  const { selectedPaymentCurrency } = useUserStore();
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });
  
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.currency === selectedPaymentCurrency);
  const totalUSD = getTotalPrice();
  const totalCrypto = selectedPaymentMethod ? totalUSD * selectedPaymentMethod.exchangeRate : 0;

  // Helper function to get state display name
  const getStateDisplayName = (stateCode: string) => {
    const state = US_STATES.find(s => s.code === stateCode);
    return state ? `${state.name} (${state.code})` : stateCode;
  };

  // US States with full names and abbreviations
  const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};

    // Required field validation
    if (!shippingAddress.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!shippingAddress.line1.trim()) {
      newErrors.line1 = 'Address line 1 is required';
    }
    
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!shippingAddress.state) {
      newErrors.state = 'State is required';
    }
    
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(shippingAddress.postalCode.trim())) {
      newErrors.postalCode = 'Please enter a valid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form before continuing.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Store shipping address in secure storage
      // TODO: Create Crossmint order
      // TODO: Navigate to payment confirmation
      
      // Navigate to payment screen with shipping address
      const encodedAddress = encodeURIComponent(JSON.stringify(shippingAddress));
      router.push({
        pathname: '/payment',
        params: { shippingAddress: encodedAddress }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save shipping address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderInputField = (
    field: keyof ShippingAddress,
    label: string,
    placeholder: string,
    isRequired: boolean = true,
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default',
    autoCapitalize: 'none' | 'sentences' | 'words' | 'characters' = 'sentences'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {isRequired && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.textInput, errors[field] && styles.inputError]}
        placeholder={placeholder}
        value={shippingAddress[field]}
        onChangeText={(value) => updateField(field, value)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderStateSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        State <Text style={styles.required}>*</Text>
      </Text>
      <View style={[
        styles.pickerContainer,
        errors.state && styles.pickerContainerError
      ]}>
        <Picker
          selectedValue={shippingAddress.state}
          onValueChange={(value) => updateField('state', value)}
          style={styles.picker}
          mode="dropdown"
        >
          <Picker.Item label="Select a state" value="" />
          {US_STATES.map((state) => (
            <Picker.Item 
              key={state.code} 
              label={state.name} 
              value={state.code} 
            />
          ))}
        </Picker>
      </View>
      {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => router.back()}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Shipping Address</Text>
            <Text style={styles.subtitle}>Enter your delivery information</Text>
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({items.length})</Text>
              <Text style={styles.summaryValue}>${totalUSD.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <View style={styles.summaryTotalContainer}>
                <Text style={styles.summaryTotal}>${totalUSD.toFixed(2)}</Text>
                <Text style={styles.summaryCrypto}>
                  {totalCrypto.toFixed(4)} {selectedPaymentCurrency.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Shipping Address Form */}
          <View style={styles.formContainer}>
            {renderInputField('name', 'Full Name', 'Enter your full name')}
            {renderInputField('line1', 'Address Line 1', 'Street address')}
            {renderInputField('line2', 'Address Line 2', 'Apartment, suite, unit, building', false)}
            {renderInputField('city', 'City', 'Enter city name')}
            {renderStateSelector()}
            {renderInputField('postalCode', 'ZIP Code', 'Enter ZIP code', true, 'numeric')}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Saving...' : 'Continue to Payment'}
            </Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            * Required fields. This information will be used for order delivery only.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  orderSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryTotalContainer: {
    alignItems: 'flex-end',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCrypto: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerContainerError: {
    borderColor: '#ef4444',
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    width: '100%',
    color: '#333',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedStateText: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});