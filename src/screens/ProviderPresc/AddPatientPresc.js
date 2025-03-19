import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, AlertCircle, CheckCircle, Plus, Trash2, Clock, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import moment from 'moment';
import { buildApiUrl } from '../../configuration/config';

const COMMON_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every morning',
  'Every night',
  'As needed'
];

const MedicationCard = ({ medication, index, onFrequencySelect, onDelete, validationErrors }) => {
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={styles.medicationCard}
    >
      <View style={styles.cardContent}>
        <View style={styles.medicationItemHeader}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <TouchableOpacity 
            onPress={onDelete}
            style={styles.deleteButton}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.medicationDetails}>
          {medication.dosageStrength} {medication.dosageForm}
        </Text>
        
        <View style={styles.frequencyContainer}>
          <TouchableOpacity
            style={[
              styles.frequencySelector,
              validationErrors[`frequency_${index}`] && styles.frequencySelectorError,
              medication.frequency && styles.frequencySelectorActive
            ]}
            onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
          >
            <Clock size={16} color={medication.frequency ? "#4A90E2" : "#718096"} />
            <Text style={[
              styles.frequencySelectorText,
              medication.frequency && styles.frequencySelectorTextActive
            ]}>
              {medication.frequency || "Select frequency"}
            </Text>
          </TouchableOpacity>
        </View>

        {showFrequencyPicker && (
          <View style={styles.frequencyPickerContainer}>
            {COMMON_FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={styles.frequencyOption}
                onPress={() => {
                  onFrequencySelect(freq);
                  setShowFrequencyPicker(false);
                }}
              >
                <Clock size={16} color="#4A90E2" />
                <Text style={styles.frequencyOptionText}>{freq}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.frequencyCustomContainer}>
              <Text style={styles.frequencyCustomLabel}>Custom Frequency:</Text>
              <TextInput
                style={styles.frequencyCustomInput}
                placeholder="Enter custom frequency..."
                onChangeText={(text) => {
                  onFrequencySelect(text);
                  setShowFrequencyPicker(false);
                }}
                returnKeyType="done"
              />
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const AddPatientPresc = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId } = route.params;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showPrescribedPicker, setShowPrescribedPicker] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [prescription, setPrescription] = useState({
    patient_id: patientId,
    presc_date: moment().format('YYYY-MM-DD'),
    expiry_date: moment().add(1, 'month').format('YYYY-MM-DD'),
    medications: []
  });

  useEffect(() => {
    loadMedicines();
    const unsubscribe = navigation.addListener('focus', loadMedicines);
    return unsubscribe;
  }, [navigation]);

  const loadMedicines = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/medicines'));
      // The response will already have unique medications
      setMedicines(response.data);
      setFilteredMedicines(response.data);
    } catch (error) {
      setError('Unable to load medicines. Please check your connection and try again.');
    }
  };
  
  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = medicines.filter(med => 
      med.name.toLowerCase().includes(text.toLowerCase()) ||
      med.dosageForm.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredMedicines(filtered);
  };
  
  const addMedication = (medicine) => {
    const medicationToAdd = {
      med_id: medicine.med_id,
      name: medicine.name,
      frequency: '',
      dosageStrength: medicine.dosageStrength,
      dosageForm: medicine.dosageForm
    };
  
    setPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, medicationToAdd]
    }));
    setSearchText('');
    setShowMedicineModal(false);
  };

  const handleDateChange = (type, event, selectedDate) => {
    if (type === 'prescribed') {
      setShowPrescribedPicker(false);
    } else {
      setShowExpiryPicker(false);
    }
    
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      setPrescription(prev => ({
        ...prev,
        [type === 'prescribed' ? 'presc_date' : 'expiry_date']: formattedDate
      }));
    }
  };

  const validatePrescription = () => {
    const errors = {};
    
    if (prescription.medications.length === 0) {
      errors.medications = 'Add at least one medication to create a prescription';
    }

    prescription.medications.forEach((med, index) => {
      if (!med.frequency?.trim()) {
        errors[`frequency_${index}`] = 'Specify how often to take this medication';
      }
    });

    if (moment(prescription.expiry_date).isBefore(prescription.presc_date)) {
      errors.dates = 'Expiry date cannot be before prescribed date';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createPrescription = async () => {
    if (!validatePrescription()) {
      return;
    }
  
    // Add additional validation
    if (!prescription.patient_id || !prescription.presc_date || !prescription.expiry_date) {
      setError('Missing required prescription details');
      return;
    }
  
    const hasInvalidMedications = prescription.medications.some(
      med => !med.med_id || !med.name || !med.frequency
    );
    
    if (hasInvalidMedications) {
      setError('One or more medications are missing required information');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      // Single POST request
      await axios.post(buildApiUrl('/api/prescriptions'), prescription);
      
      setSuccessMessage('Prescription created successfully');
      if (route.params?.onPrescriptionAdded) {
        route.params.onPrescriptionAdded();
      }
  
      setTimeout(() => navigation.goBack(), 1500);
  
    } catch (error) {
      setError('Unable to create prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMedicineModal = () => (
    <Modal
      visible={showMedicineModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMedicineModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TouchableOpacity onPress={() => setShowMedicineModal(false)}>
              <X size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search medicines..."
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          <ScrollView style={styles.modalList}>
            {filteredMedicines.length === 0 ? (
              <Text style={styles.noResultsText}>No medicines found</Text>
            ) : (
              filteredMedicines.map((medicine) => (
                <TouchableOpacity
                  key={medicine.med_id}
                  style={styles.medicineItem}
                  onPress={() => addMedication(medicine)}
                >
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDetails}>
                    {medicine.dosageStrength} {medicine.dosageForm}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
    <TopContProvider />
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
        
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
            <Text style={styles.headerTitle}>New Prescription</Text>
            <View style={{ width: 40 }} />
          </View>

          {(error || successMessage) && (
            <View style={[
              styles.messageContainer,
              error ? styles.errorContainer : styles.successContainer
            ]}>
              {error ? 
                <AlertCircle color="#EF4444" size={20} /> :
                <CheckCircle color="#10B981" size={20} />
              }
              <Text style={[
                styles.messageText,
                error ? styles.errorText : styles.successText
              ]}>
                {error || successMessage}
              </Text>
            </View>
          )}
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Prescription Details</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Prescribed Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowPrescribedPicker(true)}
              >
                <Calendar size={20} color="#4A90E2" />
                <Text style={styles.datePickerText}>
                  {moment(prescription.presC_date).format('MMMM D, YYYY')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Expiry Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowExpiryPicker(true)}
              >
                <Calendar size={20} color="#4A90E2" />
                <Text style={styles.datePickerText}>
                  {moment(prescription.expiry_date).format('MMMM D, YYYY')}
                </Text>
              </TouchableOpacity>
            </View>

            {validationErrors.dates && (
              <Text style={styles.validationError}>{validationErrors.dates}</Text>
            )}
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.card}
          >
            <View style={styles.medicationHeader}>
              <Text style={styles.cardTitle}>Medications</Text>
              {prescription.medications.length > 0 && (
                <Text style={styles.medicationCount}>
                  {prescription.medications.length} added
                </Text>
              )}
            </View>

            {validationErrors.medications && (
              <Text style={styles.validationError}>{validationErrors.medications}</Text>
            )}

            {prescription.medications.map((med, index) => (
              <MedicationCard
                key={index}
                medication={med}
                index={index}
                onFrequencySelect={(frequency) => {
                  setPrescription(prev => ({
                    ...prev,
                    medications: prev.medications.map((m, i) => 
                      i === index ? { ...m, frequency } : m
                    )
                  }));
                  if (validationErrors[`frequency_${index}`]) {
                    setValidationErrors(prev => ({
                      ...prev,
                      [`frequency_${index}`]: undefined
                    }));
                  }
                }}
                onDelete={() => {
                  setPrescription(prev => ({
                    ...prev,
                    medications: prev.medications.filter((_, i) => i !== index)
                  }));
                }}
                validationErrors={validationErrors}
              />
            ))}

            <TouchableOpacity 
              style={styles.addMedicationButton}
              onPress={() => setShowMedicineModal(true)}
            >
              <Plus size={20} color="#4A90E2" />
              <Text style={styles.addMedicationText}>Add Medication</Text>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              loading && styles.saveButtonDisabled,
              prescription.medications.length === 0 && styles.saveButtonDisabled
            ]}
            onPress={createPrescription}
            disabled={loading || prescription.medications.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                Create Prescription
              </Text>

            )}
          </TouchableOpacity>
        </View>

        {showPrescribedPicker && (
          <DateTimePicker
            value={new Date(prescription.presc_date)}
            mode="date"
            onChange={(event, date) => handleDateChange('prescribed', event, date)}
            maximumDate={new Date()}
          />
        )}

        {showExpiryPicker && (
          <DateTimePicker
          value={new Date(prescription.expiry_date)}
          mode="date"
          onChange={(event, date) => handleDateChange('expiry', event, date)}
          minimumDate={new Date(prescription.presc_date)}
        />
      )}

      {renderMedicineModal()}
      <BottomNavProvider />
    </KeyboardAvoidingView>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
safeArea: {
  flex: 1,
  backgroundColor: '#F8FAFF',
},
container: {
  flex: 1,
},
headerGradient: {
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 5,
  padding: 16,
},
headerBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
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
messageContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 8,
  marginTop: 8,
},
errorContainer: {
  backgroundColor: '#FEF2F2',
},
successContainer: {
  backgroundColor: '#F0FDF4',
},
messageText: {
  marginLeft: 8,
  fontSize: 14,
  fontFamily: 'Poppins_400Regular',
},
errorText: {
  color: '#DC2626',
},
successText: {
  color: '#059669',
},
scrollView: {
  flex: 1,
},
scrollContent: {
  padding: 16,
  paddingBottom: 100,
},
card: {
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 3,
},
cardTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1A365D',
  marginBottom: 16,
  fontFamily: 'Poppins_600SemiBold',
},
fieldContainer: {
  marginBottom: 16,
},
fieldLabel: {
  fontSize: 14,
  color: '#4A5568',
  marginBottom: 8,
  fontFamily: 'Poppins_400Regular',
},
datePickerButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#F0F7FF',
},
datePickerText: {
  fontSize: 16,
  color: '#2D3748',
  marginLeft: 8,
  fontFamily: 'Poppins_400Regular',
},
medicationsSection: {
  gap: 12,
},
medicationHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
},
medicationCount: {
  fontSize: 14,
  color: '#4A90E2',
  fontWeight: '500',
  fontFamily: 'Poppins_500Medium',
},
medicationCard: {
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},
cardContent: {
  flex: 1,
},
medicationItemHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
medicationName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#2D3748',
  fontFamily: 'Poppins_600SemiBold',
},
deleteButton: {
  padding: 8,
  borderRadius: 8,
  backgroundColor: '#FEF2F2',
},
medicationDetails: {
  fontSize: 14,
  color: '#718096',
  marginBottom: 12,
  fontFamily: 'Poppins_400Regular',
},
frequencyContainer: {
  marginTop: 8,
},
frequencySelector: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#F0F7FF',
  borderWidth: 1,
  borderColor: '#E2E8F0',
},
frequencySelectorError: {
  borderColor: '#EF4444',
  backgroundColor: '#FEF2F2',
},
frequencySelectorActive: {
  borderColor: '#4A90E2',
  backgroundColor: '#F0F7FF',
},
frequencySelectorText: {
  marginLeft: 8,
  fontSize: 14,
  color: '#718096',
  fontFamily: 'Poppins_400Regular',
},
frequencySelectorTextActive: {
  color: '#4A90E2',
  fontWeight: '500',
  fontFamily: 'Poppins_500Medium',
},
frequencyPickerContainer: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  marginTop: 8,
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
frequencyOption: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
  backgroundColor: '#F8FAFF',
},
frequencyOptionText: {
  marginLeft: 8,
  fontSize: 14,
  color: '#2D3748',
  fontFamily: 'Poppins_400Regular',
},
frequencyCustomContainer: {
  marginTop: 8,
  padding: 12,
  borderTopWidth: 1,
  borderTopColor: '#E2E8F0',
},
frequencyCustomLabel: {
  fontSize: 14,
  color: '#4A5568',
  marginBottom: 8,
  fontFamily: 'Poppins_400Regular',
},
frequencyCustomInput: {
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#F8FAFF',
  fontSize: 14,
  color: '#2D3748',
  fontFamily: 'Poppins_400Regular',
},
addMedicationButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  borderRadius: 12,
  backgroundColor: '#F0F7FF',
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: '#4A90E2',
},
addMedicationText: {
  marginLeft: 8,
  fontSize: 16,
  color: '#4A90E2',
  fontWeight: '500',
  fontFamily: 'Poppins_500Medium',
},
saveButtonContainer: {
  position: 'absolute',
  bottom: 70,
  left: 0,
  right: 0,
  padding: 16,
  backgroundColor: '#FFFFFF',
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 8,
},
saveButton: {
  backgroundColor: '#4A90E2',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
},
saveButtonDisabled: {
  backgroundColor: '#A0AEC0',
},
saveButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
  fontFamily: 'Poppins_600SemiBold',
},
validationError: {
  color: '#EF4444',
  fontSize: 14,
  marginBottom: 12,
  fontFamily: 'Poppins_400Regular',
},
modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  padding: 16,
},
modalContent: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 16,
  maxHeight: '80%',
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
modalTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1A365D',
  fontFamily: 'Poppins_600SemiBold',
},
modalList: {
  maxHeight: 400,
},
searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F0F7FF',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
},
searchInput: {
  flex: 1,
  fontSize: 16,
  color: '#2D3748',
  fontFamily: 'Poppins_400Regular',
},
medicineItem: {
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#F8FAFF',
  marginBottom: 8,
},
medicineName: {
  fontSize: 16,
  fontWeight: '500',
  color: '#2D3748',
  marginBottom: 4,
  fontFamily: 'Poppins_500Medium',
},
noResultsText: {
  textAlign: 'center',
  padding: 16,
  color: '#718096',
  fontFamily: 'Poppins_400Regular',
}
});

export default AddPatientPresc;