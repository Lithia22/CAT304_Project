import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import { Package } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { buildApiUrl, config } from '../../configuration/config';
import { LinearGradient } from 'expo-linear-gradient';
import Error from '../../../Error';  
import Success from '../../../Success'; 
import Confirm from '../../../Confirm'; 

const OrderList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('toConfirm');
  const [patientId, setPatientId] = useState(null);
  // Add new state variables for Error and Success modals
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState(null);

  // Add this function to check and auto-complete orders
  const checkAutoComplete = async () => {
    try {
      const toReceiveOrders = orders.filter(order => 
        ['confirmed', 'processing', 'ready'].includes(order.order_status)
      );
  
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
      for (const order of toReceiveOrders) {
        const orderDate = new Date(order.created_at);
        if (orderDate < oneWeekAgo) {
          await handleOrderReceived(order.order_id);
        }
      }
    } catch (error) {
      console.error('Error in auto-complete check:', error);
    }
  };

// Add this to your useEffect
useEffect(() => {
  if (orders.length > 0) {
    checkAutoComplete();
  }
}, [orders]);

  // Updated useEffect for fetching patientId
  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const id = await AsyncStorage.getItem('patientId');
        if (id) {
          setPatientId(id);
          loadOrders(id); // Pass the id to loadOrders
        } else {
          setError('Patient ID not found');
        }
      } catch (error) {
        console.error('Error fetching patient ID:', error);
        setError('Failed to load patient information');
      } finally {
        setLoading(false);
      }
    };
  
    fetchPatientId();
  }, []);

  // Updated useFocusEffect to use stored patientId state
  useFocusEffect(
    React.useCallback(() => {
      if (patientId) {
        loadOrders(patientId); // Pass the patientId
      }
    }, [patientId])
  );

  // Updated loadOrders to accept id parameter
  const loadOrders = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        buildApiUrl(`/api/orders/patient/${id}`)
      );
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setErrorMessage('Failed to load orders');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelect = (orderId) => {
    navigation.navigate('DeliveryDetails', {
      orderId,
      patientId
    });
  };

  const handlePickupSelect = (orderId) => {
    navigation.navigate('PickupDetails', {
      orderId,
      patientId
    });
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'toConfirm':
        return orders.filter(order => order.order_status === 'pending');
      case 'toReceive':
        return orders.filter(order => ['confirmed', 'processing', 'ready'].includes(order.order_status));
      case 'completed':
        return orders.filter(order => order.order_status === 'completed');
      default:
        return [];
    }
  };

  // Add function to handle "Received" button click
  const handleOrderReceived = (orderId) => {
    setConfirmOrderId(orderId);
    setShowConfirm(true);
  };
  
  const handleConfirmReceipt = async () => {
    try {
      const response = await axios.patch(buildApiUrl(`/api/orders/${confirmOrderId}/status`), {
        status: 'completed',
        patient_id: patientId
      });
      
      if (response.data.success) {
        await loadOrders(patientId);
        setActiveTab('completed');
        setSuccessMessage('Order marked as received successfully');
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setErrorMessage('Failed to mark order as received');
      setShowError(true);
    } finally {
      setShowConfirm(false);
    }
  };

  const renderOrderCard = (order) => {
    const isToConfirm = order.order_status === 'pending';
    const isToReceive = ['confirmed', 'processing', 'ready'].includes(order.order_status);
    
    // Check if order is older than 1 week
    const orderDate = new Date(order.created_at);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const shouldAutoComplete = isToReceive && orderDate < oneWeekAgo;

    // Auto-complete order if it's been more than a week
    if (shouldAutoComplete) {
      handleOrderReceived(order.order_id);
      return null; // Don't render the card as it will be updated in the next render
    }

    // Parse total_amount to ensure it's a number
    const totalAmount = typeof order.total_amount === 'string' 
      ? parseFloat(order.total_amount) 
      : order.total_amount || 0;

      return (
        <LinearGradient
          key={order.order_id}
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.orderCard}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #{order.order_id}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>
  
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.orderItems}
          >
            {Array.isArray(order.items) && order.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                {item.image && (
                  <Image
                    source={{ uri: `${config.API_BASE_URL}${item.image}` }}
                    style={styles.medicineImage}
                  />
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemText}>
                    {item.quantity}x | {item.dosageStrength} {item.dosageForm}
                  </Text>
                </View>
              </View>
            ))}
          </LinearGradient>
    
          <View style={styles.orderFooter}>
            <Text style={styles.totalAmount}>
              Total: RM {totalAmount.toFixed(2)}
            </Text>
            
            {isToConfirm && (
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFF']}
                style={styles.deliveryOptions}
              >
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleDeliverySelect(order.order_id)}
              >
                <Text style={styles.optionText}>Delivery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handlePickupSelect(order.order_id)}
              >
                <Text style={styles.optionText}>Self Pickup</Text>
              </TouchableOpacity>
              </LinearGradient>
        )}

          {isToReceive && (
            <View style={styles.receivedButtonContainer}>
              <TouchableOpacity
                style={styles.receivedButton}
                onPress={() => handleOrderReceived(order.order_id)}
              >
                <Text style={styles.receivedButtonText}>Mark as Received</Text>
              </TouchableOpacity>
              <Text style={styles.expiryWarning}>
                {`Auto-completes on ${new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`}
              </Text>
            </View>
          )}

          {!isToConfirm && !isToReceive && (
            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusText,
                order.order_status === 'completed' && styles.completedStatus
              ]}>
                {order.order_status?.charAt(0).toUpperCase() + order.order_status?.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  if (!patientId) {
    return (
      <SafeAreaView style={styles.container}>
        <TopContainer />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Patient ID is required</Text>
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
  <TopContainer />
  
  <LinearGradient
    colors={['#FFFFFF', '#F8FAFF']}
    style={styles.headerGradient}
  >
    <View style={styles.headerBar}>
      <Text style={styles.headerTitle}>My Orders</Text>
    </View>
  </LinearGradient>

  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[styles.tab, activeTab === 'toConfirm' && styles.activeTab]}
      onPress={() => setActiveTab('toConfirm')}
    >
      <Text style={[styles.tabText, activeTab === 'toConfirm' && styles.activeTabText]}>
        To Confirm
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.tab, activeTab === 'toReceive' && styles.activeTab]}
      onPress={() => setActiveTab('toReceive')}
    >
      <Text style={[styles.tabText, activeTab === 'toReceive' && styles.activeTabText]}>
        To Receive
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
      onPress={() => setActiveTab('completed')}
    >
      <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
        Completed
      </Text>
    </TouchableOpacity>
  </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadOrders}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {getFilteredOrders().map(renderOrderCard)}
          {getFilteredOrders().length === 0 && (
            <View style={styles.emptyContainer}>
              <Package size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          )}
        </ScrollView>
      )}

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
      <Confirm 
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmReceipt}
        title="Confirm Receipt"
        message="Are you sure you want to mark this order as received?"
      />

      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  headerBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    color: '#2D3748',
    fontFamily: 'Poppins_700Bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
  },
  activeTabText: {
    color: '#4A90E2',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderItems: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  orderFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  orderNumber: {
    fontSize: 16,
    color: '#2D3748',
    fontFamily: 'Poppins_600SemiBold',
  },
  orderDate: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'Poppins_500Medium',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 6,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medicineImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#4A90E2',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#2D3748',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 2,
  },
  itemText: {
    fontSize: 12,
    color: '#4A5568',
    fontFamily: 'Poppins_400Regular',
  },
  totalAmount: {
    fontSize: 14,
    color: '#4A90E2',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  deliveryOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4A90E2',
    fontFamily: 'Poppins_500Medium',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    color: '#4A90E2',
    fontFamily: 'Poppins_500Medium',
  },
  completedStatus: {
    color: '#4A90E2',
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
    padding: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
  },
  receivedButtonContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  receivedButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  receivedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  expiryWarning: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 6,
  }
});

export default OrderList;