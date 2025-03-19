import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { Search } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { buildApiUrl } from '../../configuration/config';

const HomeProvider = () => {
  const navigation = useNavigation();
  const [groupedPatients, setGroupedPatients] = useState({
    new: [],
    existing: []
  });
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState(null);
  const [providerName, setProviderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProviderData = async () => {
        try {
          const id = await AsyncStorage.getItem('userId');
          setProviderId(id);
          if (id) {
            await fetchAssignedPatients(id);
          }
        } catch (error) {
          console.error('Error fetching provider data:', error);
          Alert.alert('Error', 'Failed to load provider data');
        }
      };

      fetchProviderData();
    }, [])
  );

  useEffect(() => {
    if (groupedPatients) {
      const allPatients = [...(groupedPatients.new || []), ...(groupedPatients.existing || [])];
      const filtered = allPatients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toString().includes(searchQuery)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, groupedPatients.new, groupedPatients.existing]);

  const fetchAssignedPatients = async (providerId) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/providers/${providerId}/patients`));
      setGroupedPatients(response.data.grouped);
      setProviderName(response.data.provider.username);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load patient list');
      setLoading(false);
    }
  };

  const renderPatientCard = (patient, type) => (
    <TouchableOpacity
      key={patient.id}
      style={styles.patientCard}
      onPress={() => navigation.navigate('ViewPatientMedRec', { patientId: patient.id })}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.leftContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{patient.full_name[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.patientName}>{patient.full_name}</Text>
              <Text style={styles.patientId}>Patient ID: {patient.id}</Text>
            </View>
          </View>
          {getStatusBadge(type)}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const getStatusBadge = (type) => {
    const statusConfig = {
      new: { text: 'New Patient', color: '#4299E1', bgColor: '#E6F6FF' },
      existing: { text: 'Existing Patient', color: '#4299E1', bgColor: '#E6F6FF' }
    };

    return (
      <View style={[styles.statusBadge, { backgroundColor: statusConfig[type].bgColor }]}>
        <Text style={[styles.statusBadgeText, { color: statusConfig[type].color }]}>
          {statusConfig[type].text}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your patients...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider />
      <LinearGradient
        colors={['#F8FAFF', '#FFFFFF']}
        style={styles.headerGradient}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Hello, {providerName || 'Provider'}
          </Text>
          <Text style={styles.subtitleText}>
            Manage your patients and their medical records
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Search style={styles.searchIcon} size={20} color="#4A90E2" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients by name or ID"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {searchQuery ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {filteredPatients.length > 0 ? (
              filteredPatients.map(patient => {
                const type = groupedPatients.new.find(p => p.id === patient.id) ? 'new' : 'existing';
                return renderPatientCard(patient, type);
              })
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No patients found</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {groupedPatients.new.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderNew}>
                  <Text style={styles.sectionTitleNew}>New Patients</Text>
                  <View style={styles.sectionDivider} />
                </View>
                {groupedPatients.new.map(patient => renderPatientCard(patient, 'new'))}
              </View>
            )}
            {groupedPatients.existing.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderExisting}>
                  <Text style={styles.sectionTitleExisting}>Existing Patients</Text>
                  <View style={styles.sectionDivider} />
                </View>
                {groupedPatients.existing.map(patient => renderPatientCard(patient, 'existing'))}
              </View>
            )}
          </>
        )}
        <View style={styles.bottomSpacing} />
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
    marginBottom: 15,
  },
  welcomeText: {
    color: '#000',
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: '#4A5568',
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    marginTop: 4,
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
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginLeft: 8,
  },
  patientCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
  },
  patientId: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#718096',
  },
  bottomSpacing: {
    height: 80,
  },
  sectionHeaderNew: {
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeaderExisting: {
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitleNew: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4299E1',
    marginBottom: 8,
  },
  sectionTitleExisting: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: '#E2E8F0',
    width: '100%',
    borderRadius: 1,
  },
});

export default HomeProvider;