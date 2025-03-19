import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Plus, ShoppingCart, Trash2  } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { buildApiUrl } from '../../configuration/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Dimensions } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import Error from '../../../Error';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

const DeleteConfirmationModal = ({ visible, onClose, onConfirm }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Svg width="68" height="66" viewBox="0 0 68 66" fill="none">
          <Ellipse cx="34.5917" cy="34.7835" rx="30.2326" ry="29.4" fill="#FED25F"/>
          <Path d="M33.9199 65.3167C29.3362 65.3167 25.0353 64.4712 21.0126 62.7832C16.9802 61.0911 13.4785 58.7975 10.5023 55.9033C7.52621 53.0092 5.169 49.6052 3.4305 45.6873C1.69639 41.7792 0.828125 37.6019 0.828125 33.1501C0.828125 28.6982 1.69639 24.5209 3.4305 20.6129C5.169 16.6949 7.52621 13.291 10.5023 10.3969C13.4785 7.50265 16.9802 5.20901 21.0126 3.51695C25.0353 1.8289 29.3362 0.983398 33.9199 0.983398C38.5036 0.983398 42.8044 1.8289 46.8272 3.51695C50.8595 5.20901 54.3613 7.50265 57.3374 10.3969C60.3135 13.291 62.6707 16.6949 64.4092 20.6129C66.1433 24.5209 67.0116 28.6982 67.0116 33.1501C67.0116 37.6019 66.1433 41.7792 64.4092 45.6873C62.6707 49.6052 60.3135 53.0092 57.3374 55.9033C54.3613 58.7975 50.8595 61.0911 46.8272 62.7832C42.8044 64.4712 38.5036 65.3167 33.9199 65.3167ZM33.9199 59.7834C41.5474 59.7834 48.0283 57.2042 53.3318 52.0469C58.6358 46.8889 61.2933 40.58 61.2933 33.1501C61.2933 25.7202 58.6358 19.4112 53.3318 14.2533C48.0283 9.0959 41.5474 6.51673 33.9199 6.51673C26.2923 6.51673 19.8114 9.0959 14.508 14.2533C9.20395 19.4112 6.54647 25.7202 6.54647 33.1501C6.54647 40.58 9.20395 46.8889 14.508 52.0469C19.8114 57.2042 26.2923 59.7834 33.9199 59.7834ZM35.9647 48.1858C35.4202 48.7153 34.75 48.9834 33.9199 48.9834C33.0897 48.9834 32.4195 48.7153 31.875 48.1858C31.3313 47.657 31.0607 47.0119 31.0607 46.2167C31.0607 45.4216 31.3313 44.7765 31.875 44.2477C32.4195 43.7182 33.0897 43.4501 33.9199 43.4501C34.75 43.4501 35.4202 43.7182 35.9647 44.2477C36.5084 44.7765 36.779 45.4216 36.779 46.2167C36.779 47.0119 36.5084 47.657 35.9647 48.1858ZM36.779 35.9167H31.0607V17.3167H36.779V35.9167Z"
            fill="#383D46"
            stroke="black"/>
        </Svg>
        <View style={styles.modalTextContainer}>
          <Text style={styles.modalText}>
            Are you sure you want to delete this prescription? This action cannot be undone.
          </Text>
        </View>
        <View style={styles.modalButtonsContainer}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.deleteButton]}
            onPress={onConfirm}
          >
            <Text style={styles.modalButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const ViewPatientPresc = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [fromDate, setFromDate] = useState(new Date('2024-01-01'));
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prescToDelete, setPrescToDelete] = useState(null);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isDeleteErrorModalVisible, setIsDeleteErrorModalVisible] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');


  useFocusEffect(
    React.useCallback(() => {
      loadPatientData();
    }, [route.params?.patientId])
  );

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const patientId = route.params?.patientId;
      if (!patientId) throw new Error('No patient ID provided');

      const [patientResponse, prescriptionsResponse] = await Promise.all([
        axios.get(buildApiUrl(`/api/patients/${patientId}`)),
        axios.get(buildApiUrl(`/api/prescriptions/patient/${patientId}`))
      ]);

      setPatient(patientResponse.data);
      
      const sortedPrescriptions = prescriptionsResponse.data.sort(
        (a, b) => moment(b.created_at).valueOf() - moment(a.created_at).valueOf()
      );
      setPrescriptions(sortedPrescriptions);
    } catch (err) {
      console.error('Error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadPatientData();

    // Setup polling every 30 seconds
    const interval = setInterval(loadPatientData, 30000);
    setPollingInterval(interval);

    // Cleanup polling when component unmounts
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [route.params?.patientId]);
  

  const navigateToAddPrescription = () => {
    navigation.navigate('AddPatientPresc', {
      patientId: patient.id
    });
  };

  const navigateToAddToCart = async (prescription) => {
    const providerId = route.params?.providerId;
    
    if (!providerId) {
      console.error('Provider ID is missing');
      Alert.alert('Error', 'Provider information is missing. Please try again.');
      return;
    }
  
    try {
      const response = await axios.get(
        buildApiUrl(`/api/prescriptions/${prescription.presc_id}/has-orders`)
      );
  
      if (response.data.hasOrders) {
        setIsErrorModalVisible(true);
        return;
      }
  
      navigation.navigate('AddToCart', {
        patientId: patient.id,
        prescriptionId: prescription.presc_id,
        providerId: providerId
      });
    } catch (error) {
      console.error('Error checking prescription orders:', error);
      Alert.alert(
        'Error',
        'Unable to verify prescription order status. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleFromDateChange = (event, selectedDate) => {
    setShowFromPicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
      if (moment(selectedDate).isAfter(toDate)) {
        setToDate(selectedDate);
      }
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    setShowToPicker(false);
    if (selectedDate) {
      if (moment(selectedDate).isBefore(fromDate)) {
        setToDate(fromDate);
      } else {
        setToDate(selectedDate);
      }
    }
  };

  const formatDate = (date) => moment(date).format('MMM DD, YYYY');

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const prescriptionDate = moment(prescription.created_at).startOf('day');
    return prescriptionDate.isBetween(moment(fromDate).startOf('day'), moment(toDate).endOf('day'), undefined, '[]');
  });

  const handleDeletePrescription = (prescId) => {
    setPrescToDelete(prescId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(buildApiUrl(`/api/prescriptions/${prescToDelete}`));
      await loadPatientData();
      setShowDeleteModal(false);
      setPrescToDelete(null);
    } catch (error) {
      setDeleteErrorMessage(
        error.response?.data?.hasOrders 
          ? "Cannot delete prescription as\norders have already been placed"
          : "Failed to delete prescription\nPlease try again"
      );
      setIsDeleteErrorModalVisible(true);
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const PatientCard = () => {
    if (!patient) return null;
    
    return (
      <View style={styles.patientCard}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patient.full_name}</Text>
          <Text style={styles.patientID}>Patient ID: {patient.id}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={navigateToAddPrescription}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const PrescriptionCard = ({ prescription }) => {
    const [hasOrders, setHasOrders] = useState(false);
    // Ensure medications is always an array and has unique keys
    const medications = Array.isArray(prescription.medications) 
      ? prescription.medications 
      : [];
  
      useEffect(() => {
        const checkOrders = async () => {
          try {
            const response = await axios.get(
              buildApiUrl(`/api/prescriptions/${prescription.presc_id}/has-orders`)
            );
            setHasOrders(response.data.hasOrders);
          } catch (error) {
            console.error('Error checking orders:', error);
          }
        };
        
        checkOrders();
      }, [prescription.presc_id]);

return (
    <TouchableOpacity
      key={`presc-${prescription.presc_id}`}
      style={styles.prescriptionCard}
      onPress={() => navigation.navigate('EditPatientPresc', { 
        patientId: patient.id,
        prescriptionId: prescription.presc_id 
      })}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.prescriptionCardGradient}
      >
        <View style={styles.prescriptionHeader}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#4A90E2" />
            <Text style={styles.prescriptionDate}>
              {moment(prescription.created_at).format('MMMM D, YYYY')}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              key={`cart-${prescription.presc_id}`}
              style={[
                styles.iconButton,
                hasOrders && styles.disabledIconButton
              ]}
              onPress={(e) => {
                e.stopPropagation();
                navigateToAddToCart(prescription);
              }}
            >
              <ShoppingCart 
                size={20} 
                color={hasOrders ? "#9CA3AF" : "#4A90E2"} 
              />

            </TouchableOpacity>
            <TouchableOpacity 
              key={`delete-${prescription.presc_id}`}
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeletePrescription(prescription.presc_id);
              }}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
  
          <View style={styles.medicationsContainer}>
            {medications
              .sort((a, b) => a.med_id - b.med_id)
              .map((med, index) => (
                <View 
                  key={`med-${prescription.presc_id}-${med.med_id || index}`}
                  style={styles.medicationPill}
                >
                  <Text style={styles.medicationPillText}>
                    {med.name}
                  </Text>
                </View>
              ))}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const DateFilter = () => (
    <View style={styles.filterContainer}>
      <View style={styles.datePickerContainer}>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => setShowFromPicker(true)}
        >
          <Calendar size={16} color="#4A90E2" />
          <Text style={styles.datePickerText}>{formatDate(fromDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.datePickerSeparator}>to</Text>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => setShowToPicker(true)}
        >
          <Calendar size={16} color="#4A90E2" />
          <Text style={styles.datePickerText}>{formatDate(toDate)}</Text>
        </TouchableOpacity>
      </View>
      
      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleFromDateChange}
          maximumDate={new Date()}
        />
      )}
      
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleToDateChange}
          minimumDate={fromDate}
          maximumDate={new Date()}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider />
      <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButtonContainer}
      >
        <Text style={styles.backButton}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerText}>Prescriptions</Text>
      </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <PatientCard />
            <DateFilter />
            <View style={styles.prescriptionsContainer}>
              {filteredPrescriptions.map((prescription) => (
                <PrescriptionCard key={prescription.presc_id} prescription={prescription} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <BottomNavProvider />
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPrescToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
      <Error 
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        message={
          <Text>
            Order already exists{'\n'}
            This prescription has already{'\n'}
            been added to cart
          </Text>
        }
      />
      <Error 
        visible={isDeleteErrorModalVisible}
        onClose={() => setIsDeleteErrorModalVisible(false)}
        message={deleteErrorMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
   },
   backButtonContainer: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
   },
   backButton: {
    fontSize: 50,
    color: '#4A90E2',
    fontFamily: 'Poppins_700Bold',
    top: -10,
  },
   headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
   },
   headerText: {
    color: '#383D46',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
   },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loader: {
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
  patientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  patientID: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 12,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  datePickerText: {
    color: '#4B5563',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  datePickerSeparator: {
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  prescriptionsContainer: {
    padding: 16,
    gap: 12,
  },
  prescriptionCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  prescriptionCardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescriptionDate: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
  },
  medicationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medicationPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  medicationPillText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#4A5568',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Math.min(width * 0.9, 325),
    backgroundColor: '#FFF',
    borderRadius: scale * 27,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale * 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTextContainer: {
    width: '100%',
    marginVertical: scale * 15,
  },
  modalText: {
    color: '#383D46',
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
    fontSize: scale * 15,
    lineHeight: scale * 22.5,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: scale * 10,
    marginTop: scale * 10,
  },
  modalButton: {
    paddingHorizontal: scale * 30,
    paddingVertical: scale * 10,
    borderRadius: scale * 15,
    minWidth: scale * 100,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: scale * 16,
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#4B5563',
  },
  disabledIconButton: {
    opacity: 0.7,
  },
});

export default ViewPatientPresc;