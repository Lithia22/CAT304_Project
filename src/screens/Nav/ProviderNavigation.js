import React, { useState, useEffect, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path } from 'react-native-svg';
import { useNotifications } from '../../../ProviderNotification';

const homeProviderScreens = [
  'HomeProvider',
  'ViewPatientMedRec',
  'EditPatientMedRec',
  'AddPatientMedRec',
];

const prescriptionProviderScreens = [
  'ProviderPresc',
  'ViewPatientPresc',
  'AddToCart',
  'OrderSummary',
  'EditPatientPresc',
  'AddPatientPresc',
  
];

const inventoryProviderScreens = [
    'FrontPage', 
    'MedicationInfo', 
    'RestockingDetails', 
    'MedicationDetails', 
    'DiabetesMedications', 
    'AddMedicationScreen', 
    'EditMedicationScreen', 
    'CardiovascularMedications', 
    'CancerMedications', 
    'AddCancerMedicationScreen', 
    'EditCancerMedScreen', 
    'CancerMedicationInfo', 
    'CardiovascularMedicationInfo', 
    'KidneyDiseaseMedications', 
    'StrokeMedications', 
    'ArthritisMedications', 
    'AddCardiovascularMedicationScreen', 
    'EditCardioMedScreen', 
    'AddKidneyMedicationScreen', 
    'EditKidneyMedScreen', 
    'KidneyMedicationInfo', 
    'AddStrokeMedicationScreen', 
    'EditStrokeMedScreen', 
    'StrokeMedicationInfo', 
    'AddArthritisMedicationScreen', 
    'EditArthritisMedScreen', 
    'ArthritisMedicationInfo',
];

const profileProviderScreens = [
  'EditProvider',
  'InfoProvider',
];

const navigationItems = [
  { screen: 'HomeProvider', icon: 'home', label: 'Home', relatedScreens: homeProviderScreens },
  { screen: 'ProviderPresc', icon: 'file-text', label: 'Presc', relatedScreens: prescriptionProviderScreens },
  { screen: 'FrontPage', icon: 'box', label: 'Inventory', relatedScreens: inventoryProviderScreens },
  { screen: 'EditProvider', icon: 'user', label: 'Profile', relatedScreens: profileProviderScreens },
];

export const TopContProvider = forwardRef(({ visible: propVisible, onClose: propOnClose, notifications: propNotifications, ...props }, ref) => {
  const navigation = useNavigation(); // Add this line to get navigation object
  const { notifications: hookNotifications } = useNotifications();
  const notifications = propNotifications || hookNotifications || [];
  const [showLocalNotifications, setShowLocalNotifications] = useState(false);

  // Combine both visibility states
  const isVisible = propVisible || showLocalNotifications;

  const handleBellPress = () => {
    setShowLocalNotifications(true);
  };

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    }
    setShowLocalNotifications(false);
  };

  const handleNotificationPress = (notification) => {
    handleClose();
    if (notification.type === 'lowStock') {
      navigation.navigate('RestockingDetails', { category: notification.category });
    } else if (notification.type === 'expiring') {
      navigation.navigate('MedicationDetails', { category: notification.category });
    }
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        item.priority === 'high' ? styles.highPriorityNotification : null
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <Icon 
        name={item.type === 'lowStock' ? 'alert-circle' : 'clock'} 
        size={24} 
        color={item.priority === 'high' ? '#FF4444' : '#FF9500'} 
        style={styles.notificationIcon}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.topContainer}>
      <View style={styles.topContainerContent}>
      <View style={styles.logoContainer}>
      <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
            <Path
              d="M10 32C7.21482 32 4.85185 31.0296 2.91111 29.0889C0.97037 27.1481 0 24.7852 0 22C0 20.6667 0.251852 19.3926 0.755556 18.1778C1.25926 16.963 1.98519 15.8815 2.93333 14.9333L14.9333 2.93333C15.8815 1.98519 16.963 1.25926 18.1778 0.755556C19.3926 0.251852 20.6667 0 22 0C24.7852 0 27.1481 0.97037 29.0889 2.91111C31.0296 4.85185 32 7.21482 32 10C32 11.3333 31.7481 12.6074 31.2444 13.8222C30.7407 15.037 30.0148 16.1185 29.0667 17.0667L17.0667 29.0667C16.1185 30.0148 15.037 30.7407 13.8222 31.2444C12.6074 31.7481 11.3333 32 10 32ZM21.8222 19.2889L26.5778 14.5778C27.1704 13.9852 27.6296 13.2889 27.9556 12.4889C28.2815 11.6889 28.4444 10.8593 28.4444 10C28.4444 8.22222 27.8148 6.7037 26.5556 5.44444C25.2963 4.18519 23.7778 3.55556 22 3.55556C21.1407 3.55556 20.3111 3.71852 19.5111 4.04444C18.7111 4.37037 18.0148 4.82963 17.4222 5.42222L12.7111 10.1778L21.8222 19.2889ZM10 28.4444C10.8593 28.4444 11.6889 28.2815 12.4889 27.9556C13.2889 27.6296 13.9852 27.1704 14.5778 26.5778L19.2889 21.8222L10.1778 12.7111L5.42222 17.4222C4.82963 18.0148 4.37037 18.7111 4.04444 19.5111C3.71852 20.3111 3.55556 21.1407 3.55556 22C3.55556 23.7778 4.18519 25.2963 5.44444 26.5556C6.7037 27.8148 8.22222 28.4444 10 28.4444Z"
              fill="#4A90E2"
            />
          </Svg>
        <Text style={styles.repillText}>RePill</Text>
      </View>
        <View style={styles.topIcons}>
          <TouchableOpacity
            onPress={handleBellPress}
            style={styles.iconWrapper}
          >
            <Icon name="bell" size={28} color="#4A90E2" />
            {notifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.iconWrapper}
          >
            <Icon name="log-out" size={28} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Icon name="x" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <Text style={styles.noNotificationsText}>No notifications</Text>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.notificationsList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
});

export const BottomNavProvider = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('HomeProvider');

  useEffect(() => {
    const currentRoute = navigation.getState().routes[navigation.getState().index].name;
    
    const activeSection = navigationItems.find(item => 
      item.relatedScreens.includes(currentRoute)
    );
    
    if (activeSection) {
      setActiveTab(activeSection.screen);
    } else {
      setActiveTab(currentRoute);
    }
  }, [isFocused, navigation]);

  const handleNavigation = (screen) => {
    setActiveTab(screen);
    navigation.navigate(screen);
  };

  const currentRoute = navigation.getState().routes[navigation.getState().index].name;

  return (
    <View style={styles.bottomNav}>
      {navigationItems.map(({ screen, icon, label, relatedScreens }) => (
        <TouchableOpacity
          key={screen}
          style={styles.navItem}
          onPress={() => handleNavigation(screen)}
        >
          <Icon
            name={icon}
            size={24}
            color={
              relatedScreens.includes(currentRoute) || activeTab === screen
                ? '#4A90E2'
                : '#9D9D9D'
            }
          />
          <Text
            style={[
              styles.navText,
              (relatedScreens.includes(currentRoute) || activeTab === screen) &&
                styles.activeNavText,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  topContainer: {
    width: '100%',
    height: 70, 
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
  },
  topContainerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
  },
  repillText: {
    color: '#383D46',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18, 
  },
  notificationIcon: {
    padding: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#9D9D9D',
    marginTop: 4,
    textAlign: 'center',
  },
  activeNavText: {
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 4, 
    marginLeft: 8, 
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 5,
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 10,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  highPriorityNotification: {
    borderLeftColor: '#FF4444',
    backgroundColor: '#FFF5F5',
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#95A5A6',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  noNotificationsText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    paddingVertical: 20,
  }
});