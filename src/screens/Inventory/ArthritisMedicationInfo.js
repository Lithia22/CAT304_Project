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
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { buildApiUrl } from '../../configuration/config';

const ArthritisMedicationInfo = ({ route }) => {
  const navigation = useNavigation();
  const { id } = route.params || {};
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const windowWidth = Dimensions.get('window').width;

  const fetchMedicationDetails = async () => {
    try {
      if (!id) throw new Error('No medication ID provided');
      const response = await fetch(buildApiUrl(`/api/arthritis-medications/${id}`));
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch medication details');
      }
      const data = await response.json();
      setMedication(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching medication details:', error);
      setError(error.message);
      Alert.alert('Error', error.message || 'Failed to load medication details');
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
    if (quantity <= 0) return '#F04438';
    if (quantity <= reorderPoint) return '#FFB020';
    return '#14B8A6';
  };

  const getStatusText = (quantity, reorderPoint) => {
    if (quantity <= 0) return 'Near Restock';
    if (quantity <= reorderPoint) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopContProvider />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
        <BottomNavProvider />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TopContProvider />
        <View style={styles.messageContainer}>
          <AlertCircle color="#EF4444" size={24} />
          <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
        </View>
        <BottomNavProvider />
      </SafeAreaView>
    );
  }

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <TopContProvider />
        <View style={styles.messageContainer}>
          <AlertCircle color="#EF4444" size={24} />
          <Text style={[styles.messageText, styles.errorText]}>No medication details available.</Text>
        </View>
        <BottomNavProvider />
      </SafeAreaView>
    );
  }

  const status = getStatusText(medication.quantity, medication.reorderPoint);
  const statusColor = getStatusColor(medication.quantity, medication.reorderPoint);

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
          <Text style={styles.headerTitle}>Medication Details</Text>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.card}
        >
          {medication.image && (
            <Image
              source={{ uri: buildApiUrl(medication.image) }}
              style={styles.medicationImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            {medication.batch && (
              <Text style={styles.batchText}>#{medication.batch}</Text>
            )}
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Stock Information</Text>
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
        </LinearGradient>

        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Medication Details</Text>
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
        </LinearGradient>
      </ScrollView>

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
  placeholderView: {
    width: 40,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  messageText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  errorText: {
    color: '#EF4444',
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
  medicationImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 16,
  },
  medicationName: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginBottom: 4,
  },
  batchText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#4A5568',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#4A5568',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#2D3748',
  }
});

export default ArthritisMedicationInfo;