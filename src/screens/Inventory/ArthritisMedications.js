import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { AlertCircle, Plus, Edit2, Trash2, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { buildApiUrl } from '../../configuration/config';
import axios from 'axios';
import { Image } from 'react-native';
import { Alert } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import Error from '../../../Error'; 
import Success from '../../../Success';

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
            Are you sure you want to delete this medication? This action cannot be undone.
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

const MedicationCard = ({ medication, onEdit, onDelete }) => {
  const navigation = useNavigation();
  
  const calculateStatus = () => {
    if (medication.quantity <= medication.reorderPoint) {
      return medication.quantity === 0 ? 'Near Restock' : 'Low Stock';
    }
    return 'In Stock';
  };

  const statusInfo = {
    'In Stock': { color: '#14B8A6', status: 'In Stock' },
    'Low Stock': { color: '#FFB020', status: 'Low Stock' },
    'Near Restock': { color: '#F04438', status: 'Near Restock' }
  };

  const currentStatus = statusInfo[calculateStatus()];
  
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>{medication.name}</Text>
          {medication.batch && (
            <Text style={styles.batchText}>#{medication.batch}</Text>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
            <Edit2 size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <Trash2 size={20} color="#F04438" />
          </TouchableOpacity>
        </View>
      </View>

      {medication.image && (
        <Image
          source={{ uri: buildApiUrl(medication.image) }}
          style={styles.medicationImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.color + '20' }]}>
          <Text style={[styles.statusText, { color: currentStatus.color }]}>
            {currentStatus.status}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => navigation.navigate('ArthritisMedicationInfo', { id: medication.id })}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const ArthritisMedications = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [medicationToDelete, setMedicationToDelete] = useState(null);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(buildApiUrl('/api/arthritis-medications'));
      
      const medicationsWithStatus = response.data.map(medication => ({
        ...medication,
        status: medication.quantity <= medication.reorderPoint 
          ? (medication.quantity === 0 ? 'Near Restock' : 'Low Stock')
          : 'In Stock'
      }));
      
      setMedications(medicationsWithStatus);
      setError(null);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setMedicationToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(buildApiUrl(`/api/arthritis-medications/${medicationToDelete}`));
      await fetchMedications();
      setShowDeleteModal(false);
      setMedicationToDelete(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting medication:', error);
      setShowDeleteModal(false);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
    const unsubscribe = navigation.addListener('focus', fetchMedications);
    return unsubscribe;
  }, [navigation]);

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.batch && med.batch.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <Text style={styles.headerTitle}>Arthritis</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddArthritisMedicationScreen')}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search 
            size={20} 
            color="#4A90E2" 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or batch"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>

        {error && (
          <View style={styles.messageContainer}>
            <AlertCircle color="#EF4444" size={24} />
            <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredMedications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onEdit={() => navigation.navigate('EditArthritisMedScreen', { 
              medicationId: medication.id
            })}
            onDelete={() => handleDelete(medication.id)}
          />
        ))}
      </ScrollView>
      
      <BottomNavProvider />
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMedicationToDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      <Success
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Medication deleted successfully!"
      />

      <Error
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message="Failed to delete medication. Please try again later."
      />
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
  addButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 12,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#2D3748',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
  },
  batchText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4A5568',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  medicationImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  viewDetailsButton: {
    backgroundColor: '#E9F3FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewDetailsText: {
    color: '#4A90E2',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
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
});

export default ArthritisMedications;