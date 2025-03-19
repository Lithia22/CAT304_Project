import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { buildApiUrl } from '../../configuration/config';

const MedicationInfo = ({ route }) => {
  const { id } = route.params || {};
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const windowWidth = Dimensions.get('window').width;

  const fetchMedicationDetails = async () => {
    try {
      if (!id) throw new Error('No medication ID provided');
      
      // Log the request details
      console.log('Attempting to fetch medication with ID:', id);
      const url = buildApiUrl(`/api/cardiovascular-medications/${id}`);
      console.log('Request URL:', url);
  
      // Add headers and modify fetch configuration
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
  
      // Log the response details
      console.log('Response status:', response.status);
      const responseData = await response.text();
      console.log('Raw response:', responseData);
  
      if (!response.ok) {
        throw new Error(responseData);
      }
  
      const data = JSON.parse(responseData);
      console.log('Parsed data:', data);
      
      setMedication(data);
      setError(null);
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
      Alert.alert('Error', 'Failed to load medication details. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMedicationDetails();
    } else {
      setError('No medication ID provided');
      setLoading(false);
    }
  }, [id]);

  const getStatusColor = (quantity, reorderPoint) => {
    if (quantity <= 0) return '#DC2626'; // Red for out of stock
    if (quantity <= reorderPoint) return '#FFA500'; // Orange for low stock
    return '#16A34A'; // Green for in stock
  };

  const getStatusText = (quantity, reorderPoint) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= reorderPoint) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loadingText}>Loading medication details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="warning" size={48} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMedicationDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!medication) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No medication details available.</Text>
      </View>
    );
  }

  const status = getStatusText(medication.quantity, medication.reorderPoint);
  const statusColor = getStatusColor(medication.quantity, medication.reorderPoint);

  return (
    <ScrollView style={styles.container}>
      {/* Medication Image */}
      <View style={styles.imageContainer}>
        {medication?.image ? (
          <Image 
            source={{ uri: buildApiUrl(medication.image) }}
            style={styles.medicationImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="medical" size={48} color="#94A3B8" />
          </View>
        )}
      </View>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.medicationName}>{medication.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.cardsContainer}>
        {/* Stock Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={22} color="#0EA5E9" />
            <Text style={styles.cardTitle}>Stock Information</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Stock</Text>
              <Text style={styles.infoValue}>{medication.quantity} units</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reorder Point</Text>
              <Text style={styles.infoValue}>{medication.reorderPoint} units</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Batch Number</Text>
              <Text style={styles.infoValue}>{medication.batch || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={22} color="#0EA5E9" />
            <Text style={styles.cardTitle}>Medication Details</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dosage Form</Text>
              <Text style={styles.infoValue}>{medication.dosageForm}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Strength</Text>
              <Text style={styles.infoValue}>{medication.dosageStrength}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>
                RM {parseFloat(medication.price).toFixed(2)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expiration Date</Text>
              <Text style={styles.infoValue}>
                {new Date(medication.expirationDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  medicationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  medicationName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cardsContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MedicationInfo;