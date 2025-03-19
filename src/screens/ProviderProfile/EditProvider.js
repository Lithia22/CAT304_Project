import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Modal } from 'react-native';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { ChevronDown, ChevronUp, Bell, Settings, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { buildApiUrl } from '../../configuration/config';
import { useNotifications } from '../../../ProviderNotification';

const dataSubItems = [
  {
    title: 'Personal Information',
    subtitle: 'Update your details',
    icon: Settings,
    route: 'InfoProvider'
}
];

const DeleteAccountModal = ({ visible, onClose }) => (
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
          Provider's account{'\n'}
          <Text style={styles.highlightedText}>cannot be deleted</Text> directly.{'\n'}
          Visit the hospital's service desk{'\n'}
          to request account deletion
        </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.modalButton}
          onPress={onClose}
        >
          <Text style={styles.modalButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const EditProvider = () => {
  const [isDataExpanded, setIsDataExpanded] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const { notifications } = useNotifications();

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.error('No user ID found');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(buildApiUrl(`/api/providers/${userId}`));
      
      if (response.data) {
        console.log('Provider data fetched successfully:', response.data);
        setUsername(response.data.username || '');
        setEmployeeId(response.data.employee_id || '');
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Provider profile not found');
      } else {
        Alert.alert('Error', 'Failed to load provider data');
      }
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

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const navigationItems = [
    { 
      title: "Notifications", 
      icon: Bell, 
      onPress: () => setShowNotifications(true),  // Direct state update here
      subtitle: "Manage your alerts" 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
      />
      <ScrollView style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{username[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.nameText}>{username}</Text>
          <View style={styles.employeeIdContainer}>
            <Text style={styles.employeeIdLabel}>Employee ID</Text>
            <Text style={styles.employeeIdText}>{employeeId}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          {navigationItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.navigationItem}
              onPress={item.onPress}  
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
      <DeleteAccountModal 
      visible={isDeleteModalVisible}
      onClose={() => setIsDeleteModalVisible(false)}
    />
      <BottomNavProvider />
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
    top: 15,
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
    marginTop:5,
    fontFamily: 'Poppins_600SemiBold',
  },
  nameText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#383D46',
  },
  employeeIdContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  employeeIdLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
    marginBottom: 2,
  },
  employeeIdText: {
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 325,
    height: 245,
    backgroundColor: '#FFF',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
    width: 324,
    marginVertical: 15,
  },
  modalText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    lineHeight: 22.5,
  },
  highlightedText: {
    color: '#FD4040',
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    lineHeight: 22.5,
  },
  modalButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 15,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
});

export default EditProvider;