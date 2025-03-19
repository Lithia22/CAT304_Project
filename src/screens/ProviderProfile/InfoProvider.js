import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { buildApiUrl } from '../../configuration/config';
import { LinearGradient } from 'expo-linear-gradient';

const InfoProvider = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    full_name: '',
    username: '',
    phone_number: '',
    employee_id: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const [userId, userType] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userType')
      ]);
      
      if (userType !== 'provider') {
        throw new Error('Invalid user type for provider profile');
      }

      const response = await axios.get(buildApiUrl(`/api/providers/${userId}`));
      setUserData(response.data);
      setOriginalUsername(response.data.username);
    } catch (error) {
      console.error('Error fetching provider data:', error);
      Alert.alert('Error', 'Failed to load provider information');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (username === originalUsername) {
      setIsUsernameAvailable(true);
      setValidationError('');
      return;
    }

    setIsCheckingUsername(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.get(buildApiUrl('/api/check-username'), {
        params: { username, userId }
      });
      setIsUsernameAvailable(response.data.available);
      setValidationError(response.data.available ? '' : 'Username is already taken');
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSave = async () => {
    if (!userData.username.trim() || !userData.phone_number?.trim() || !isUsernameAvailable) {
      Alert.alert('Error', 'Please check all fields and try again');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      await axios.put(buildApiUrl(`/api/providers/${userId}/info`), {
        full_name: userData.full_name,
        username: userData.username,
        phone_number: userData.phone_number,
      });

      setSuccessMessage('Information updated successfully');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error('Error updating provider data:', error);
      Alert.alert('Error', 'Failed to update information');
    }
  };

  if (isLoading) {
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
          <Text style={styles.headerTitle}>Personal Info</Text>
          <View style={{ width: 40 }} />
        </View>

        {successMessage && (
          <View style={styles.messageContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userData.username ? userData.username[0]?.toUpperCase() : ''}
          </Text>
        </View>

        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.card}
        >
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={userData.full_name}
              onChangeText={(text) => {
                setUserData({ ...userData, full_name: text });
                setIsEditing(true);
              }}
              placeholder="Enter full name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Display Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, !isUsernameAvailable && styles.inputError]}
                value={userData.username}
                onChangeText={(text) => {
                  setUserData({ ...userData, username: text });
                  setIsEditing(true);
                  checkUsernameAvailability(text);
                }}
                placeholder="Enter display name"
              />
              {isCheckingUsername && (
                <ActivityIndicator style={styles.inputIndicator} size="small" color="#4A90E2" />
              )}
            </View>
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={userData.phone_number}
              onChangeText={(text) => {
                setUserData({ ...userData, phone_number: text });
                setIsEditing(true);
              }}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>
        </LinearGradient>
      </ScrollView>

      {isEditing && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, !isUsernameAvailable && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isUsernameAvailable}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
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
  messageContainer: {
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  successText: {
    color: '#10B981',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4299E1',
    alignSelf: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    marginTop: 5,
    fontFamily: 'Poppins_600SemiBold',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#2D3748',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default InfoProvider;