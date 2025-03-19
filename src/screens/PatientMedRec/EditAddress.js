import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import Error from '../../../Error';
import Success from '../../../Success';
import { buildApiUrl } from '../../configuration/config';
import { FontAwesome5 } from '@expo/vector-icons';

const EditAddress = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [initialAddress, setInitialAddress] = useState(null);
  const [addressDetails, setAddressDetails] = useState({
    recipient_name: '',
    phone_number: '',
    line1: '',
    line2: '',
    state: 'Select State',
    postcode: '',
    city: '',
    addressLabel: ''
  });

  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
    'Sarawak', 'Selangor', 'Terengganu', 'Wilayah Persekutuan Kuala Lumpur',
    'Wilayah Persekutuan Labuan', 'Wilayah Persekutuan Putrajaya'
  ];

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const addressResponse = await axios.get(buildApiUrl(`/api/patients/${userId}/address`));
        
        if (addressResponse.data.address) {
          const parsedAddress = JSON.parse(addressResponse.data.address);
          setAddressDetails(parsedAddress);
          setInitialAddress(parsedAddress);
        }
      }
    } catch (error) {
      console.error('Error fetching address details:', error);
      setErrorMessage('Failed to load address details');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAddressDetails(prev => ({
      ...prev,
      [field]: value
    }));
    checkForChanges({
      ...addressDetails,
      [field]: value
    });
  };

  const checkForChanges = (currentDetails) => {
    if (!initialAddress) {
      setIsEditing(true);
      return;
    }

    const hasChanges = Object.keys(currentDetails).some(key => 
      currentDetails[key] !== initialAddress[key]
    );
    setIsEditing(hasChanges);
  };

  const validateAddress = () => {
    const required = ['recipient_name', 'phone_number', 'line1', 'city', 'postcode'];
    for (const field of required) {
      if (!addressDetails[field]) {
        setErrorMessage(`${field.replace(/_/g, ' ')} is required`);
        setShowError(true);
        return false;
      }
    }
  
    if (addressDetails.state === 'Select State') {
      setErrorMessage('Please select a state');
      setShowError(true);
      return false;
    }
  
    if (!/^\d{5}$/.test(addressDetails.postcode)) {
      setErrorMessage('Please enter a valid 5-digit postcode');
      setShowError(true);
      return false;
    }
  
    const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
    if (!phoneRegex.test(addressDetails.phone_number.replace(/-/g, ''))) {
      setErrorMessage('Please enter a valid Malaysian phone number');
      setShowError(true);
      return false;
    }
  
    return true;
  };

  const handleSave = async () => {
    if (!validateAddress()) return;
  
    try {
      const userId = await AsyncStorage.getItem('userId');
      await axios.put(buildApiUrl(`/api/patients/${userId}/address`), {
        address: JSON.stringify(addressDetails)
      });

      if (route.params?.onAddressUpdate) {
        route.params.onAddressUpdate(JSON.stringify(addressDetails), addressDetails.state);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      setErrorMessage('Failed to save address. Please try again.');
      setShowError(true);
    }
  };

  if (isLoading) {
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
          <Text style={styles.headerTitle}>Delivery Address</Text>
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
              <Text style={styles.sectionTitleText}> Contact Details</Text>
            </Text>
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Recipient's Name</Text>
                <TextInput
                  style={styles.input}
                  value={addressDetails.recipient_name}
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
                    value={addressDetails.phone_number}
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
              <Text style={styles.sectionTitleText}> Address Details</Text>
            </Text>
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address Line 1</Text>
                <TextInput
                  style={styles.input}
                  value={addressDetails.line1}
                  onChangeText={(text) => handleInputChange('line1', text)}
                  placeholder="Building name, street name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address Line 2 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={addressDetails.line2}
                  onChangeText={(text) => handleInputChange('line2', text)}
                  placeholder="Unit number, floor, etc."
                />
              </View>

              <View style={styles.locationGroup}>
                <View style={styles.cityContainer}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={addressDetails.city}
                    onChangeText={(text) => handleInputChange('city', text)}
                    placeholder="Enter city"
                  />
                </View>

                <View style={styles.postcodeContainer}>
                  <Text style={styles.label}>Postcode</Text>
                  <TextInput
                    style={styles.input}
                    value={addressDetails.postcode}
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
                  <Text style={addressDetails.state === 'Select State' ? styles.placeholderText : styles.stateSelectorText}>
                    {addressDetails.state}
                  </Text>
                  <FontAwesome5 name="chevron-down" size={16} color="#A0AEC0" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Address Label Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}> Address Label</Text>
            </Text>
            <View style={styles.labelContainer}>
              {['home', 'office', 'other'].map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.labelButton,
                    addressDetails.addressLabel === label && styles.selectedLabel
                  ]}
                  onPress={() => handleInputChange('addressLabel', label)}
                >
                  <Text style={[
                    styles.labelText,
                    addressDetails.addressLabel === label && styles.selectedLabelText
                  ]}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {isEditing && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}

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
                    addressDetails.state === state && styles.selectedStateOption
                  ]}
                  onPress={() => {
                    handleInputChange('state', state);
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.stateOptionText,
                    addressDetails.state === state && styles.selectedStateOptionText
                  ]}>
                    {state}
                  </Text>
                  {addressDetails.state === state && (
                    <FontAwesome5 name="check" size={16} color="#4A90E2" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNavigation />
      
      <Success visible={showSuccess} onClose={() => setShowSuccess(false)} message="Address saved successfully!" />
      <Error visible={showError} onClose={() => setShowError(false)} message={errorMessage} />
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
    fontSize: 20,
    color: '#2D3748',
    fontFamily: 'Poppins_600SemiBold',
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
  stateSelectorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
  },
  labelContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  labelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedLabel: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  labelText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  selectedLabelText: {
    color: '#FFFFFF',
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
  placeholderText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  }
});

export default EditAddress;