import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { buildApiUrl } from '../../configuration/config';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import Error from '../../../Error'; 
import Success from '../../../Success';

const DeliveryDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, patientId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedAddress, setSavedAddress] = useState(null);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const [deliveryInfo, setDeliveryInfo] = useState({
    recipient_name: '',
    phone_number: '',
    line1: '',
    line2: '',
    postcode: '',
    city: '',
    state: 'Select State',
    notes: '',
    preferred_delivery_date: '',
    preferred_delivery_time: ''
  });

  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
    'Sarawak', 'Selangor', 'Terengganu', 'Wilayah Persekutuan Kuala Lumpur',
    'Wilayah Persekutuan Labuan', 'Wilayah Persekutuan Putrajaya'
  ];

  // Format date for display
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      handleInputChange('preferred_delivery_date', formatDate(selectedDate));
    }
  };

  // Handle time change
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
      handleInputChange('preferred_delivery_time', formatTime(selectedTime));
    }
  };

  useEffect(() => {
    loadSavedAddress();
  }, []);

  const loadSavedAddress = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        buildApiUrl(`/api/patients/${patientId}/address`)
      );
      
      if (response.data.address) {
        const address = JSON.parse(response.data.address);
        setSavedAddress(address);
        setDeliveryInfo({
          ...deliveryInfo,
          recipient_name: address.recipient_name || '',
          phone_number: address.phone_number || '',
          line1: address.line1 || '',
          line2: address.line2 || '',
          postcode: address.postcode || '',
          city: address.city || '',
          state: address.state || 'Select State'
        });
      }
    } catch (err) {
      console.error('Error loading address:', err);
      setErrorMessage('Failed to load saved address');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['recipient_name', 'phone_number', 'line1', 'postcode', 'city', 'state', 'preferred_delivery_date', 'preferred_delivery_time'];
    const missing = required.filter(field => !deliveryInfo[field] || deliveryInfo[field] === 'Select State');
    
    if (missing.length > 0) {
      setErrorMessage('Please fill in all required fields');
      setShowError(true);
      return false;
    }

    
    // Validate Malaysian phone number
    const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
    if (!phoneRegex.test(deliveryInfo.phone_number)) {
      setErrorMessage('Please enter a valid Malaysian phone number');
      setShowError(true);
      return false;
    }
    
    return true;
  };

  const handleConfirmDelivery = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      await axios.patch(
        buildApiUrl(`/api/orders/${orderId}/status`),
        {
          status: 'confirmed',
          delivery_method: 'delivery',
          delivery_info: deliveryInfo,
          patient_id: patientId
        }
      );
      
      setSuccessMessage('Delivery details confirmed successfully');
      setShowSuccess(true);
      
      // Navigate after showing success message
      setTimeout(() => {
        navigation.navigate('OrderList', { patientId });
      }, 1500);
      
    } catch (err) {
      console.error('Error confirming delivery:', err);
      setErrorMessage('Failed to confirm delivery. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
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
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButtonContainer}
          >
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formContainer}>
          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Contact Details</Text>
            </Text>
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Recipient's Name</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryInfo.recipient_name}
                  onChangeText={(text) => handleInputChange('recipient_name', text)}
                  placeholder="Enter recipient's name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+60</Text>
                  <TextInput
                    style={styles.phoneInput}
                    value={deliveryInfo.phone_number}
                    onChangeText={(text) => handleInputChange('phone_number', text)}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Address Details</Text>
            </Text>
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address Line 1</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryInfo.line1}
                  onChangeText={(text) => handleInputChange('line1', text)}
                  placeholder="Building name, street name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address Line 2 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryInfo.line2}
                  onChangeText={(text) => handleInputChange('line2', text)}
                  placeholder="Unit number, floor, etc."
                />
              </View>

              <View style={styles.locationGroup}>
                <View style={styles.cityContainer}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={deliveryInfo.city}
                    onChangeText={(text) => handleInputChange('city', text)}
                    placeholder="Enter city"
                  />
                </View>

                <View style={styles.postcodeContainer}>
                  <Text style={styles.label}>Postcode</Text>
                  <TextInput
                    style={styles.input}
                    value={deliveryInfo.postcode}
                    onChangeText={(text) => handleInputChange('postcode', text)}
                    placeholder="00000"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>State</Text>
                <TouchableOpacity
                  style={styles.stateSelector}
                  onPress={() => setShowStatePicker(true)}
                >
                  <Text style={deliveryInfo.state === 'Select State' ? styles.placeholderText : styles.stateSelectorText}>
                    {deliveryInfo.state}
                  </Text>
                  <FontAwesome5 name="chevron-down" size={16} color="#A0AEC0" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Delivery Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Delivery Preferences</Text>
            </Text>
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Preferred Delivery Date</Text>
                <TouchableOpacity 
                  style={styles.dateTimeSelector}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={!deliveryInfo.preferred_delivery_date ? styles.placeholderText : styles.dateTimeSelectorText}>
                    {deliveryInfo.preferred_delivery_date || 'Select Date'}
                  </Text>
                  <Calendar size={20} color="#4A90E2" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Preferred Delivery Time</Text>
                <TouchableOpacity 
                  style={styles.dateTimeSelector}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={!deliveryInfo.preferred_delivery_time ? styles.placeholderText : styles.dateTimeSelectorText}>
                    {deliveryInfo.preferred_delivery_time || 'Select Time'}
                  </Text>
                  <Clock size={20} color="#4A90E2" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Delivery Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={deliveryInfo.notes}
                  onChangeText={(text) => handleInputChange('notes', text)}
                  placeholder="Add any special delivery instructions"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleConfirmDelivery}
        >
          <Text style={styles.saveButtonText}>Confirm Delivery</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showStatePicker} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStatePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <FontAwesome5 name="times" size={20} color="#A0AEC0" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.stateList}>
              {malaysianStates.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={[
                    styles.stateOption,
                    deliveryInfo.state === state && styles.selectedStateOption
                  ]}
                  onPress={() => {
                    handleInputChange('state', state);
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.stateOptionText,
                    deliveryInfo.state === state && styles.selectedStateOptionText
                  ]}>
                    {state}
                  </Text>
                  {deliveryInfo.state === state && (
                    <FontAwesome5 name="check" size={16} color="#4A90E2" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            </View>
        </TouchableOpacity>
      </Modal>

      {Platform.OS === 'ios' ? (
        <>
          {showDatePicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showDatePicker}
            >
              <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={() => setShowDatePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <FontAwesome5 name="times" size={20} color="#A0AEC0" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    style={styles.dateTimePicker}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {showTimePicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showTimePicker}
            >
              <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={() => setShowTimePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Time</Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <FontAwesome5 name="times" size={20} color="#A0AEC0" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onChange={onTimeChange}
                    style={styles.dateTimePicker}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </>
      ) : (
        <>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
        </>
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

      <BottomNavigation />
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
    paddingVertical: 12,
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 24,
    color: '#2D3748',
    fontFamily: 'Poppins_700Bold',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    gap: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginLeft: 8,
  },
  sectionContent: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'Poppins_500Medium',
  },
  input: {
    height: 48,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  phonePrefix: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4A5568',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
  },
  locationGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cityContainer: {
    flex: 2,
    gap: 8,
  },
  postcodeContainer: {
    flex: 1,
    gap: 8,
  },
  stateSelector: {
    height: 48,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeSelector: {
    height: 48,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateSelectorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
  },
  dateTimeSelectorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
  },
  placeholderText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
  },
  stateList: {
    maxHeight: 400,
  },
  stateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedStateOption: {
    backgroundColor: '#F7FAFC',
  },
  stateOptionText: {
    fontSize: 16,
    color: '#2D3748',
    fontFamily: 'Poppins_400Regular',
  },
  selectedStateOptionText: {
    color: '#4A90E2',
    fontFamily: 'Poppins_500Medium',
  },
  dateTimePicker: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
});

export default DeliveryDetails;