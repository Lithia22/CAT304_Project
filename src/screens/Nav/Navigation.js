import React, { useState, useEffect, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path } from 'react-native-svg';
import { usePatientNotifications } from '../../../PatientNotification';

const homeScreens = [
  'HomePatient',
  'ViewMedRec',
];

const prescriptionScreens = [
  'Prescription',
  'ViewPresc',
];

const orderScreens = [
  'OrderList',
  'DeliveryDetails',
  'PickupDetails',
];

const profileScreens = [
  'EditPatient',
  'InfoPatient',
  'EditAddress',
];

const navigationItems = [
  { screen: 'HomePatient', icon: 'home', label: 'Home', relatedScreens: homeScreens },
  { screen: 'Prescription', icon: 'file-text', label: 'Prescription', relatedScreens: prescriptionScreens },
  { screen: 'OrderList', icon: 'shopping-cart', label: 'Order', relatedScreens: orderScreens },
  { screen: 'EditPatient', icon: 'user', label: 'Profile', relatedScreens: profileScreens },
];

// Separate the styles to avoid circular dependency
const styles = StyleSheet.create({
  topContainer: {
    width: '100%',
    height: 90,
    backgroundColor: '#FFF',
    borderBottomWidth: 1.5,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
  },
  topContainerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repillText: {
    color: '#383D46',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  navItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  navText: {
    fontSize: 12,
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
    padding: 5,
    marginLeft: 10,
  },
  unreadNotification: {
    backgroundColor: '#F0F8FF',
    borderLeftColor: '#4A90E2',
  },
  unreadText: {
    color: '#2C3E50',
    fontFamily: 'Poppins_600SemiBold',
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
    borderLeftColor: '#95A5A6',
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#7F8C8D',
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

export const TopContainer = forwardRef((props, ref) => {
  const { notifications, unreadCount, markAsRead, fetchNotifications } = usePatientNotifications();
  const navigation = useNavigation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const isFocused = useIsFocused();


  useEffect(() => {
    if (props.patientId) {
      fetchNotifications(props.patientId);
    }
  }, [props.patientId, isFocused]);
  
  useEffect(() => {
    let interval;
    if (props.patientId) {
      interval = setInterval(() => {
        fetchNotifications(props.patientId);
      }, 30000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [props.patientId]);

  useEffect(() => {
    if (!showNotifications) {
      setDisplayedNotifications(notifications || []);
    }
  }, [notifications, showNotifications]);

  React.useImperativeHandle(ref, () => ({
    showNotificationsWithFilter: (filteredNotifications) => {
      setDisplayedNotifications(filteredNotifications || []);
      setShowNotifications(true);
    }
  }));

  React.useImperativeHandle(ref, () => ({
    showNotificationsWithFilter: (filteredNotifications) => {
      setDisplayedNotifications(filteredNotifications || []);
      setShowNotifications(true);
    }
  }));

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    setDisplayedNotifications(notifications || []);
  };

  const handleNotificationPress = async (notification) => {
    console.log('Notification pressed:', notification);
    try {
      await markAsRead(notification.notification_id);
      setShowNotifications(false);

      // Navigate based on notification type
      switch (notification.type) {
        case 'order_placed':
          navigation.navigate('OrderList');
          break;
        case 'order_status':
          navigation.navigate('OrderList');
          break;
        case 'delivery_status':
          if (notification.order_id) {
            navigation.navigate('DeliveryDetails', { 
              orderId: notification.order_id,
              patientId: props.patientId 
            });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleLogout = () => {
    console.log("User logged out");
    navigation.navigate('Login');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return 'shopping-bag';
      case 'order_status':
        return 'package';
      case 'delivery_status':
        return 'truck';
      default:
        return 'bell';
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <Icon 
        name={getNotificationIcon(item.type)} 
        size={24} 
        color={item.is_read ? '#95A5A6' : '#4A90E2'} 
        style={styles.notificationIcon}
      />
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.is_read && styles.unreadText
        ]}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleString()}
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
            onPress={() => setShowNotifications(true)}
            style={styles.iconWrapper}
          >
            <Icon name="bell" size={28} color="#4A90E2" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
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
        visible={showNotifications}
        onRequestClose={handleCloseNotifications}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity 
                onPress={handleCloseNotifications}
                style={styles.closeButton}
              >
                <Icon name="x" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            {displayedNotifications.length === 0 ? (
              <Text style={styles.noNotificationsText}>No notifications</Text>
            ) : (
              <FlatList
                data={displayedNotifications}
                renderItem={renderNotification}
                keyExtractor={item => item.notification_id.toString()}
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

export const BottomNavigation = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('HomePatient');

  useEffect(() => {
    const currentRoute = navigation.getState().routes[navigation.getState().index].name;
    
    // Check which section the current route belongs to
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
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

