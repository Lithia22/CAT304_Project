import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import axios from 'axios';
import { buildApiUrl } from '../../configuration/config';
import DateTimePicker from '@react-native-community/datetimepicker';

const MedicationCard = ({ title, medication, onMedicationChange }) => {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Clock size={24} color="#4A90E2" />
        </View>
        <View style={styles.metricsContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Name:</Text>
            <TextInput
              style={styles.metricInput}
              value={medication.name}
              onChangeText={(text) => onMedicationChange('name', text)}
              placeholder="Medication name"
              placeholderTextColor="#A0AEC0"
            />
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Dosage Form:</Text>
            <TextInput
              style={styles.metricInput}
              value={medication.dosageForm}
              onChangeText={(text) => onMedicationChange('dosageForm', text)}
              placeholder="Dosage form"
              placeholderTextColor="#A0AEC0"
            />
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Strength:</Text>
            <TextInput
              style={styles.metricInput}
              value={medication.dosageStrength}
              onChangeText={(text) => onMedicationChange('dosageStrength', text)}
              placeholder="Dosage strength"
              placeholderTextColor="#A0AEC0"
            />
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Frequency:</Text>
            <TextInput
              style={styles.metricInput}
              value={medication.frequency}
              onChangeText={(text) => onMedicationChange('frequency', text)}
              placeholder="Frequency"
              placeholderTextColor="#A0AEC0"
            />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const EditPatientPresc = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId, prescriptionId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState(null);
  const [originalPrescription, setOriginalPrescription] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const fetchPrescription = async () => {
    if (!prescriptionId) {
      setError('No prescription ID provided');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.get(buildApiUrl(`/api/prescriptions/${prescriptionId}`));
      setPrescription(response.data);
      setOriginalPrescription(JSON.parse(JSON.stringify(response.data))); // Deep copy
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      setError('Failed to load prescription');
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPrescription();
      return () => {
        setPrescription(null);
        setOriginalPrescription(null);
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setHasChanges(false);
        setShowExpiryDatePicker(false);
      };
    }, [patientId, prescriptionId])
  );

  // Check if any changes were made
  const checkForChanges = (newPrescription, original) => {
    if (!original) return false;

    // Check expiry date
    if (newPrescription.expiry_date !== original.expiry_date) return true;

    // Check medications
    for (let i = 0; i < newPrescription.medications.length; i++) {
      const newMed = newPrescription.medications[i];
      const origMed = original.medications[i];
      
      if (newMed.name !== origMed.name ||
          newMed.dosageForm !== origMed.dosageForm ||
          newMed.dosageStrength !== origMed.dosageStrength ||
          newMed.frequency !== origMed.frequency) {
        return true;
      }
    }
    
    return false;
  };

  const handleExpiryDateChange = (event, selectedDate) => {
    setShowExpiryDatePicker(false);
    if (selectedDate) {
      // Format the date as YYYY-MM-DD without time component
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      const newPrescription = {
        ...prescription,
        expiry_date: formattedDate
      };
      setPrescription(newPrescription);
      setHasChanges(checkForChanges(newPrescription, originalPrescription));
    }
  };

  const handleMedicationChange = (medicationIndex, field, value) => {
    if (!prescription || !prescription.medications) return;
    
    const newPrescription = {
      ...prescription,
      medications: prescription.medications.map((med, index) => {
        if (index !== medicationIndex) return med;
        
        return {
          ...med,
          [field]: value
        };
      })
    };
    
    setPrescription(newPrescription);
    setHasChanges(checkForChanges(newPrescription, originalPrescription));
  };

  const updatePrescription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        ...prescription,
        // Ensure expiry_date is in YYYY-MM-DD format
        expiry_date: moment(prescription.expiry_date).format('YYYY-MM-DD'),
        medications: prescription.medications.map(med => ({
          med_id: med.med_id,
          name: med.name,
          dosageForm: med.dosageForm,
          dosageStrength: med.dosageStrength,
          frequency: med.frequency
        }))
      };
  
      await axios.put(
        buildApiUrl(`/api/prescriptions/${prescriptionId}`), 
        payload
      );
  
      setSuccessMessage('Prescription updated successfully');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error('Error updating:', error);
      setError(error.response?.data?.message || 'Failed to update prescription');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return moment(dateString).format('MMMM D, YYYY');
    } catch (error) {
      return 'Invalid date';
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
          <Text style={styles.headerTitle}>Edit Prescription</Text>
          <View style={{ width: 40 }} />
        </View>
  
        {prescription && (
          <View style={styles.dateBanner}>
            <View style={styles.dateContainer}>
              <Calendar size={24} color="#4A90E2" />
              <Text style={styles.dateText}>{formatDate(prescription.created_at)}</Text>
            </View>
          </View>
        )}
  
        {error && (
          <View style={styles.messageContainer}>
            <AlertCircle color="#EF4444" size={24} />
            <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
          </View>
        )}
  
        {successMessage && (
          <View style={styles.messageContainer}>
            <CheckCircle color="#10B981" size={24} />
            <Text style={[styles.messageText, styles.successText]}>{successMessage}</Text>
          </View>
        )}
      </LinearGradient>
  
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {prescription?.medications?.map((medication, index) => (
          <MedicationCard
            key={medication.med_id || index}
            title={`Medication ${index + 1}`}
            medication={medication}
            onMedicationChange={(field, value) => handleMedicationChange(index, field, value)}
          />
        ))}
  
        {prescription && (
          <View style={[styles.card, { marginBottom: 80 }]}>
            <View style={styles.cardContent}>
              <View style={styles.metricsContainer}>
                <Text style={styles.cardTitle}>Expiry Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowExpiryDatePicker(true)}
                >
                  <Calendar size={20} color="#4A90E2" style={styles.datePickerIcon} />
                  <Text style={styles.datePickerText}>
                    {formatDate(prescription.expiry_date)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
  
      {hasChanges && prescription && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={updatePrescription}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {showExpiryDatePicker && (
        <DateTimePicker
          value={prescription.expiry_date ? new Date(prescription.expiry_date) : new Date()}
          mode="date"
          onChange={handleExpiryDateChange}
        />
      )}

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
    saveButtonContainer: {
      position: 'absolute',
      bottom: 70, // Adjusted to account for BottomNavProvider
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#F8FAFF',
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4A90E2',
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: '#4A90E2',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    saveButtonText: {
      marginLeft: 8,
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      shadowColor: '#4A90E2',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      backgroundColor: '#FFFFFF',
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      marginRight: 16,
    },
    metricsContainer: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: '#2D3748',
      marginBottom: 8,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    metricLabel: {
      flex: 1,
      fontSize: 14,
      color: '#4A5568',
      fontFamily: 'Poppins_400Regular',
    },
    metricInput: {
      flex: 1,
      height: 36,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 6,
      paddingVertical: 5,
      paddingHorizontal: 8,
      marginRight: 8,
      fontSize: 14,
      fontFamily: 'Poppins_500Medium',
      color: '#2D3748',
    },
    metricUnit: {
      width: 50,
      fontSize: 14,
      color: '#4A5568',
      fontFamily: 'Poppins_400Regular',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      marginTop: 8,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Poppins_500Medium',
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: '#FFFFFF',
    },
    datePickerIcon: {
      marginRight: 8,
    },
    datePickerText: {
      fontSize: 14,
      color: '#2D3748',
      fontFamily: 'Poppins_400Regular',
    },
    medicationTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#2D3748',
        marginTop: 16,
        marginBottom: 8,
      },
      statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: 8,
      },
      statusText: {
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
      },
    });
  
  export default EditPatientPresc;