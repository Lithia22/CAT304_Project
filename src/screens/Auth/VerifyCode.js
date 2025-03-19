import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, StyleSheet, SafeAreaView,} from 'react-native';
import axios from 'axios';
import Error from '../../../Error';
import Success from '../../../Success';
import { buildApiUrl } from '../../configuration/config';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

const VerifyCode = ({ navigation, route }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(true);
  const { email, userType } = route.params;
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setInputEnabled(true); // Enable input when timer reaches zero
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const resetInputs = () => {
    setCode(['', '', '', '']);
    setInputEnabled(true);
    // Focus on first input after a short delay to ensure UI is updated
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const handleResendCode = async () => {
    if (timer > 0) {
      setErrorMessage(`Please wait for the timer to finish (${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}) before requesting a new code.`);
      setErrorVisible(true);
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(buildApiUrl('api/auth/forgot-password'), {
        email,
        userType
      });
      setTimer(60);
      setSuccessMessage('New code sent successfully');
      setSuccessVisible(true);
      resetInputs();
    } catch (error) {
      setErrorMessage('Failed to resend code');
      setErrorVisible(true);
      setInputEnabled(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setErrorMessage('Please enter the complete 4-digit code');
      setErrorVisible(true);
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(buildApiUrl('/api/auth/verify-reset-code'), {
        email,
        code: fullCode,
        userType
      });
      
      if (response.data.message === 'Code verified successfully') {
        setSuccessMessage('Code verified successfully');
        setSuccessVisible(true);
        setTimeout(() => {
          setSuccessVisible(false);
          navigation.navigate('ResetPassword', {
            email,
            code: fullCode,
            userType
          });
        }, 2000);
      }
    } catch (error) {
      setErrorMessage('The code you entered is incorrect. Please try again.');
      setErrorVisible(true);
      setInputEnabled(true);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    if (!inputEnabled || !/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-advance to next input
    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (!inputEnabled) return;

    if (e.nativeEvent.key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  // Back navigation
const goBack = () => {
  navigation.goBack();
};

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
        <TouchableOpacity onPress={goBack} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>{'<'}</Text>
        </TouchableOpacity>

      <View style={styles.box}>
        <Text style={styles.header}>Enter Verification Code</Text>
        <Text style={styles.subHeader}>
          Enter the 4-digit code sent to{'\n'}{email}
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
                !inputEnabled && styles.codeInputDisabled
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              editable={inputEnabled && !loading}
            />
          ))}
        </View>

        <Text style={styles.timer}>
          Time remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || code.join('').length !== 4) && styles.buttonDisabled
          ]}
          onPress={handleVerifyCode}
          disabled={loading || code.join('').length !== 4}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resendButton,
            { backgroundColor: timer > 0 ? '#B0C4DE' : '#4A90E2' }
          ]}
          onPress={handleResendCode}
        >
          <Text style={[
            styles.resendText,
            { color: '#FFFFFF' }
          ]}>
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>
      <Success 
      visible={successVisible}
      onClose={() => setSuccessVisible(false)}
      message={successMessage}
    />
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: scale * 20,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderColor: '#4A90E2',
    borderWidth: 1.5,
    borderRadius: scale * 10,
    textAlign: 'center',
    fontSize: scale * 24,
    backgroundColor: '#FFF',
    fontWeight: '600',
  },
  codeInputFilled: {
    backgroundColor: '#F0F8FF',
    borderColor: '#2E78E4',
  },
  codeInputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#B0C4DE',
  },
  timer: {
    fontSize: scale * 14,
    color: '#383D46',
    marginVertical: scale * 15,
    fontWeight: '500',
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
    fontSize: scale * 15,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: scale * 15,
    padding: scale * 10,
    width: '100%',
    borderRadius: scale * 50,
    paddingVertical: scale * 12,
    alignItems: 'center',
  },
  resendText: {
    fontSize: scale * 14,
    fontWeight: '600',
  }
});

export default VerifyCode;