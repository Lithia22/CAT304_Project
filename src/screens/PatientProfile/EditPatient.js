import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { TopContainer, BottomNavigation } from '../Nav/Navigation';
import { ChevronDown, ChevronUp, Bell, ShoppingCart, User, Settings, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import Error from '../../../Error';
import { buildApiUrl } from '../../configuration/config';
import { usePatientNotifications } from '../../../PatientNotification';

const dataSubItems = [
  {
title: 'Personal Information',
subtitle: 'Update your details',
icon: Settings,
route: 'InfoPatient'
},
{
  title: 'Delivery Address',
  subtitle: 'Update your delivery address',
  icon: User,
  route: 'EditAddress'
  },
];

const EditPatient = () => {
  const [isDataExpanded, setIsDataExpanded] = useState(false);
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const topContainerRef = useRef();
  const { notifications } = usePatientNotifications();

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.get(buildApiUrl(`/api/patients/${userId}`));
      console.log('IC Number from response:', response.data.ic_number); 
      setUsername(response.data.username);
      setIcNumber(response.data.ic_number);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const handleDeleteAccount = () => {
    setIsDeleteModalVisible(true);
  };

  const handleShowNotifications = () => {
    if (topContainerRef.current) {
      topContainerRef.current.showNotificationsWithFilter(notifications);
    }
  };

  const deleteMessage = (
    <Text>
      Patient's account{'\n'}
      <Text style={{ color: '#FD4040' }}>cannot be deleted</Text> directly.{'\n'}
      Visit the hospital's service desk{'\n'}
      to request account deletion
    </Text>
  );

  const navigationItems = [
    { title: "Order", icon: ShoppingCart, route: "OrderList", subtitle: "View your order history" },
    { 
      title: "Notifications", 
      icon: Bell, 
      action: handleShowNotifications, 
      subtitle: "Manage your alerts" 
    },
  ];

  const dataSubItems = [
    { title: "Personal Information", icon: Settings, route: "InfoPatient", subtitle: "Update your details" },
    { title: "Delivery Address", icon: MapPin, route: "EditAddress", subtitle: "Update your delivery address" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TopContainer ref={topContainerRef} />
      <ScrollView style={styles.content}>
      <View style={styles.headerContainer}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{username[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.nameText}>{username}</Text>
        <View style={styles.icNumberContainer}>
          <Text style={styles.icNumberLabel}>IC Number</Text>
          <Text style={styles.icNumberText}>{icNumber}</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
          {navigationItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.navigationItem}
              onPress={() => item.action ? item.action() : navigation.navigate(item.route)}
            >
              <View style={styles.itemContent}>
                <View style={styles.iconContainer}>
                  <item.icon size={24} color="#4A90E2" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.itemText}>{item.title}</Text>
                  <Text style={styles.subtitleText}>{item.subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navigationItem, styles.dataSection]}
          onPress={() => setIsDataExpanded(!isDataExpanded)}
        >
          <View style={styles.itemContent}>
            <View style={styles.iconContainer}>
              <User size={24} color="#4A90E2" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemText}>My Data</Text>
              <Text style={styles.subtitleText}>Manage your account</Text>
            </View>
            {isDataExpanded ? 
              <ChevronUp size={24} color="#4A90E2" /> : 
              <ChevronDown size={24} color="#4A90E2" />
            }
          </View>
        </TouchableOpacity>

        {isDataExpanded && (
          <View style={styles.subMenu}>
            {dataSubItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.subMenuItem}
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={styles.itemContent}>
                  <View style={styles.iconContainer}>
                    <item.icon size={20} color="#4A90E2" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.subMenuText}>{item.title}</Text>
                    <Text style={styles.subtitleText}>{item.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
            style={[styles.subMenuItem, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <Error 
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        message={deleteMessage}
      />
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    padding: 35,
    top:15,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Poppins_600SemiBold',
  },
  nameText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#383D46',
  },
  icNumberContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  icNumberLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
    marginBottom: 2,
  },
  icNumberText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#383D46',
    letterSpacing: 1,
  },
  sectionContainer: {
    padding: 20,
    gap: 10,
  },
  navigationItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dataSection: {
    marginHorizontal: 20,
    marginTop: -10,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#383D46',
  },
  subtitleText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 2,
  },
  subMenu: {
    marginHorizontal: 20,
    marginTop: 10,
    gap: 10,
  },
  subMenuItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subMenuText: {
    fontSize: 16,
    color: '#383D46',
    fontFamily: 'Poppins_500Medium',
  },
  deleteButton: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  }
});

export default EditPatient;