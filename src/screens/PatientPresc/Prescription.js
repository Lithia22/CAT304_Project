//Patient's site: Prescription.js
import React, { useState, useEffect } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'lucide-react-native';
import { buildApiUrl } from '../../configuration/config';
import DateTimePicker from '@react-native-community/datetimepicker';

const Prescription = () => {
  const navigation = useNavigation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDate, setFromDate] = useState(new Date('2024-01-01'));
  const [toDate, setToDate] = useState(new Date());

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.get(buildApiUrl(`/api/prescriptions/patient/${userId}`));
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const PrescriptionCard = ({ prescription }) => {
    const [patientId, setPatientId] = useState(null);
  
    useEffect(() => {
      AsyncStorage.getItem('userId').then(id => setPatientId(id));
    }, []);
  
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ViewPresc', {
          patientId,
          date: prescription.created_at
        })}
      >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.prescriptionCard}
      >
        <View style={styles.prescriptionHeader}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#4A90E2" />
            <Text style={styles.prescriptionDate}>
              {moment(prescription.created_at).format('MMMM D, YYYY')}
            </Text>
          </View>
        </View>

        <View style={styles.medicationsContainer}>
          {prescription.medications.map((med, index) => (
            <View key={index} style={styles.medicationPill}>
              <Text style={styles.medicationPillText}>{med.name}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      </TouchableOpacity>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <TopContainer />
      <LinearGradient
        colors={['#F8FAFF', '#FFFFFF']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Your Prescriptions</Text>
          <Text style={styles.subtitleText}>
            View and manage your prescription history
          </Text>
        </View>
      </LinearGradient>

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading prescriptions...</Text>
            </View>
          ) : prescriptions.length > 0 ? (
            prescriptions
              .filter(prescription => {
                const prescDate = moment(prescription.created_at).startOf('day');
                return prescDate.isBetween(
                  moment(fromDate).startOf('day'),
                  moment(toDate).endOf('day'),
                  undefined,
                  '[]'
                );
              })
              .map((prescription, index) => (
                <PrescriptionCard key={index} prescription={prescription} />
              ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No prescriptions found. Your prescription history will appear here.
              </Text>
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
  headerContainer: {
    marginBottom: 10,
  },
  headerText: {
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
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  contentContainer: {
    padding: 16,
  },
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  prescriptionHeader: {
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#4A5568',
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
  bottomSpacing: {
    height: 80,
  },
});

export default Prescription;