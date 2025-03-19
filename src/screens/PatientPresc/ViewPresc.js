import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import moment from 'moment';
import { buildApiUrl } from '../../configuration/config';

const ViewPresc = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prescription, setPrescription] = useState(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const { patientId, date } = route.params;
        const formattedDate = moment(date).startOf('day').format('YYYY-MM-DD');
        const url = buildApiUrl(`/api/prescriptions/patient/${patientId}/date/${formattedDate}`);
        const response = await axios.get(url);
        
        // Sort medications by med_id if it exists in the response
        if (response.data.medications) {
          response.data.medications.sort((a, b) => {
            // Assuming med_id is a number or string that can be compared
            return (a.med_id || 0) - (b.med_id || 0);
          });
        }
        
        setPrescription(response.data);
        console.log('Sorted Prescription data:', response.data);
      } catch (err) {
        console.error('Error:', err.response?.data?.message || err.message);
        setError(err.response?.data?.message || 'Failed to fetch prescription');
      } finally {
        setLoading(false);
      }
    };
  
    fetchPrescription();
  }, [route.params]);

  const getExpiryStatus = (expiryDate) => {
    const now = moment();
    const expiry = moment(expiryDate);
    const daysUntilExpiry = expiry.diff(now, 'days');

    if (daysUntilExpiry < 0) {
      return {
        status: 'Expired',
        color: '#EF4444', // Red
        backgroundColor: '#FEE2E2',
        icon: 'alert'
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        status: 'Expiring Soon',
        color: '#F59E0B', // Yellow
        backgroundColor: '#FEF3C7',
        icon: 'warning'
      };
    } else {
      return {
        status: 'Valid',
        color: '#10B981', // Green
        backgroundColor: '#D1FAE5',
        icon: 'valid'
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopContainer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
        <BottomNavigation />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TopContainer />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <BottomNavigation />
      </View>
    );
  }

  const formatDate = (dateString) => {
    return moment(dateString).format('MMMM D, YYYY');
  };

  const expiryStatus = getExpiryStatus(prescription.expiry_date);
  
  const MedicationCard = ({ medication }) => {
    const [imageError, setImageError] = useState(false);
    
    // Construct the full image URL with cache busting
    const getImageUrl = (imagePath) => {
      if (!imagePath) {
        console.log('No image path provided');
        return null;
      }
      
      try {
        // If the image path already includes http/https, add timestamp to URL
        if (imagePath.startsWith('http')) {
          const separator = imagePath.includes('?') ? '&' : '?';
          return `${imagePath}${separator}t=${Date.now()}`;
        }
        
        // Otherwise, append it to your API base URL with timestamp
        const baseUrl = buildApiUrl(`${imagePath}`);
        const fullUrl = `${baseUrl}?t=${Date.now()}`;
        console.log(':', fullUrl);
        return fullUrl;
      } catch (error) {
        console.error('Error constructing image URL:', error);
        return null;
      }
    };

    return (
      <View style={styles.medicationCard}>
        <View style={styles.medicationImageContainer}>
          {!imageError ? (
            <Image
              source={{ 
                uri: getImageUrl(medication.image),
                // Disable caching at Image component level
                cache: 'reload',
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                }
              }}
              style={styles.medicationImage}
              resizeMode="contain"
              onError={(error) => {
                console.error('Image loading error:', error.nativeEvent.error);
                setImageError(true);
              }}
              onLoad={() => console.log('Image loaded successfully:', medication.image)}
            />
          ) : (
            <View style={[styles.medicationImage, styles.fallbackImage]}>
              <Text style={styles.fallbackText}>
                {medication.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDetails}>
            <Text style={{ fontFamily: 'Poppins_500Medium' }}>Dosage: </Text>
            {medication.dosageStrength} {medication.dosageForm}
          </Text>
          <Text style={styles.medicationDetails}>
            <Text style={{ fontFamily: 'Poppins_500Medium' }}>Frequency: </Text>
            {medication.frequency}
          </Text>
        </View>
      </View>
    );
  };
  

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
          <Text style={styles.headerTitle}>Prescription</Text>
          <View style={styles.backButtonContainer} />
        </View>

        <View style={styles.dateBanner}>
          <View style={styles.dateContainer}>
            <Calendar size={24} color="#4A90E2" />
            <Text style={styles.dateText}>{formatDate(prescription.created_at)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.prescriptionCard}
        >
          <View style={[styles.expiryBanner, { backgroundColor: expiryStatus.backgroundColor }]}>
            <AlertCircle size={16} color={expiryStatus.color} />
            <Text style={[styles.expiryText, { color: expiryStatus.color }]}>
              {expiryStatus.status} - Expires: {formatDate(prescription.expiry_date)}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Prescribed Medications</Text>
          
          {prescription?.medications?.map((medication, index) => (
            <LinearGradient
              key={index}
              colors={['#FFFFFF', '#F8FAFF']}
              style={styles.cardGradient}
            >
              <MedicationCard medication={medication} />
            </LinearGradient>
          ))}
        </LinearGradient>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  prescriptionCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  expiryText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
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
});

export default ViewPresc;