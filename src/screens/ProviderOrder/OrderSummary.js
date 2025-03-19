import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { buildApiUrl, config } from '../../configuration/config';
import { LinearGradient } from 'expo-linear-gradient';
import Error from '../../../Error';
import Success from '../../../Success';

const MedicationCard = ({ item }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={styles.itemCard}
    >
      <View style={styles.cardContent}>
        <View style={styles.medicationImageContainer}>
          {!imageError && item.image ? (
            <Image
              source={{ 
                uri: `${config.API_BASE_URL}${item.image}`
              }}
              style={styles.medicationImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.medicationImage, styles.fallbackImage]}>
              <Text style={styles.fallbackText}>
                {item.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetails}>
            {item.dosageForm} • {item.dosageStrength}
          </Text>
          <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
          <Text style={styles.price}>
            RM {(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const OrderSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Add state for Error and Success modals
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const { providerId, patientId } = route.params;
      
      const response = await axios.get(
        buildApiUrl(`/api/cart/${providerId}/${patientId}`)
      );
      
      setCartItems(response.data);
      calculateTotal(response.data);
    } catch (err) {
      console.error('Error loading cart:', err.response?.data || err);
      setErrorMessage(err.response?.data?.message || 'Failed to load cart items');
      setShowError(true);
      setError('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    setTotalAmount(total);
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const { providerId, patientId } = route.params;
      
      const formattedCartItems = cartItems.map(item => ({
        med_id: item.med_id,
        presc_med_id: item.presc_med_id,
        quantity: item.quantity,
        price: parseFloat(item.price)
      }));

      const orderData = {
        patient_id: parseInt(patientId),
        provider_id: parseInt(providerId),
        cart_items: formattedCartItems,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        delivery_method: null
      };

      const response = await axios.post(buildApiUrl('/api/orders'), orderData);
      
      if (response.status === 201) {
        setSuccessMessage('Order placed successfully! Please set delivery details.');
        setShowSuccess(true);
        
        // Navigate after user closes success modal
        setTimeout(() => {
          navigation.navigate('ViewPatientPresc', { 
            patientId,
            providerId 
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Error placing order:', err?.response?.data || err);
      setErrorMessage(err?.response?.data?.message || 'Failed to place order. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopContProvider />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
        <BottomNavProvider />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TopContProvider />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadCartItems}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <BottomNavProvider />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider />
      
      <View style={styles.mainContainer}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.headerGradient}
        >
          <View style={styles.headerBar}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButtonContainer}
            >
              <Text style={styles.backButton}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Summary</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {cartItems.map((item) => (
            <MedicationCard key={item.presc_med_id} item={item} />
          ))}
        </ScrollView>

        <View style={styles.footerContainer}>
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                RM {totalAmount.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.placeOrderButton, loading && { opacity: 0.7 }]}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.placeOrderText}>Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Error 
        visible={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />
      
      <Success 
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
      />

      <BottomNavProvider />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonContainer: {
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 50,
    color: '#4A90E2',
    fontFamily: 'Poppins_700Bold',
    top: -10,
  },
  headerTitle: {
    fontSize: 24,
    color: '#2D3748',
    fontFamily: 'Poppins_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  itemCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 120,
  },
  medicationImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  medicationImage: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
    paddingVertical: 8,
    marginLeft: 8,
  },
  itemName: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  quantity: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Poppins_500Medium',
  },
  price: {
    fontSize: 16,
    color: '#4A90E2',
    fontFamily: 'Poppins_600SemiBold',
  },
  quantityPriceContainer: {
    marginTop: 4,
    gap: 4, 
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#4B5563',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A90E2',
  },
  placeOrderButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
});

export default OrderSummary;