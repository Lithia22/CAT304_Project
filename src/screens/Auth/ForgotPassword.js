import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Error from '../../../Error'
import { buildApiUrl } from '../../configuration/config';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

const ForgotPassword = ({ route }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { userType } = route.params;

  const goBack = () => {
    navigation.goBack();
  };

  const handleSendCode = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      setErrorVisible(true);
      return;
    }

    setLoading(true);
    try {
      await axios.post(buildApiUrl('/api/auth/forgot-password'), {
        email,
        userType
      });
      navigation.navigate('VerifyCode', { email, userType });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to send verification code');
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={goBack} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.box}>
          <Text style={styles.header}>Forgot Password</Text>
          <Text style={styles.subHeader}>Enter your email address to receive a verification code</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Code'}
            </Text>
          </TouchableOpacity>
        </View>
        <Error 
          visible={errorVisible}
          onClose={() => setErrorVisible(false)}
          message={errorMessage}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  backButtonContainer: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    padding: scale * 10,
  },
  backButton: {
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: scale * 40,
  },
  box: {
    width: Math.min(width * 0.9, 335),
    backgroundColor: '#FFF',
    borderRadius: scale * 16,
    padding: scale * 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    color: '#4A90E2',
    fontFamily: 'Poppins_700Bold',
    fontSize: scale * 28,
    marginBottom: scale * 10,
    textAlign: 'center',
  },
  subHeader: {
    fontFamily: 'Poppins_500Medium',
    fontSize: scale * 16,
    color: '#383D46',
    textAlign: 'center',
    marginBottom: scale * 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: scale * 15,
  },
  input: {
    height: scale * 48,
    borderColor: '#4A90E2',
    borderWidth: 1.5,
    borderRadius: scale * 10,
    paddingHorizontal: scale * 15,
    fontFamily: 'Poppins_500Medium',
    fontSize: scale * 14,
  },
  button: {
    width: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: scale * 50,
    paddingVertical: scale * 12,
    alignItems: 'center',
    marginTop: scale * 20,
  },
  buttonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: scale * 15,
  }
});

export default ForgotPassword;