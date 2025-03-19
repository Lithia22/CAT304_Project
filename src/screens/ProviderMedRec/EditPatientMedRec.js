import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import axios from 'axios';
import { buildApiUrl } from '../../configuration/config';


// Health status determination functions
const getHealthStatus = (value, type) => {
  const statusMap = {
    bmi: {
      ranges: [
        { max: 18.5, status: 'Low', color: '#FFB020' },
        { max: 25, status: 'Normal', color: '#14B8A6' },
        { max: 30, status: 'High', color: '#FFB020' },
        { max: Infinity, status: 'Very High', color: '#F04438' }
      ]
    },
    bp: {
      ranges: [
        { max: [120, 80], status: 'Normal', color: '#14B8A6' },
        { max: [130, 85], status: 'Medium', color: '#FFB020' },
        { max: Infinity, status: 'High', color: '#F04438' }
      ]
    },
    cholesterol: {
      ranges: [
        { max: 5.2, status: 'Normal', color: '#14B8A6' },
        { max: 6.2, status: 'Medium', color: '#FFB020' },
        { max: Infinity, status: 'High', color: '#F04438' }
      ]
    }
  };

  if (!value) return { status: 'No Data', color: '#64748B' };

  const ranges = statusMap[type].ranges;
  
  if (type === 'bp') {
    const [systolic, diastolic] = value.split('/').map(Number);
    return ranges.find(range => systolic < range.max[0] && diastolic < range.max[1]) || ranges[ranges.length - 1];
  }
  
  return ranges.find(range => value < range.max) || ranges[ranges.length - 1];
};

const MetricCard = ({ title, metrics, type, value, icon, onMetricChange }) => {
  const statusInfo = getHealthStatus(value, type);
  
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.metricsContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{metric.label}:</Text>
              <TextInput
                style={styles.metricInput}
                value={metric.value ? String(metric.value) : ''}
                onChangeText={(text) => onMetricChange(metric.field, text)}
                keyboardType={metric.keyboardType || 'numeric'}
                placeholder={`Enter ${metric.label}`}
                placeholderTextColor="#A0AEC0"
              />
              <Text style={styles.metricUnit}>{metric.unit}</Text>
            </View>
          ))}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.status}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const EditPatientMedRec = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId, recordDate } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [originalRecord, setOriginalRecord] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNextCheckupPicker, setShowNextCheckupPicker] = useState(false);

  const fetchMedicalRecord = async () => {
    try {
      const response = await axios.get(buildApiUrl(`/api/medical-records/patient/${patientId}/date/${recordDate}`));
      setRecord(response.data);
      setOriginalRecord(response.data);
    } catch (error) {
      console.error('Error fetching:', error);
      setError('Failed to load medical record');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMedicalRecord();
      return () => {
        setRecord(null);
        setOriginalRecord(null);
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setHasChanges(false);
      };
    }, [patientId, recordDate])
  );

  const handleMetricChange = (field, value) => {
    const newRecord = {
      ...record,
      [field]: value
    };
    setRecord(newRecord);
    const hasAnyChange = Object.keys(newRecord).some(key => {
      if (['id', 'created_at', 'updated_at', 'patient_id'].includes(key)) {
        return false;
      }
      const originalValue = originalRecord[key]?.toString() || '';
      const newValue = newRecord[key]?.toString() || '';
      return originalValue !== newValue;
    });
    
    setHasChanges(hasAnyChange);
  };

  const handleNextCheckupDateChange = (event, selectedDate) => {
    setShowNextCheckupPicker(false);
    if (selectedDate) {
      handleMetricChange('next_checkup_date', selectedDate.toISOString());
    }
  };

  const updateMedicalRecord = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        buildApiUrl(`/api/medical-records/${record.record_id}`), 
        record
      );
      setSuccessMessage('Medical record updated successfully');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error('Error updating:', error.response || error);
      setError(error.response?.data?.message || 'Failed to update medical record');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <Text style={styles.headerTitle}>Edit Medical Record</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={styles.dateBanner}>
          <View style={styles.dateContainer}>
            <Calendar size={24} color="#4A90E2" />
            <Text style={styles.dateText}>{formatDate(record?.record_date || recordDate)}</Text>
          </View>
        </View>

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
        <MetricCard
          title="Body Mass Index (BMI)"
          type="bmi"
          value={record?.bmi}
          metrics={[
            { label: "BMI", value: record?.bmi, unit: "kg/m²", field: "bmi" },
            { label: "Weight", value: record?.weight, unit: "kg", field: "weight" },
            { label: "Height", value: record?.height, unit: "m", field: "height" }
          ]}
          onMetricChange={handleMetricChange}
          icon={
            <Svg width="81" height="81" viewBox="0 0 81 81" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.23611 78.1389C4.97685 79.8796 7.06944 80.75 9.51389 80.75H71.7361C74.1806 80.75 76.2731 79.8796 78.0139 78.1389C79.7546 76.3981 80.625 74.3056 80.625 71.8611V9.63889C80.625 7.19444 79.7546 5.10185 78.0139 3.36111C76.2731 1.62037 74.1806 0.75 71.7361 0.75H9.51389C7.06944 0.75 4.97685 1.62037 3.23611 3.36111C1.49537 5.10185 0.625 7.19444 0.625 9.63889V71.8611C0.625 74.3056 1.49537 76.3981 3.23611 78.1389ZM71.7361 71.8611H9.51389V9.63889H71.7361V71.8611Z"
                fill="#4A90E2"
              />
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M40.625 40.75C44.3287 40.75 47.4768 39.4537 50.0694 36.8611C52.662 34.2685 53.9583 31.1204 53.9583 27.4167C53.9583 23.713 52.662 20.5648 50.0694 17.9722C47.4768 15.3796 44.3287 14.0833 40.625 14.0833C36.9213 14.0833 33.7731 15.3796 31.1806 17.9722C28.588 20.5648 27.2917 23.713 27.2917 27.4167C27.2917 31.1204 28.588 34.2685 31.1806 36.8611C33.7731 39.4537 36.9213 40.75 40.625 40.75ZM32.4028 28.9722C32.8472 29.4167 33.3657 29.6389 33.9583 29.6389C34.5509 29.6389 35.0694 29.4167 35.5139 28.9722C35.9583 28.5278 36.1806 28.0093 36.1806 27.4167C36.1806 26.8241 35.9583 26.3056 35.5139 25.8611C35.0694 25.4167 34.5509 25.1944 33.9583 25.1944C33.3657 25.1944 32.8472 25.4167 32.4028 25.8611C31.9583 26.3056 31.7361 26.8241 31.7361 27.4167C31.7361 28.0093 31.9583 28.5278 32.4028 28.9722Z"
                fill="#4A90E2"
              />
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M40.625 40.75C44.3287 40.75 47.4768 39.4537 50.0694 36.8611C52.662 34.2685 53.9583 31.1204 53.9583 27.4167C53.9583 23.713 52.662 20.5648 50.0694 17.9722C47.4768 15.3796 44.3287 14.0833 40.625 14.0833C36.9213 14.0833 33.7731 15.3796 31.1806 17.9722C28.588 20.5648 27.2917 23.713 27.2917 27.4167C27.2917 31.1204 28.588 34.2685 31.1806 36.8611C33.7731 39.4537 36.9213 40.75 40.625 40.75Z"
                fill="#383D46"
              />
              <Circle cx="35.625" cy="27.4167" r="2" fill="#FFF" />
              <Circle cx="40.625" cy="27.4167" r="2" fill="#FFF" />
              <Circle cx="45.625" cy="27.4167" r="2" fill="#FFF" />
            </Svg>
          } 
        />

        <MetricCard
          title="Blood Pressure"
          type="bp"
          value={record?.blood_pressure}
          metrics={[
            { label: "Blood Pressure", value: record?.blood_pressure, unit: "mmHg", field: "blood_pressure", keyboardType: "default" },
            { label: "Heart Rate", value: record?.heart_rate, unit: "bpm", field: "heart_rate" }
          ]}
          onMetricChange={handleMetricChange}
          icon={
            <Svg width="80" height="78" viewBox="0 0 80 78" fill="none">
              <Path 
                d="M20 56.3333C19.2667 56.3333 18.5667 56.1347 17.9 55.7375C17.2333 55.3403 16.7333 54.7444 16.4 53.95L9.5 39H0V30.3333H12C12.7333 30.3333 13.4333 30.5319 14.1 30.9292C14.7667 31.3264 15.2667 31.9222 15.6 32.7167L20 42.25L32.4 15.3833C32.7333 14.6611 33.2333 14.1194 33.9 13.7583C34.5667 13.3972 35.2667 13.2167 36 13.2167C36.7333 13.2167 37.4333 13.3972 38.1 13.7583C38.7667 14.1194 39.2667 14.6611 39.6 15.3833L46.3 29.9C45.1 30.6944 43.95 31.525 42.85 32.3917C41.75 33.2583 40.7333 34.2333 39.8 35.3167L36 27.0833L23.6 53.95C23.2667 54.7444 22.7667 55.3403 22.1 55.7375C21.4333 56.1347 20.7333 56.3333 20 56.3333Z" 
                fill="#383D46"
              />
              <Path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M0 21.6667V8.66667C0 6.28333 0.783333 4.24306 2.35 2.54583C3.91667 0.848611 5.8 0 8 0H72C74.2 0 76.0833 0.848611 77.65 2.54583C79.2167 4.24306 80 6.28333 80 8.66667V32.5H72V8.66667H8V21.6667H0ZM34.7 69.3333H8C5.8 69.3333 3.91667 68.4847 2.35 66.7875C0.783333 65.0903 0 63.05 0 60.6667V47.6667H8V60.6667H32.3C32.5 62.1833 32.8 63.6639 33.2 65.1083C33.6 66.5528 34.1 67.9611 34.7 69.3333Z" 
                fill="#4A90E2"
              />
              <Path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M60 78C54.4667 78 49.75 75.8875 45.85 71.6625C41.95 67.4375 40 62.3278 40 56.3333C40 50.3389 41.95 45.2292 45.85 41.0042C49.75 36.7792 54.4667 34.6667 60 34.6667C65.5333 34.6667 70.25 36.7792 74.15 41.0042C78.05 45.2292 80 50.3389 80 56.3333C80 62.3278 78.05 67.4375 74.15 71.6625C70.25 75.8875 65.5333 78 60 78ZM69.9 48.6417L60.8 58.5L58 55.4667L67.1 45.6083L69.9 48.6417Z" 
                fill="#383D46"
              />
            </Svg>
          } 
        />

        <MetricCard
          title="Cholesterol Panel"
          type="cholesterol"
          value={record?.cholesterol}
          metrics={[
            { label: "Total Cholesterol", value: record?.cholesterol, unit: "mmol/L", field: "cholesterol" },
            { label: "HDL", value: record?.hdl, unit: "mmol/L", field: "hdl" },
            { label: "LDL", value: record?.ldl, unit: "mmol/L", field: "ldl" },
            { label: "Triglycerides", value: record?.triglyceride, unit: "mmol/L", field: "triglyceride" }
          ]}
          onMetricChange={handleMetricChange}
          icon={
            <Svg width="90" height="68" viewBox="0 0 90 68" fill="none">
              <Path d="M37.7436 34.0001C37.7436 41.318 31.5655 47.2839 23.9022 47.2839C16.239 47.2839 10.0609 41.318 10.0609 34.0001C10.0609 26.6822 16.239 20.7163 23.9022 20.7163C31.5655 20.7163 37.7436 26.6822 37.7436 34.0001Z" fill="#4A90E2" stroke="black"/>
              <Path d="M58.7775 34.0001C58.7775 41.318 52.5994 47.2839 44.9362 47.2839C37.273 47.2839 31.0948 41.318 31.0948 34.0001C31.0948 26.6822 37.273 20.7163 44.9362 20.7163C52.5994 20.7163 58.7775 26.6822 58.7775 34.0001Z" fill="#383D46" stroke="black"/>
              <Path d="M89.3723 54.2162C89.3723 61.5341 83.1942 67.4999 75.531 67.4999C67.8677 67.4999 61.6896 61.5341 61.6896 54.2162C61.6896 46.8982 67.8677 40.9324 75.531 40.9324C83.1942 40.9324 89.3723 46.8982 89.3723 54.2162Z" fill="#383D46" stroke="black"/>
              <Path d="M28.1827 54.2162C28.1827 61.5341 22.0046 67.4999 14.3413 67.4999C6.6781 67.4999 0.5 61.5341 0.5 54.2162C0.5 46.8982 6.6781 40.9324 14.3413 40.9324C22.0046 40.9324 28.1827 46.8982 28.1827 54.2162Z" fill="#383D46" stroke="black"/>
              <Path d="M47.3044 54.2162C47.3044 61.5341 41.1263 67.4999 33.4631 67.4999C25.7999 67.4999 19.6218 61.5341 19.6218 54.2162C19.6218 46.8982 25.7999 40.9324 33.4631 40.9324C41.1263 40.9324 47.3044 46.8982 47.3044 54.2162Z" fill="#383D46" stroke="black"/>
              <Path d="M70.2505 54.2162C70.2505 61.5341 64.0724 67.4999 56.4092 67.4999C48.746 67.4999 42.5679 61.5341 42.5679 54.2162C42.5679 46.8982 48.746 40.9324 56.4092 40.9324C64.0724 40.9324 70.2505 46.8982 70.2505 54.2162Z" fill="#4A90E2" stroke="black"/>
              <Path d="M81.7236 34.0001C81.7236 41.318 75.5455 47.2839 67.8823 47.2839C60.2191 47.2839 54.041 41.318 54.041 34.0001C54.041 26.6822 60.2191 20.7163 67.8823 20.7163C75.5455 20.7163 81.7236 26.6822 81.7236 34.0001Z" fill="#4A90E2" stroke="black"/>
              <Path d="M51.1288 13.7838C51.1288 21.1017 44.9507 27.0676 37.2874 27.0676C29.6242 27.0676 23.4461 21.1017 23.4461 13.7838C23.4461 6.46585 29.6242 0.5 37.2874 0.5C44.9507 0.5 51.1288 6.46585 51.1288 13.7838Z" fill="#4A90E2" stroke="black"/>
              <Path d="M72.1627 13.7838C72.1627 21.1017 65.9846 27.0676 58.3214 27.0676C50.6581 27.0676 44.48 21.1017 44.48 13.7838C44.48 6.46585 50.6581 0.5 58.3214 0.5C65.9846 0.5 72.1627 6.46585 72.1627 13.7838Z" fill="#383D46" stroke="black"/>
            </Svg>
          }
        />

        <View style={[styles.card, { marginBottom: 80 }]}>
          <View style={styles.cardContent}>
            <View style={styles.metricsContainer}>
              <Text style={styles.cardTitle}>Next Checkup Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowNextCheckupPicker(true)}
              >
                <Calendar size={20} color="#4A90E2" style={styles.datePickerIcon} />
                <Text style={styles.datePickerText}>
                  {moment(record.next_checkup_date).format('YYYY/MM/DD')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {showNextCheckupPicker && (
        <DateTimePicker
          value={new Date(record.next_checkup_date || new Date())}
          mode="date"
          display="default"
          onChange={handleNextCheckupDateChange}
        />
      )}

      {hasChanges && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={updateMedicalRecord}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
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
});

export default EditPatientMedRec;