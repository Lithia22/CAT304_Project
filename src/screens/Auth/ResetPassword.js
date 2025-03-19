import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import Error from '../../../Error';
import Success from '../../../Success';
import { buildApiUrl } from '../../configuration/config';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

const ResetPassword = ({ route }) => {
  const navigation = useNavigation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const { email, userType, code } = route.params;

  const goBack = () => {
    navigation.goBack();
  };

  const validatePassword = () => {
    return {
      hasMinLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    };
  };

  const checks = validatePassword();

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      setErrorVisible(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setErrorVisible(true);
      return;
    }

    const passwordChecks = validatePassword();
    if (!Object.values(passwordChecks).every(check => check)) {
      setErrorMessage('Please ensure your password meets all requirements');
      setErrorVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(buildApiUrl('/api/auth/reset-password'), {
        email,
        newPassword,
        userType,
        code
      });
      setSuccessVisible(true);
      setTimeout(() => {
        setSuccessVisible(false);
        navigation.navigate('Login');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to reset password');
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const ChecklistItem = ({ isChecked, text }) => (
    <View style={styles.checklistRow}>
      <Svg width={scale * 28} height={scale * 27} viewBox="0 0 28 27" fill="none">
        <Ellipse cx="14" cy="13.5" rx="14" ry="13.5" fill={isChecked ? '#4A90E2' : '#D0D0D0'} />
        {isChecked && (
          <Path
            d="M11.3217 20.5715L5.09082 14.4771L6.64854 12.9534L11.3217 17.5243L21.3513 7.71436L22.909 9.23797L11.3217 20.5715Z"
            fill="#E8EAED"
          />
        )}
      </Svg>
      <Text style={styles.checklistText}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={goBack} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.box}>
          <Text style={styles.header}>Reset Password</Text>
          <Text style={styles.subHeader}>Enter your new password</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.checklistContainer}>
            <ChecklistItem isChecked={checks.hasMinLength} text="Must include at least 8 characters" />
            <ChecklistItem isChecked={checks.hasUppercase} text="Must include an uppercase letter" />
            <ChecklistItem isChecked={checks.hasLowercase} text="Must include lowercase letters" />
            <ChecklistItem isChecked={checks.hasNumber} text="Must include a number" />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </View>

        <Error 
          visible={errorVisible}
          onClose={() => setErrorVisible(false)}
          message={errorMessage}
        />
        <Success 
          visible={successVisible}
          message="Password reset successfully"
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
  checklistContainer: {
    width: '100%',
    marginTop: scale * 10,
    marginBottom: scale * 10,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale * 10,
  },
  checklistText: {
    marginLeft: scale * 10,
    color: '#383D46',
    fontFamily: 'Poppins_500Medium',
    fontSize: scale * 15,
    lineHeight: scale * 19.5,
    letterSpacing: -0.75,
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

export default ResetPassword;