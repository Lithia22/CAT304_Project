import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MinusCircle, PlusCircle, Calendar, AlertCircle, CheckCircle } from 'lucide-react-native';
import axios from 'axios';
import { buildApiUrl, config } from '../../configuration/config';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

// Header component
const Header = ({ onBack, date, error, navigation }) => {  
  const formattedDate = useMemo(() => (
    date ? moment(date).format('MMMM D, YYYY') : ''
  ), [date]);

  return (
    <>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.headerGradient}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity 
            onPress={onBack}  // Use onBack prop instead of direct navigation
            style={styles.backButtonContainer}
          >
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add To Cart</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={styles.dateBanner}>
        <View style={styles.dateContainer}>
          <Calendar size={24} color="#4A90E2" />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </View>

      {error && (
        <View style={styles.messageContainer}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
        </View>
      )}
    </>
  );
};

// Footer component
const Footer = ({ total, onAddToCart, loading }) => (
  <View style={styles.footerContainer}>
    <View style={styles.footer}>
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>
          RM {total.toFixed(2)}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={onAddToCart}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.addToCartText}>Add to Cart</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

// Separate MedicationCard component
const MedicationCard = ({ medication, quantity, onUpdateQuantity, style }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={[styles.card, style]}
    >
      <View style={styles.cardContent}>
        <View style={styles.medicationImageContainer}>
          {!imageError && medication.image ? (
            <Image
              source={{ 
                uri: `${config.API_BASE_URL}${medication.image}`
              }}
              style={styles.medicationImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.medicationImage, styles.fallbackImage]}>
              <Text style={styles.fallbackText}>
                {medication.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDetails}>
            {medication.dosageForm} • {medication.dosageStrength}
          </Text>
          <Text style={styles.medicationPrice}>
            RM {(medication.price * quantity).toFixed(2)}
          </Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              onPress={() => onUpdateQuantity(-1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MinusCircle color="#4A90E2" size={24} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              onPress={() => onUpdateQuantity(1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PlusCircle color="#4A90E2" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

// Separate QuantityControls component
const QuantityControls = ({ quantity, onUpdate }) => (
  <View style={styles.quantityContainer}>
    <TouchableOpacity 
      onPress={() => onUpdate(-1)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MinusCircle size={24} color="#4A90E2" />
    </TouchableOpacity>
    <Text style={styles.quantityText}>{quantity}</Text>
    <TouchableOpacity 
      onPress={() => onUpdate(1)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <PlusCircle size={24} color="#4A90E2" />
    </TouchableOpacity>
  </View>
);

// Custom hook for cart operations
const useCart = (prescriptionId, providerId, patientId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [quantities, setQuantities] = useState({});

  const loadPrescriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        buildApiUrl(`/api/prescriptions/${prescriptionId}`)
      );
      
      setPrescription(response.data);
      
      const initialQuantities = Object.fromEntries(
        response.data.medications.map(med => [med.med_id, 1])
      );
      setQuantities(initialQuantities);
    } catch (err) {
      console.error('Error loading prescription:', err);
      setError('Failed to load prescription data');
    } finally {
      setLoading(false);
    }
  }, [prescriptionId]);

  const addToCart = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!prescription?.medications?.length) {
        throw new Error('No medications to add to cart');
      }

      const cartItems = prescription.medications.map(med => ({
        presc_med_id: med.presc_med_id,
        provider_id: providerId,
        patient_id: patientId,
        quantity: quantities[med.med_id]
      }));

      await Promise.all(
        cartItems.map(item => axios.post(buildApiUrl('/api/cart'), item))
      );

      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add items to cart';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = useCallback((medId, increment) => {
    setQuantities(prev => ({
      ...prev,
      [medId]: Math.max(1, prev[medId] + increment)
    }));
  }, []);

  const calculateTotal = useCallback(() => {
    if (!prescription?.medications) return 0;
    
    return prescription.medications.reduce((total, med) => (
      total + (med.price * (quantities[med.med_id] || 0))
    ), 0);
  }, [prescription, quantities]);

  useEffect(() => {
    loadPrescriptionData();
  }, [loadPrescriptionData]);

  return {
    loading,
    error,
    prescription,
    quantities,
    updateQuantity,
    addToCart,
    calculateTotal
  };
};

// Main AddToCart component
const AddToCart = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { prescriptionId, providerId, patientId } = route.params;

  const {
    loading,
    error,
    prescription,
    quantities,
    updateQuantity,
    addToCart,
    calculateTotal
  } = useCart(prescriptionId, providerId, patientId);

  const handleAddToCart = async () => {
    const success = await addToCart();
    if (success) {
      navigation.navigate('OrderSummary', {
        patientId,
        providerId
      });
    }
  };

  if (loading && !prescription) {
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

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider />

      <View style={styles.mainContainer}>
        <Header 
          onBack={() => navigation.goBack()}
          date={prescription?.created_at}
          error={error}
        />

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {prescription?.medications.map((med) => (
            <MedicationCard
              key={med.med_id}
              medication={med}
              quantity={quantities[med.med_id]}
              onUpdateQuantity={(increment) => updateQuantity(med.med_id, increment)}
              apiBaseUrl={config.API_BASE_URL}
            />
          ))}
        </ScrollView>

        <Footer 
          total={calculateTotal()}
          onAddToCart={handleAddToCart}
          loading={loading}
        />
      </View>

      <BottomNavProvider />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 16, 
    height: 90,
  },
  backButtonContainer: {
    width: 40,
    height: 60, 
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, 
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
  dateBanner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2D3748',
    fontFamily: 'Poppins_500Medium',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  errorText: {
    color: '#EF4444',
  },
  successText: {
    color: '#10B981',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFF',
  },
  
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 120, 
  },
  card: {
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
    alignItems: 'flex-start',
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
  metricsContainer: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#4A5568',
    marginBottom: 4,
  },
  medicationPrice: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A90E2',
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityText: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'Poppins_500Medium',
    minWidth: 30,
    textAlign: 'center',
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
  addToCartButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default AddToCart;