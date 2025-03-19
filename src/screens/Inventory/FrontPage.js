import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  TextInput,
  ScrollView,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { buildApiUrl } from '../../configuration/config';

const { width } = Dimensions.get('window');

const FrontPage = ({ navigation }) => {
  const topContainerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [allMedications, setAllMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [stats, setStats] = useState({
    totalMedications: 0,
    lowStock: 0,
    expiringSoon: 0,
    totalInventory: 0
  });

  const fetchMedicationsAndNotifications = async () => {
    try {
      const categories = [
        { endpoint: 'medications', name: 'Diabetes' },
        { endpoint: 'cardiovascular-medications', name: 'Cardiovascular' },
        { endpoint: 'cancer-medications', name: 'Cancer' },
        { endpoint: 'kidney-disease-medicines', name: 'Kidney Disease' },
        { endpoint: 'stroke-medications', name: 'Stroke' },
        { endpoint: 'arthritis-medications', name: 'Arthritis' }
      ];
  
      const medications = [];
      for (const category of categories) {
        const response = await fetch(buildApiUrl(`/api/${category.endpoint}`));
        if (!response.ok) throw new Error(`Failed to fetch ${category.name} medications`);
        const categoryMeds = await response.json();
        categoryMeds.forEach(med => {
          med.category = category.name;
        });
        medications.push(...categoryMeds);
      }
  
      const currentDate = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
  
      let newNotifications = [];
      let lowStockCount = 0;
      let expiringSoonCount = 0;
      let totalUnits = 0;
  
      medications.forEach(medication => {
        if (medication.quantity <= medication.reorderPoint) {
          lowStockCount++;
          newNotifications.push({
            id: `lowstock-${medication.category}-${medication.id}`,
            type: 'lowStock',
            title: `Low Stock Warning - ${medication.category}`,
            message: `${medication.name} is running low (${medication.quantity} units remaining)`,
            timestamp: new Date(),
            priority: medication.quantity === 0 ? 'high' : 'medium',
            category: medication.category,
            medicationId: medication.id,
            clickable: true // Add clickable property for low stock notifications
          });
        }
  
        const expirationDate = new Date(medication.expirationDate);
        if (expirationDate <= thirtyDaysFromNow) {
          expiringSoonCount++;
          newNotifications.push({
            id: `expiring-${medication.category}-${medication.id}`,
            type: 'expiring',
            title: `Expiration Warning - ${medication.category}`,
            message: `${medication.name} expires on ${expirationDate.toLocaleDateString()}`,
            timestamp: new Date(),
            priority: expirationDate <= currentDate ? 'high' : 'medium',
            category: medication.category,
            medicationId: medication.id,
            clickable: false // Add clickable property for expiring notifications
          });
        }
  
        totalUnits += medication.quantity;
      });
  
      newNotifications.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return b.timestamp - a.timestamp;
      });
  
      const newStats = {
        totalMedications: medications.length,
        lowStock: lowStockCount,
        expiringSoon: expiringSoonCount,
        totalInventory: totalUnits
      };
  
      setAllMedications(medications);
      setStats(newStats);
      setNotifications(newNotifications);
  
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    // Only handle click if notification is clickable (low stock)
    if (notification.clickable) {
      // Remove the clicked notification
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Navigate to RestockingDetails for low stock notifications
      navigation.navigate('RestockingDetails', { 
        category: notification.category,
        medicationId: notification.medicationId 
      });
    }
  };

  useEffect(() => {
    fetchMedicationsAndNotifications();
    const interval = setInterval(fetchMedicationsAndNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setShowSearchResults(false);
      setFilteredMedications([]);
      return;
    }

    const searchResults = allMedications.filter(med => 
      med.name.toLowerCase().includes(query.toLowerCase()) ||
      med.category.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredMedications(searchResults);
    setShowSearchResults(true);
  };

  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => {
        setShowSearchResults(false);
        setSearchQuery('');
        navigation.navigate('MedicationDetails', { 
          category: item.category,
          medicationId: item.id 
        });
      }}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.searchResultGradient}
      >
        <View style={styles.searchResultContent}>
          <Text style={styles.searchResultName}>{item.name}</Text>
          <Text style={styles.searchResultCategory}>{item.category}</Text>
          <View style={styles.searchResultDetails}>
            <Text style={styles.searchResultStock}>Stock: {item.quantity}</Text>
            <Text style={styles.searchResultExpiry}>
              Expires: {new Date(item.expirationDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleCardPress = (cardType) => {
    switch (cardType) {
      case 'Total Medication':
        navigation.navigate('MedicationDetails');
        break;
      case 'Low Stock':
      case 'Expiring Soon':
        // Navigate to RestockingDetails for both Low Stock and Expiring Soon cards
        navigation.navigate('RestockingDetails');
        break;
      case 'Total Inventory':
        // Handle Total Inventory card press if needed
        break;
      default:
        break;
    }
  };

  const renderCard = (title, value, description) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => handleCardPress(title)}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider 
        ref={topContainerRef}
        notifications={notifications}
        onNotificationPress={handleNotificationPress}
      />
      <LinearGradient
        colors={['#F8FAFF', '#FFFFFF']}
        style={styles.headerGradient}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Medication Inventory</Text>
          <Text style={styles.subtitleText}>
            Manage your medical stock efficiently
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Search 
            size={20} 
            color="#4A90E2" 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
        </View>
      </LinearGradient>

      {showSearchResults ? (
        <FlatList
          data={filteredMedications}
          renderItem={renderMedicationItem}
          keyExtractor={item => `${item.category}-${item.id}`}
          contentContainerStyle={styles.searchResultsContainer}
          ListEmptyComponent={
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No medications found</Text>
            </View>
          }
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.quickStatsContainer}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.cardRow}>
              {renderCard(
                'Total Medication', 
                stats.totalMedications.toString(), 
                'Types of medications'
              )}
              {renderCard(
                'Low Stock', 
                stats.lowStock.toString(), 
                'Restock Warnings'
              )}
            </View>
            <View style={styles.cardRow}>
              {renderCard(
                'Expiring Soon', 
                stats.expiringSoon.toString(), 
                'Medications near expiry'
              )}
              {renderCard(
                'Total Inventory', 
                stats.totalInventory.toLocaleString(), 
                'Total medication units'
              )}
            </View>
          </View>

          <View style={styles.actionButtonsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MedicationDetails')}
            >
              <Icon name="list-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Medication Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('RestockingDetails')}
            >
              <Icon name="refresh-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Restocking Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  headerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  subHeaderText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 15,
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
    marginTop: 10,
  },
  quickStatsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: width * 0.42,
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 15,
    height: '100%',
    justifyContent: 'space-between', 
  },
  cardHeader: {
    marginBottom: 5, 
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  cardContent: {
    flex: 1, // Add this to allow content to expand
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 35,
    fontFamily: 'Poppins_700Bold',
    color: '#4A90E2',
    marginBottom: 8, // Reduced from 25
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    padding: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    marginLeft: 10,
  },
  searchResultsContainer: {
    padding: 20,
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
  searchResultItem: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchResultGradient: {
    padding: 16,
    borderRadius: 16,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2D3748',
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
    marginBottom: 4,
  },
  searchResultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  searchResultStock: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#718096',
  },
  searchResultExpiry: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#718096',
  },
  noNotificationsText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    paddingVertical: 20,
  }
});

export default FrontPage;