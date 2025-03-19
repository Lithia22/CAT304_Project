import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, FileText} from 'lucide-react-native';
import { buildApiUrl } from '../../configuration/config';

const HomePatient = () => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [medications, setMedications] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('medications');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDate, setFromDate] = useState(new Date('2024-01-01'));
  const [toDate, setToDate] = useState(new Date());
  const [pollingInterval, setPollingInterval] = useState(null);

  // Add this useEffect to initialize userId
  useEffect(() => {
    const initializeUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      } catch (error) {
        console.error('Error getting userId from AsyncStorage:', error);
      }
    };
    initializeUserId();
  }, []);


  // Add this function to reset dates
  const resetDates = () => {
    setFromDate(new Date('2024-01-01'));
    setToDate(new Date());
  };

  const handleTabSwitch = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      if (tab === 'medications') {
        // Reset dates when switching to medications
        resetDates();
      }
    }
  };

const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userResponse = await axios.get(buildApiUrl(`api/patients/${userId}`));
      const medicationsResponse = await axios.get(buildApiUrl(`/api/patients/${userId}/medications`)); 
      const medicalRecordsResponse = await axios.get(buildApiUrl(`/api/medical-records/patient/${userId}`)); 
      
      setUsername(userResponse.data.username);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      
      // Get the patient's prescriptions first
      const prescriptionsResponse = await axios.get(buildApiUrl(`/api/prescriptions/patient/${userId}`));
      const prescriptions = prescriptionsResponse.data || [];
      
      // Extract and flatten all medications from prescriptions
      const allMedications = [];
      prescriptions.forEach(prescription => {
        if (Array.isArray(prescription.medications)) {
          prescription.medications.forEach(med => {
            allMedications.push({
              presc_med_id: med.presc_med_id || '',
              medication_name: med.prescribed_name || med.name || '',
              dosage: med.dosageStrength || '',
              frequency: med.frequency || '',
              image: med.image || '',
              presc_date: prescription.created_at || ''
            });
          });
        }
      });
      
      setMedications(allMedications);
      
      // Get medical records
      const medicalRecordsResponse = await axios.get(buildApiUrl(`/api/medical-records/patient/${userId}`));
      const medicalRecords = medicalRecordsResponse.data || [];
      
      // Create a map of dates to handle merging records properly
      const recordsByDate = {};
      
      // First add prescription data to the map
      prescriptions.forEach(prescription => {
        const date = prescription.created_at;
        const formattedDate = moment(date).format('YYYY-MM-DD');
        
        recordsByDate[formattedDate] = {
          presc_date: date,
          medications: (Array.isArray(prescription.medications) ? prescription.medications.map(med => ({
            name: med.prescribed_name || med.name || '',
            dosage: med.dosageStrength || ''
          })) : []),
          presc_id: prescription.presc_id,
          has_prescription: true,
          has_medical_record: false
        };
      });
      
      // Then add or merge medical record data
      medicalRecords.forEach(record => {
        const formattedDate = moment(record.record_date).format('YYYY-MM-DD');
        
        if (recordsByDate[formattedDate]) {
          // Update existing record
          recordsByDate[formattedDate].medical_data = record;
          recordsByDate[formattedDate].has_medical_record = true;
        } else {
          // Create new record
          recordsByDate[formattedDate] = {
            presc_date: record.record_date,
            medications: [],
            medical_data: record,
            has_prescription: false,
            has_medical_record: true
          };
        }
      });
      
      // Convert to array and sort by date
      const sortedRecords = Object.values(recordsByDate).sort((a, b) =>
        new Date(b.presc_date) - new Date(a.presc_date)
      );
      
      setMedicalRecords(sortedRecords);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMedications([]);
      setMedicalRecords([]);
    }
  };

  // Setup polling when component mounts
  useEffect(() => {
    // Initial fetch
    fetchMedications();
    fetchUserData();

    // Setup polling every 30 seconds
    const interval = setInterval(fetchMedications, 30000);
    setPollingInterval(interval);

    // Cleanup polling when component unmounts
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);
  
  // Update data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchMedications();
      fetchUserData();
    }, [])
  );

  const formatDate = (date) => moment(date).format('MMM DD, YYYY');

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

  const MedicationCard = ({ medication }) => {
    const [imageError, setImageError] = useState(false);
    
    // Better image URL handling
    const getImageUrl = (imagePath) => {
      if (!imagePath) {
        return null;
      }
      
      try {
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        
        // If image path already includes http/https
        if (imagePath.startsWith('http')) {
          const separator = imagePath.includes('?') ? '&' : '?';
          return `${imagePath}${separator}t=${timestamp}`;
        }
        
        // Otherwise, build the full URL
        return buildApiUrl(`${imagePath}?t=${timestamp}`);
      } catch (error) {
        console.error('Error with image URL:', error);
        return null;
      }
    };
  
    // First letter of medication name for fallback
    const firstLetter = medication.medication_name ? 
      medication.medication_name.charAt(0).toUpperCase() : 'M';
  
    return (
      <View style={styles.medicationCard}>
        <View style={styles.medicationImageContainer}>
          {medication.image && !imageError ? (
            <Image
              source={{ 
                uri: getImageUrl(medication.image),
                cache: 'reload',
              }}
              style={styles.medicationImage}
              resizeMode="contain"
              onError={() => {
                console.log('Image failed to load:', medication.image);
                setImageError(true);
              }}
            />
          ) : (
            <View style={[styles.medicationImage, styles.fallbackImage]}>
              <Text style={styles.fallbackText}>{firstLetter}</Text>
            </View>
          )}
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.medication_name}</Text>
          <Text style={styles.medicationDetails}>
            <Text style={{ fontFamily: 'Poppins_500Medium' }}>Dosage: </Text>
            {medication.dosage || 'Not specified'}
          </Text>
          <Text style={styles.medicationDetails}>
            <Text style={{ fontFamily: 'Poppins_500Medium' }}>Frequency: </Text>
            {medication.frequency || 'Not specified'}
          </Text>
        </View>
      </View>
    );
  };

  const RecordCard = ({ record }) => {
    const navigation = useNavigation();
    const [patientId, setPatientId] = useState(null);
  
    useEffect(() => {
      AsyncStorage.getItem('userId').then(id => setPatientId(id));
    }, []);
    
    const handleNavigation = (screenName) => {
      if (patientId && record.presc_date) {
        const formattedDate = moment(record.presc_date).startOf('day').format('YYYY-MM-DD');
        navigation.navigate(screenName, {
          patientId,
          date: formattedDate
        });
      }
    };
    
    return (
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.recordCard}
      >
        <View style={styles.recordHeader}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#4A90E2" />
            <Text style={styles.recordDate}>
              {moment(record.presc_date).format('MMMM D, YYYY')}
            </Text>
          </View>
        </View>
  
        {record.medications.length > 0 && (
          <View style={styles.medicationsContainer}>
            {record.medications.map((med, index) => (
              <View key={index} style={styles.medicationPill}>
                <Text style={styles.medicationPillText}>
                  {med.name}
                </Text>
              </View>
            ))}
          </View>
        )}
  
        <View style={styles.recordActions}>
          {record.has_medical_record && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigation('ViewMedRec')}
            >
              <FileText size={18} color="#4A90E2" />
              <Text style={styles.actionButtonText}>View Med Record</Text>
            </TouchableOpacity>
          )}
  
          {record.has_prescription && (
            <TouchableOpacity
              style={styles.prescriptionButton}
              onPress={() => {
                if (patientId) {
                  navigation.navigate('ViewPresc', {
                    patientId,
                    date: moment(record.presc_date).format('YYYY-MM-DD') 
                  });
                }
              }}
            >
              <FileText size={18} color="#4A90E2" />
              <Text style={styles.prescriptionButtonText}>View Prescription</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {userId ? <TopContainer patientId={userId} /> : <TopContainer />}
      <LinearGradient
        colors={['#F8FAFF', '#FFFFFF']}
        style={styles.headerGradient}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hello, {username}</Text>
          <Text style={styles.subtitleText}>
            Let's check for missing refills and order them right away
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'medications' && styles.activeTabButton]}
            onPress={() => handleTabSwitch('medications')}
          >
            <Text style={[styles.tabText, activeTab === 'medications' && styles.activeTabText]}>
              Medications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'records' && styles.activeTabButton]}
            onPress={() => handleTabSwitch('records')}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>
              Medical Records
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'records' && (
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
          </View>
        )}

        {showFromPicker && (
          <DateTimePicker
            value={fromDate}
            mode="date"
            display="default"
            onChange={handleFromDateChange}
            maximumDate={new Date()}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate}
            mode="date"
            display="default"
            onChange={handleToDateChange}
            minimumDate={fromDate}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.contentContainer}>
          {activeTab === 'medications' ? (
            <View>
              <Text style={styles.sectionTitle}>Your Medications</Text>
              {medications.length > 0 ? (
                medications.map((medication, index) => (
                  <LinearGradient
                    key={index}
                    colors={['#FFFFFF', '#F8FAFF']}
                    style={styles.cardGradient}
                  >
                    <MedicationCard medication={medication} />
                  </LinearGradient>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>
                    No medications found. Your prescribed medications will appear here.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.recordsContainer}>
              {medicalRecords.length > 0 ? (
                medicalRecords
                  .filter(record => {
                    const recordDate = moment(record.presc_date).startOf('day');
                    return recordDate.isBetween(moment(fromDate).startOf('day'), moment(toDate).endOf('day'), undefined, '[]');
                  })
                  .map((record, index) => (
                    <RecordCard key={index} record={record} />
                  ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>
                    No medical records found. Your medical history will be displayed here once available.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  padding: 20,
  paddingBottom: 10,
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 2 }, 
  shadowOpacity: 0.05, 
  shadowRadius: 4, 
  elevation: 2,
},
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: '#4A5568',
    lineHeight: 24,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTabButton: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
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
  contentContainer: {
    padding: 16,
  },
  recordsContainer: {
    gap: 16,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  recordHeader: {
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDate: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  recordBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  medicationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  medicationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  medicationPillText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#4A5568',
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  prescriptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  prescriptionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  bottomSpacing: {
    height: 80,
  },
  // Existing medication styles
  medicationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  medicationImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    overflow: 'hidden',
  },
  medicationImage: {
    width: '100%',
    height: '100%',
  },
  medicationInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
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
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginBottom: 16,
    marginLeft: 4,
  },
  cardGradient: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateContainer: {
    padding: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
  },
  fallbackImage: {
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A90E2',
  }
});

export default HomePatient;