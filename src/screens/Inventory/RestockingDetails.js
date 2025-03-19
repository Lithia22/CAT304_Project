import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Picker
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Plus, Search, ChevronDown } from 'lucide-react-native';
import { buildApiUrl } from '../../configuration/config';
import Error from '../../../Error';
import Success from '../../../Success';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

const RestockingDetails = () => {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [processingOrders, setProcessingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [nextBatch, setNextBatch] = useState('');
  const [restockExpectedDeliveryDate, setRestockExpectedDeliveryDate] = useState('');
  const [restockCategory, setRestockCategory] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [activeView, setActiveView] = useState('main');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDeliverySuccessModal, setShowDeliverySuccessModal] = useState(false);
  const [showDeliveryErrorModal, setShowDeliveryErrorModal] = useState(false);


  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'cardiovascular', label: 'Cardiovascular' },
    { value: 'cancer', label: 'Cancer' },
    { value: 'kidney', label: 'Kidney Disease' },
    { value: 'stroke', label: 'Stroke' },
    { value: 'arthritis', label: 'Arthritis' }
  ];

  const getCategoryDisplayName = (category) => {
    const found = categories.find(cat => cat.value === category);
    return found ? found.label : category;
  };

  const shouldBeCompleted = (order) => {
    const deliveryDate = new Date(order.expected_delivery_date);
    const currentDate = new Date();
    return deliveryDate < currentDate;
  };

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const lowStockResponse = await fetch(buildApiUrl('/api/low-stock'));
      const lowStockData = await lowStockResponse.json();
      
      const ordersResponse = await fetch(buildApiUrl('/api/restocks'));
      const ordersData = await ordersResponse.json();

      const processingOrdersWithDetails = ordersData
        .filter(order => order.status === 'Pending')
        .map(order => ({
          ...order,
          status: 'Processing'
        }));

      const completedOrdersWithDetails = ordersData
        .filter(order => order.status === 'Completed')
        .map(order => ({
          ...order,
          status: 'Completed'
        }));

      const processingMedIds = processingOrdersWithDetails.map(order => order.id);
      const availableMeds = lowStockData
        .filter(med => !processingMedIds.includes(med.id))
        .map(med => ({
          ...med,
          status: med.quantity === 0 ? 'Near Restock' : 'Low Stock'
        }));

      setMedications(availableMeds);
      setProcessingOrders(processingOrdersWithDetails);
      setCompletedOrders(completedOrdersWithDetails);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
    
    const refreshInterval = setInterval(() => {
      fetchMedications();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleDeliveryAndComplete = async (orderId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/restocks/${orderId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isDelivered: true,
          status: 'Completed'
        }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update delivery status');
      }
  
      setShowDeliverySuccessModal(true);
      fetchMedications();
    } catch (error) {
      console.error('Error updating order:', error);
      setShowDeliveryErrorModal(true);
    }
  };
  const getStatusInfo = (status) => {
    switch(status) {
      case 'Low Stock': 
        return { color: '#FFB946', text: 'Low Stock' };
      case 'Near Restock': 
        return { color: '#FFD700', text: 'Near Restock' };
      case 'Processing': 
        return { color: '#4A90E2', text: 'Processing' };
      case 'Completed': 
        return { color: '#2ECC71', text: 'Completed' };
      default: 
        return { color: '#4A90E2', text: 'Unknown' };
    }
  };

  const clearRestockForm = () => {
    setRestockQuantity('');
    setNextBatch('');
    setSelectedMedication(null);
    setRestockExpectedDeliveryDate('');
  };

  const openRestockModal = (medication) => {
    setSelectedMedication(medication);
    setRestockCategory(medication.category);
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 7);
    setRestockExpectedDeliveryDate(currentDate.toISOString().split('T')[0]);
    setNextBatch('');
    setIsModalVisible(true);
  };

  const handleRestockSubmit = async () => {
    if (!restockQuantity || !nextBatch) {
      Alert.alert('Error', 'Please provide both quantity and next batch number.');
      return;
    }
  
    const quantity = parseInt(restockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid positive quantity.');
      return;
    }
  
    if (nextBatch.trim().length === 0) {
      Alert.alert('Error', 'Next batch number cannot be empty.');
      return;
    }
  
    const restockDetails = {
      id: selectedMedication.id,
      name: selectedMedication.name,
      quantity: quantity,
      status: 'Pending',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: restockExpectedDeliveryDate,
      category: restockCategory,
      next_batch: nextBatch.trim(),
      isDelivered: false
    };
  
    try {
      const response = await fetch(buildApiUrl('/api/restocks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restockDetails),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit restock order');
      }
  
      setShowSuccessModal(true);
      setIsModalVisible(false);
      clearRestockForm();
      fetchMedications();
      setActiveView('processing');
    } catch (error) {
      console.error('Error:', error);
      setShowErrorModal(true);
    }
  };

  const CategoryPickerModal = () => (
    <Modal
      visible={showCategoryPicker}
      transparent
      animationType="slide"
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCategoryPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            <TouchableOpacity 
              style={styles.pickerCloseButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={styles.pickerCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.pickerItem,
                selectedCategory === category.value && styles.pickerItemSelected
              ]}
              onPress={() => {
                setSelectedCategory(category.value);
                setShowCategoryPicker(false);
              }}
            >
              <Text style={[
                styles.pickerItemText,
                selectedCategory === category.value && styles.pickerItemTextSelected
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const getCurrentData = () => {
    const validateAndEnsureUniqueIds = (data) => {
      const seenIds = new Set();
      return data.map((item, index) => {
        if (!item.id) {
          return { ...item, id: `generated-${index}` };
        }
        if (seenIds.has(item.id)) {
          return { ...item, id: `${item.id}-${index}` };
        }
        seenIds.add(item.id);
        return item;
      });
    };
  
    let currentData;
    switch (activeView) {
      case 'processing':
        currentData = selectedCategory === 'all' 
          ? processingOrders 
          : processingOrders.filter(item => item.category === selectedCategory);
        break;
      case 'completed':
        currentData = selectedCategory === 'all'
          ? completedOrders
          : completedOrders.filter(item => item.category === selectedCategory);
        break;
      default:
        currentData = selectedCategory === 'all'
          ? medications
          : medications.filter(item => item.category === selectedCategory);
    }
  
    return validateAndEnsureUniqueIds(currentData);
  };

  const renderItem = ({ item }) => {
    const statusInfo = getStatusInfo(activeView === 'processing' ? 'Processing' : 
                                   activeView === 'completed' ? 'Completed' : 
                                   item.status);

    return (
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.medicationName}>{item.name}</Text>
            <Text style={styles.categoryBadge}>
              {getCategoryDisplayName(item.category)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>
                {activeView === 'main' ? 'Quantity' : 'Quantity Ordered'}
              </Text>
              <Text style={styles.detailValue}>{item.quantity}</Text>
            </View>
            {activeView === 'main' && (
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Reorder Point</Text>
                <Text style={styles.detailValue}>{item.reorderPoint}</Text>
              </View>
            )}
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>
                {activeView === 'main' ? 'Current Batch' : 'Next Batch'}
              </Text>
              <Text style={styles.detailValue}>
                {activeView === 'main' ? item.batch : item.next_batch}
              </Text>
            </View>
          </View>

          {activeView === 'main' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openRestockModal(item)}
            >
              <Text style={styles.actionButtonText}>Restock Now</Text>
            </TouchableOpacity>
          )}

          {activeView === 'processing' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.deliveryButton]}
            onPress={() => handleDeliveryAndComplete(item.id)}
          >
            <Text style={styles.deliveryButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
        </View>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider />
      
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
          <Text style={styles.headerTitle}>Medication Restocking</Text>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, activeView === 'main' && styles.filterButtonActive]}
            onPress={() => setActiveView('main')}
          >
            <Text style={[styles.filterButtonText, activeView === 'main' && styles.filterButtonTextActive]}>
            Low Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, activeView === 'processing' && styles.filterButtonActive]}
          onPress={() => setActiveView('processing')}
        >
          <Text style={[styles.filterButtonText, activeView === 'processing' && styles.filterButtonTextActive]}>
            Processing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, activeView === 'completed' && styles.filterButtonActive]}
          onPress={() => setActiveView('completed')}
        >
          <Text style={[styles.filterButtonText, activeView === 'completed' && styles.filterButtonTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.categoryDropdown}
        onPress={() => setShowCategoryPicker(true)}
      >
        <Text style={styles.categoryDropdownText}>
          {categories.find(cat => cat.value === selectedCategory)?.label || 'Select Category'}
        </Text>
        <ChevronDown size={20} color="#4A90E2" />
      </TouchableOpacity>
    </LinearGradient>

    {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : (
        <FlatList
          data={getCurrentData()}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || `${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeView === 'main'
                  ? `No ${selectedCategory === 'all' ? '' : selectedCategory} medications currently in low stock`
                  : activeView === 'processing'
                  ? `No ${selectedCategory === 'all' ? '' : selectedCategory} medications currently being restocked`
                  : `No completed restock orders for ${selectedCategory === 'all' ? 'any medication' : selectedCategory + ' medications'}`}
              </Text>
            </View>
          )}
        />
      )}

    <Modal visible={isModalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Restock {selectedMedication?.name}
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Enter Quantity (numbers only)"
            keyboardType="numeric"
            value={restockQuantity}
            onChangeText={(text) => {
              if (/^\d*$/.test(text)) {
                setRestockQuantity(text);
              }
            }}
            placeholderTextColor="#94A3B8"
          />

          <TextInput
            style={styles.modalInput}
            placeholder="Enter Next Batch Number (required)"
            value={nextBatch}
            onChangeText={setNextBatch}
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                clearRestockForm();
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.submitButton,
                (!restockQuantity || !nextBatch) && styles.submitButtonDisabled
              ]}
              onPress={handleRestockSubmit}
              disabled={!restockQuantity || !nextBatch}
            >
              <Text style={styles.submitButtonText}>Submit Restock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <CategoryPickerModal />

    <Success
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Restock order submitted successfully!"
      />

      <Error
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message="Failed to submit restock order. Please try again later."
      />

      <Success
        visible={showDeliverySuccessModal}
        onClose={() => setShowDeliverySuccessModal(false)}
        message="Order marked as delivered successfully!"
      />

      <Error
        visible={showDeliveryErrorModal}
        onClose={() => setShowDeliveryErrorModal(false)}
        message="Failed to mark order as delivered. Please try again."
      />

      <BottomNavProvider />
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
  paddingBottom: 16,
},
headerBar: {
  flexDirection: 'row',
  alignItems: 'center',
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
  top: -3,
},
headerTitle: {
  fontSize: 24,
  color: '#2D3748',
  fontFamily: 'Poppins_700Bold',
  marginLeft: 17,
},
filterContainer: {
  flexDirection: 'row',
  paddingHorizontal: 16,
  marginBottom: 12,
  gap: 12,
},
filterButton: {
  flex: 1,
  backgroundColor: '#F3F4F6',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  alignItems: 'center',
},
filterButtonActive: {
  backgroundColor: '#4A90E2',
},
filterButtonText: {
  fontSize: 14,
  fontFamily: 'Poppins_500Medium',
  color: '#6B7280',
},
filterButtonTextActive: {
  color: '#FFFFFF',
},
categoryDropdown: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#FFFFFF',
  marginHorizontal: 16,
  marginTop: 8,
  marginBottom: 16,
  padding: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
categoryDropdownText: {
  fontSize: 16,
  fontFamily: 'Poppins_500Medium',
  color: '#2D3748',
},
pickerContainer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingBottom: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
},
pickerHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
},
pickerTitle: {
  fontSize: 18,
  fontFamily: 'Poppins_600SemiBold',
  color: '#2D3748',
},
pickerCloseButton: {
  padding: 8,
},
pickerCloseText: {
  fontSize: 24,
  color: '#4A5568',
},
pickerItem: {
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
},
pickerItemSelected: {
  backgroundColor: '#F3F4F6',
},
pickerItemText: {
  fontSize: 16,
  fontFamily: 'Poppins_500Medium',
  color: '#2D3748',
},
pickerItemTextSelected: {
  color: '#4A90E2',
},
card: {
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},
cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 16,
},
titleContainer: {
  flex: 1,
},
medicationName: {
  fontSize: 18,
  fontFamily: 'Poppins_600SemiBold',
  color: '#2D3748',
},
categoryBadge: {
  fontSize: 12,
  fontFamily: 'Poppins_500Medium',
  color: '#4A5568',
  backgroundColor: '#E2E8F0',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  marginTop: 4,
  alignSelf: 'flex-start',
},
statusBadge: {
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 16,
},
statusText: {
  fontSize: 12,
  fontFamily: 'Poppins_500Medium',
},
detailsContainer: {
  marginTop: 12,
},
detailRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
},
detailColumn: {
  flex: 1,
},
detailLabel: {
  fontSize: 12,
  fontFamily: 'Poppins_500Medium',
  color: '#6B7280',
  marginBottom: 4,
},
detailValue: {
  fontSize: 16,
  fontFamily: 'Poppins_600SemiBold',
  color: '#2D3748',
},
actionButton: {
  backgroundColor: '#4A90E2',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 16,
},
actionButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontFamily: 'Poppins_600SemiBold',
},
deliveryButton: {
  backgroundColor: '#10B981',
},
deliveryButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontFamily: 'Poppins_600SemiBold',
},
emptyState: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
},
emptyStateText: {
  fontSize: 16,
  fontFamily: 'Poppins_500Medium',
  color: '#6B7280',
  textAlign: 'center',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  width: Math.min(width * 0.9, 325),
  backgroundColor: '#FFFFFF',
  borderRadius: scale * 27,
  padding: scale * 20,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 8,
},
modalTitle: {
  fontSize: scale * 20,
  fontFamily: 'Poppins_600SemiBold',
  color: '#2D3748',
  marginBottom: scale * 16,
  textAlign: 'center',
},
modalInput: {
  backgroundColor: '#F3F4F6',
  borderRadius: scale * 12,
  padding: scale * 16,
  marginBottom: scale * 12,
  fontSize: scale * 16,
  fontFamily: 'Poppins_500Medium',
  color: '#2D3748',
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: scale * 20,
  gap: scale * 12,
},
modalButton: {
  flex: 1,
  paddingVertical: scale * 12,
  borderRadius: scale * 12,
  alignItems: 'center',
},
submitButton: {
  backgroundColor: '#4A90E2',
},
submitButtonDisabled: {
  backgroundColor: '#A0AEC0',
},
cancelButton: {
  backgroundColor: '#F3F4F6',
},
submitButtonText: {
  color: '#FFFFFF',
  fontSize: scale * 16,
  fontFamily: 'Poppins_600SemiBold',
},
cancelButtonText: {
  color: '#4B5563',
  fontSize: scale * 16,
  fontFamily: 'Poppins_600SemiBold',
},
});

export default RestockingDetails;