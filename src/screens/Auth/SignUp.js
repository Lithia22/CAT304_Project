import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import * as Font from 'expo-font';
import axios from 'axios';
import Error from '../../../Error';
import Success from '../../../Success';
import { buildApiUrl } from '../../configuration/config';

const SignUp = ({ route }) => {
  const navigation = useNavigation();
  const [isPatientMode, setIsPatientMode] = useState(route.params?.isPatientMode ?? true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profession, setProfession] = useState('');
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Poppins_300Light: require('../../../assets/Poppins/Poppins-Light.ttf'),
        Poppins_500Medium: require('../../../assets/Poppins/Poppins-Medium.ttf'),
        Poppins_700Bold: require('../../../assets/Poppins/Poppins-Bold.ttf'),
        Poppins_800ExtraBold: require('../../../assets/Poppins/Poppins-ExtraBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // Validation function
  const validateForm = () => {
    // Basic field validation
    if (!fullName || !displayName || !identifier || !email || !phoneNumber || !password) {
      setErrorMessage('Please fill in all required fields');
      setShowError(true);
      return false;
    }

    // Password validation
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setShowError(true);
      return false;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMessage('Password must be at least 8 characters long and contain both letters and numbers');
      setShowError(true);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      setShowError(true);
      return false;
    }

    if (isPatientMode) {
      if (!/^\d{12}$/.test(identifier)) {
        setErrorMessage('Please enter a valid 12-digit IC Number');
        setShowError(true);
        return false;
      }
    } else {
      if (!profession) {
        setErrorMessage('Please select your profession');
        setShowError(true);
        return false;
      }
      if (!/^E10\d{2}$/.test(identifier)) {
        setErrorMessage('Employee ID must be between E1000 and E1099');
        setShowError(true);
        return false;
      }
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const endpoint = isPatientMode
        ? buildApiUrl('api/auth/register/patient')
        : buildApiUrl('api/auth/register/provider');

      const payload = isPatientMode
        ? {
            ic_number: identifier,
            full_name: fullName,
            username: displayName,
            email: email,
            password: password,
            phone_number: phoneNumber,
            address: JSON.stringify({
              recipient_name: '',
              phone_number: '',
              line1: '',
              line2: '',
              state: '',
              postcode: '',
              city: ''
            })
          }
        : {
            employee_id: identifier,
            full_name: fullName,
            username: displayName,
            email: email,
            password: password,
            phone_number: phoneNumber,
            profession: profession
          };

      const response = await axios.post(endpoint, payload);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('Login', { isPatientMode });
      }, 2000);
    } catch (error) {
      console.error('Full error object:', error);
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        setErrorMessage('No response from server. Please check your connection.');
      } else {
        setErrorMessage('An unexpected error occurred');
      }
      setShowError(true);
    }
  };

  // Back navigation
  const goBack = () => {
    navigation.goBack({
      params: { 
        isPatientMode: isPatientMode 
      }
    });
  };

  if (!fontsLoaded) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button Row */}
        <View style={styles.backButtonRow}>
          <TouchableOpacity onPress={goBack} style={styles.backButtonContainer}>
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.createAccountContainer}>
            <Text style={styles.createAccountText}>Create Account</Text>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitleText}>
          Sign up to never miss your refills again!
        </Text>
        
        {/* Box */}
        <View style={styles.box}>
          <View style={styles.box2}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.patientButton, 
                  { 
                    left: 50, 
                    backgroundColor: isPatientMode ? '#4A90E2' : '#FFF',
                    borderWidth: isPatientMode ? 0 : 1,
                    borderColor: '#E9E8E8',
                    ...(isPatientMode && styles.activeButtonShadow)
                  }
                ]} 
                onPress={() => setIsPatientMode(true)}
              >
                <Text style={[
                  styles.patientText, 
                  { color: isPatientMode ? '#FFF' : '#4A90E2' }
                ]}>Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.providerButton, 
                  { 
                    left: 180, 
                    backgroundColor: !isPatientMode ? '#4A90E2' : '#FFF',
                    borderWidth: !isPatientMode ? 0 : 1,
                    borderColor: '#E9E8E8',
                    ...(!isPatientMode && styles.activeButtonShadow)
                  }
                ]}
                onPress={() => setIsPatientMode(false)}
              >
                <Text style={[
                  styles.providerText, 
                  { color: !isPatientMode ? '#FFF' : '#4A90E2' }
                ]}>Provider</Text>
              </TouchableOpacity>
            </View>


            {/* Container for Signup Inputs */}
            <View style={styles.inputContainerWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, fullName && styles.activeInput]}
              placeholder="Enter Full Name"
              placeholderTextColor="#9D9D9D"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, displayName && styles.activeInput]}
              placeholder="Enter Display Name"
              placeholderTextColor="#9D9D9D"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, identifier && styles.activeInput]}
              placeholder={isPatientMode ? "Enter IC No." : "Enter Employee ID"}
              placeholderTextColor="#9D9D9D"
              keyboardType={isPatientMode ? "numeric" : "default"}
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, email && styles.activeInput]}
              placeholder="Enter Email"
              placeholderTextColor="#9D9D9D"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {!isPatientMode && (
            <View style={styles.inputContainer}>
              <View style={styles.professionContainer}>
                <TouchableOpacity
                  style={[
                    styles.textInput,
                    styles.dropdownButton,
                    profession && styles.activeInput,
                    showProfessionDropdown && styles.dropdownButtonActive
                  ]}
                  onPress={() => setShowProfessionDropdown(!showProfessionDropdown)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    profession ? styles.activeInput : { color: '#9D9D9D' }
                  ]}>
          {profession || "Enter Profession"}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      {showProfessionDropdown && (
        <View style={styles.dropdownMenu}>
          {['Nurse', 'Pharmacist'].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                setProfession(option);
                setShowProfessionDropdown(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                profession === option && styles.dropdownItemTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  </View>
)}

          <View style={styles.inputContainer}>
            <View style={styles.phoneInputContainer}>
              <View style={styles.flagContainer}>
                <Image 
                  source={require('../../../assets/malaysia-flag.png')} 
                  style={styles.flagImage}
                />
                <Text style={styles.countryCode}>+60</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.phoneInput, phoneNumber && styles.activeInput]}
                placeholder="Enter Phone Number"
                placeholderTextColor="#9D9D9D"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => {
                  const cleanedText = text.replace(/[^\d]/g, '');
                  setPhoneNumber(cleanedText);
                }}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, password && styles.activeInput]}
              placeholder="Enter Password"
              placeholderTextColor="#9D9D9D"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, confirmPassword && styles.activeInput]}
              placeholder="Confirm Password"
              placeholderTextColor="#9D9D9D"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

            {/* Sign Up Button */}
            <TouchableOpacity 
              style={styles.signUpButton}
              onPress={handleSignUp}
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Success 
          visible={showSuccess} 
          onClose={() => setShowSuccess(false)}
          message="Registration successful!"
        />
        <Error 
          visible={showError}
          onClose={() => setShowError(false)}
          message={errorMessage}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  backButtonRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 50,
    alignItems: 'center',
  },
  backButtonContainer: {
    width: 21,
    height: 40,
  },
  backButton: {
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 50,
    lineHeight: 65,
  },
  createAccountContainer: {
    flex: 1,
    alignItems: 'center',
  },
  createAccountText: {
    width: 210,
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36.4,
    letterSpacing: -1.4,
    left: -15,
  },
  subtitleText: {
    width: 300,
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins_300Light',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -1,
    marginTop: 5,
    marginBottom: 30,
  },
  box: {
    width: 415,
    minHeight: 750,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#000',
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    paddingBottom: 50,
  },
  box2: {
    width: 335,
    borderRadius: 16,
    borderColor: '#E8E8E8',
    borderWidth: 1.5,
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    marginTop: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  patientButton: {
    width: 99,
    height: 33,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  patientText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 15.6,
    letterSpacing: -0.6,
  },
  providerButton: {
    width: 99,
    height: 33,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  providerText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 15.6,
    letterSpacing: -0.6,
  },
  inputContainerWrapper: {
    marginTop: 35,
    alignItems: 'center',
  },
  inputContainer: {
    width: 300,
    marginBottom: 20,
  },
  textInput: {
    height: 48,
    borderColor: '#4A90E2',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#9D9D9D',
  }, 
  activeInput: {
    color: '#000000',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderColor: '#4A90E2',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 5,
  },
  flagImage: {
    width: 25,
    height: 15,
    marginRight: 5,
  },
  countryCode: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#000',
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 5,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 15,
  },
  dropdownButtonActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#4A90E2',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48, // height of the input
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#4A90E2',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E8E8',
  },
  dropdownItemText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#000',
  },
  dropdownItemTextSelected: {
    color: '#4A90E2',
  },
  signUpButton: {
    width: 300,
    backgroundColor: '#4A90E2',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 60,
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 19.5,
  },
  activeButtonShadow: {
    // iOS shadow properties
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Android shadow property
    elevation: 5,
  },
});

export default SignUp;