import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';  
import { useNavigation } from '@react-navigation/native';  
import * as Font from 'expo-font'; 
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Error from '../../../Error'
import { buildApiUrl } from '../../configuration/config';

const Login = () => {
  const navigation = useNavigation();
  const [isPatientMode, setIsPatientMode] = useState(true);
  const [showError, setShowError] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  // State for input fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Forgot Password Navigation
  const goToForgotPassword = () => {
    navigation.navigate('ForgotPassword', { 
      userType: isPatientMode ? 'patient' : 'provider' 
    });
  };

  const handleSignIn = async () => {
    if (!identifier || !password) {
      setModalMessage('Please enter both identifier and password');
      setShowError(true);
      return;
    }
   
    try {
      const userType = isPatientMode ? 'patient' : 'provider';
      const response = await axios.post(buildApiUrl('/api/auth/login'), {
        identifier,
        password,
        userType
      });
   
      if (response.data.userId) {
        // Store all necessary data in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('userId', response.data.userId.toString()),
          AsyncStorage.setItem('userType', userType),
          // If it's a patient, store userId as patientId as well
          ...(userType === 'patient' ? 
            [AsyncStorage.setItem('patientId', response.data.userId.toString())] 
            : []
          )
        ]);
        
        if (userType === 'provider') {
          navigation.navigate('ProviderScreens', { 
            screen: 'HomeProvider' 
          });
        } else {
          navigation.navigate('PatientScreens', {
            screen: 'HomePatient'
          });
        }
      }
    } catch (error) {
      setModalMessage(error.response?.data?.message || 'Login failed');
      setShowError(true);
    }
  };
   


  // Sign Up Navigation based on user type
  const goToSignUp = () => {
    if (isPatientMode) {
      navigation.navigate('SignUp', { isPatientMode: true });
    } else {
      navigation.navigate('SignUp', { isPatientMode: false });
    }
  };

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Poppins_300Light: require('../../../assets/Poppins/Poppins-Light.ttf'),
        Poppins_400Regular: require('../../../assets/Poppins/Poppins-Regular.ttf'),
        Poppins_500Medium: require('../../../assets/Poppins/Poppins-Medium.ttf'),
        Poppins_700Bold: require('../../../assets/Poppins/Poppins-Bold.ttf'),
        Poppins_600SemiBold: require('../../../assets/Poppins/Poppins-SemiBold.ttf'),
        Poppins_800ExtraBold: require('../../../assets/Poppins/Poppins-ExtraBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Ellipses */}
      <Svg width={180} height={180} viewBox="0 0 300 300" fill="none" style={styles.svg}>
        <Ellipse cx={150} cy={150} rx={150} ry={150} fill="#549DF1" />
        <Ellipse cx={150} cy={150} rx={130} ry={130} fill="#61A7F9" />
        <Ellipse cx={150} cy={150} rx={110} ry={110} fill="#7DB9FF" />
        <Ellipse cx={150} cy={150} rx={90} ry={90} fill="#96C6FF" />
        <Ellipse cx={150} cy={150} rx={70} ry={70} fill="#FFF" />

        {/* Pill Icon */}
        <Path
          d="M22.1871 64.0601C16.2717 64.0601 11.2532 62.1461 7.13131 58.3179C3.00947 54.4898 0.948547 49.8288 0.948547 44.335C0.948547 41.705 1.48344 39.1919 2.55323 36.7957C3.62303 34.3994 5.16478 32.2662 7.17851 30.396L32.6647 6.72585C34.6784 4.85562 36.9754 3.42372 39.5554 2.43016C42.1355 1.4366 44.8415 0.939819 47.6733 0.939819C53.5886 0.939819 58.6072 2.85388 62.729 6.68201C66.8509 10.5101 68.9118 15.1711 68.9118 20.6649C68.9118 23.2949 68.3769 25.808 67.3071 28.2043C66.2373 30.6005 64.6955 32.7337 62.6818 34.604L37.1956 58.2741C35.1819 60.1443 32.885 61.5762 30.3049 62.5698C27.7248 63.5633 25.0189 64.0601 22.1871 64.0601ZM47.2957 38.9873L57.3958 29.6946C58.6544 28.5257 59.6298 27.1523 60.322 25.5743C61.0142 23.9963 61.3603 22.3598 61.3603 20.6649C61.3603 17.1582 60.0231 14.1629 57.3486 11.679C54.6741 9.19514 51.449 7.95319 47.6733 7.95319C45.8483 7.95319 44.0863 8.27463 42.3872 8.91752C40.6882 9.56042 39.2093 10.4663 37.9508 11.6352L27.9451 21.0156L47.2957 38.9873ZM22.1871 57.0468C24.012 57.0468 25.774 56.7253 27.4731 56.0824C29.1722 55.4395 30.651 54.5336 31.9096 53.3647L41.9153 43.9844L22.5646 26.0126L12.4645 35.3053C11.206 36.4742 10.2306 37.8477 9.53835 39.4257C8.84613 41.0037 8.50002 42.6401 8.50002 44.335C8.50002 47.8417 9.83726 50.837 12.5117 53.3209C15.1862 55.8048 18.4113 57.0468 22.1871 57.0468Z"
          fill="#4A90E2"
          transform="translate(110, 115) scale(1.1)"
        />
      </Svg>

      {/* Box */}
      <View style={styles.box}>
        <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        {/* Header: Login here */}
        <Text style={styles.header}>Login here</Text>

        {/* Welcome back text */}
        <Text style={styles.welcomeText}>
          {isPatientMode ? 'Welcome back!\nReady for your next refill?' : 'Welcome back!\nReady to care for your patients?'}
        </Text>
        
        {/* Box2 */}
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

          {/* Container for IC Number and Password Inputs */}
          <View style={styles.inputContainerWrapper}>
              {/* IC Number or Employee ID Text Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, identifier && styles.activeInput]}
                  placeholder={isPatientMode ? "Enter IC No." : "Enter Employee ID"}
                  placeholderTextColor="#9D9D9D"
                  keyboardType={isPatientMode ? "numeric" : "default"}
                  value={identifier}
                  onChangeText={setIdentifier}
                  editable={true} 
                  pointerEvents="auto" 
                />
              </View>

              {/* Password Text Input */}
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
            </View>

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={goToForgotPassword} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>

          {/* Don't have an account? Sign Up */}
          <View style={styles.signUpContainer}>
            <Text style={styles.dontHaveAccountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={goToSignUp}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </View>
      <Error
        visible={showError}
        onClose={() => setShowError(false)}
        message={modalMessage}
      />
    </View>
  );
};
  
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#4A90E2', 
        justifyContent: 'center',   
        alignItems: 'center',     
      },
      box: {
        width: 415,
        height: 623,
        position: 'relative', // Add this
        flexShrink: 0,
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: '#000', 
        backgroundColor: '#F4F5F9',
        top: 150,
        padding: 20,
        alignItems: 'center',
       },
      box2: {
        width: 335,    
        height: 380, 
        position: 'relative', // Add this       
        flexShrink: 0,       
        borderRadius: 16,  
        borderColor: '#E8E8E8', 
        borderWidth: 1.5,    
        backgroundColor: '#FFF', 
        boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.25)',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 20, 
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
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
      },
      patientText: {
        color: '#FFF',
        textAlign: 'center',
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        lineHeight: 15.6,
        letterSpacing: -0.6,
      },
      providerButton: {
        width: 99,
        height: 33,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#E9E8E8',
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
      },
      providerText: {
        color: '#4A90E2',
        textAlign: 'center',
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        lineHeight: 15.6,
        letterSpacing: -0.6,
      },
      header: {
        color: '#4A90E2',
        fontFamily: 'Poppins_700Bold', 
        fontSize: 28,
        lineHeight: 36.4,
        letterSpacing: -1.4,
        marginLeft: 0,
      },
      welcomeText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 20,
        lineHeight: 30,
        letterSpacing: -1,
        marginBottom: 20,
        textAlign: 'center',
        color: '#383D46',
      },
      svg: {
        position: 'absolute',  
        top: 65,              
      },
      inputContainerWrapper: {
        marginTop: 40,
        alignItems: 'center',
        width: '100%', // Add this
        zIndex: 1, // Add this to ensure inputs are clickable
      },
      inputContainer: {
        width: 300,
        marginBottom: 20,
        position: 'relative', // Add this
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
      forgotPasswordContainer: {
        width: 150,
        marginTop: 10,  
        position: 'absolute', 
        top: 195, 
        left: 212, 
      },
      forgotPasswordText: {
        fontSize: 11,
        color: '#000', 
        fontFamily: 'Poppins_600SemiBold',
      },
      signInButton: {
        width: 300,
        backgroundColor: '#4A90E2',
        borderRadius: 50,
        paddingVertical: 12,
        paddingHorizontal: 60,
        alignItems: 'center',
        marginTop: 40,
      },
      signInText: {
        width: 55,
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: '#FFFFFF',
        lineHeight: 19.5,
        lineSpacing: -0.75,
      },
      signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
      },
      dontHaveAccountText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        color: '#000',
      },
      signUpText: {
        width: 48,
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 12,
        color: '#4A90E2',
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
    
    export default Login;