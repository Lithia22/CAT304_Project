import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MapPin, Clock, Phone, AlertCircle } from 'lucide-react-native';
import axios from 'axios';
import { buildApiUrl } from '../../configuration/config';
import { LinearGradient } from 'expo-linear-gradient';
import Error from '../../../Error';  // Import Error component
import Success from '../../../Success';  // Import Success component

const PickupDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, patientId } = route.params;
  const [loading, setLoading] = useState(false);

  // Add new state variables for Error and Success modals
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const pickupLocation = {
    name: "Hospital KPJ Ampang Puteri",
    address: "1, Jalan Mamanda 9, Taman Dato Ahmad Razali, 68000 Ampang, Selangor",
    operatingHours: "Monday - Friday: 9:00 AM - 5:00 PM",
    contactNumber: "+603-4289 5000"
  };

  const handleConfirmPickup = async () => {
    try {
      setLoading(true);
      
      await axios.patch(
        buildApiUrl(`/api/orders/${orderId}/status`),
        {
          status: 'confirmed',
          delivery_method: 'pickup'
        }
      );
      
      // Show success message
      setSuccessMessage('Pickup confirmed successfully');
      setShowSuccess(true);
      
      // Navigate after showing success message
      setTimeout(() => {
        navigation.navigate('OrderList', { patientId });
      }, 1500);
      
    } catch (err) {
      console.error('Error confirming pickup:', err);
      setErrorMessage('Failed to confirm pickup. Please try again.');
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

  const SectionHeader = ({ icon: Icon, title, color = "#4A90E2", titleColor = "#2D3748" }) => (
    <View style={styles.sectionHeader}>
      <Icon size={20} color={color} />
      <Text style={[styles.sectionTitleText, { color: titleColor }]}>{title}</Text>
    </View>
  );

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
          <Text style={styles.headerTitle}>Pickup Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formContainer}>
          {/* Location Section */}
          <View style={styles.section}>
            <SectionHeader icon={MapPin} title="Pickup Location" />
            <View style={styles.sectionContent}>
              <Text style={styles.facilityName}>{pickupLocation.name}</Text>
              <Text style={styles.address}>{pickupLocation.address}</Text>
            </View>
          </View>

          {/* Operating Hours Section */}
          <View style={styles.section}>
            <SectionHeader icon={Clock} title="Operating Hours" />
            <View style={styles.sectionContent}>
              <Text style={styles.hoursText}>{pickupLocation.operatingHours}</Text>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <SectionHeader icon={Phone} title="Contact Information" />
            <View style={styles.sectionContent}>
              <Text style={styles.contactNumber}>{pickupLocation.contactNumber}</Text>
            </View>
          </View>

          {/* Important Note Section */}
          <View style={[styles.section, styles.noteSection]}>
            <SectionHeader 
              icon={AlertCircle} 
              title="Important Note" 
              color="#92400E"
              titleColor="#92400E"
            />
            <View style={styles.sectionContent}>
              <Text style={styles.noteText}>
                Please bring your identification card and order number when collecting your medications.
                Orders must be picked up within 7 days of confirmation.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleConfirmPickup}
        >
          <Text style={styles.saveButtonText}>Confirm Pickup</Text>
        </TouchableOpacity>
      </View>

      {/* Add Error and Success components */}
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
    gap: 16,
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
  noteSection: {
    backgroundColor: '#FEF3C7',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
  },
  sectionContent: {
    paddingLeft: 32,
    gap: 4,
  },
  facilityName: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  address: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  hoursText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular',
  },
  contactNumber: {
    fontSize: 14,
    color: '#4A90E2',
    fontFamily: 'Poppins_500Medium',
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
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
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default PickupDetails;