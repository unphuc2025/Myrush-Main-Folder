import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground,
  KeyboardAvoidingView, Platform, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

const OTPLoginScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const otpInputs = useRef<(TextInput | null)[]>([]);

  const { loginWithPhone } = useAuthStore();

  const handleContinue = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const { otpApi } = require('../api/otp');
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const response = await otpApi.sendOTP(formattedPhone);

      if (response && response.success) {
        setIsLoading(false);
        setShowOTP(true);
        Alert.alert('OTP Sent', `OTP sent to ${formattedPhone}\n(Use: 12345)`);
      } else {
        throw new Error(response?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < otp.length - 1) otpInputs.current[index + 1]?.focus();

    const enteredOTP = newOtp.join('');
    if (enteredOTP.length === 5) {
      verifyOTP(enteredOTP);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (enteredOTP: string) => {
    setIsLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const { otpApi } = require('../api/otp');
      const verifyResponse = await otpApi.verifyOTP(formattedPhone, enteredOTP);

      // Check if user needs to complete profile
      if (verifyResponse.needs_profile) {
        setIsLoading(false);
        // For new users, store phone number AND OTP temporarily
        // We'll need the OTP to complete registration with profile data
        Alert.alert(
          'Welcome!',
          'Please complete your profile to continue',
          [
            {
              text: 'OK',
              onPress: () => {
                // Store phone number and OTP temporarily in auth store
                const { useAuthStore } = require('../store/authStore');
                useAuthStore.setState({
                  user: {
                    id: '',
                    phoneNumber: formattedPhone,
                  },
                  tempOTP: enteredOTP, // Store OTP for profile completion
                });
                // Navigate to PlayerProfileScreen
                navigation.navigate('PlayerProfile');
              }
            }
          ]
        );
        return;
      }

      // If we have access token, existing user - login directly
      if (verifyResponse.access_token) {
        const success = await loginWithPhone(formattedPhone, enteredOTP);
        if (!success) {
          Alert.alert('Error', 'Login failed. Please try again.');
          setOtp(['', '', '', '', '']);
          otpInputs.current[0]?.focus();
        }
        // Navigation handled by AppNavigator based on auth state
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
      setOtp(['', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp(['', '', '', '', '']);
    await handleContinue();
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/login-image.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 50, 70, 0.85)', 'rgba(0, 80, 100, 0.75)', 'rgba(255, 255, 255, 0.95)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />
      </ImageBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.card}>
            <Text style={styles.title}>SPORTS</Text>
            <Text style={styles.subtitle}>
              From football to badminton and tennis, get live games, training, and bookings in one place.
            </Text>
            {!showOTP ? (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={moderateScale(20)} color="#999" style={styles.phoneIcon} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.continueButton, isLoading && styles.buttonDisabled]}
                  onPress={handleContinue}
                  disabled={isLoading}
                >
                  <Text style={styles.continueButtonText}>{isLoading ? 'Sending...' : 'Next'}</Text>
                  {!isLoading && <Ionicons name="arrow-forward" size={moderateScale(20)} color="#fff" />}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.otpTitle}>Enter OTP</Text>
                <Text style={styles.otpSubtitle}>We've sent a 5-digit code to +91 {phoneNumber}</Text>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { otpInputs.current[index] = ref; }}
                      style={styles.otpInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                    />
                  ))}
                </View>
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeNumberButton}
                  onPress={() => { setShowOTP(false); setOtp(['', '', '', '', '']); }}
                >
                  <Text style={styles.changeNumberText}>Change Number</Text>
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.termsText}>
              By continuing, you agree to our <Text style={styles.linkText}>Terms</Text> & <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003246'
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height * 0.7,
    top: 0
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingHorizontal: wp(6),
    paddingTop: hp(3.5),
    paddingBottom: hp(4),
    minHeight: hp(40),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: fontScale(13),
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 3.5,
    marginBottom: hp(1.5)
  },
  subtitle: {
    fontSize: fontScale(13.5),
    color: '#555',
    textAlign: 'center',
    lineHeight: fontScale(21),
    marginBottom: hp(3.5),
    paddingHorizontal: wp(3)
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    paddingHorizontal: wp(4),
    marginBottom: hp(2.5),
    height: hp(7),
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  phoneIcon: {
    marginRight: wp(3)
  },
  phoneInput: {
    flex: 1,
    fontSize: fontScale(15),
    color: '#333'
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    height: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2.5),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryLight
  },
  continueButtonText: {
    color: '#fff',
    fontSize: fontScale(16),
    fontWeight: '600',
    marginRight: wp(2)
  },
  otpTitle: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: hp(1)
  },
  otpSubtitle: {
    fontSize: fontScale(13),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(2.5)
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    paddingHorizontal: wp(2)
  },
  otpInput: {
    width: wp(12),
    height: wp(12),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(10),
    textAlign: 'center',
    fontSize: fontScale(20),
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f9f9f9'
  },
  resendText: {
    fontSize: fontScale(14),
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: hp(1.5)
  },
  changeNumberButton: {
    marginBottom: hp(2)
  },
  changeNumberText: {
    fontSize: fontScale(13),
    color: '#666',
    textAlign: 'center'
  },
  termsText: {
    fontSize: fontScale(11),
    color: '#999',
    textAlign: 'center',
    lineHeight: fontScale(16),
  },
  linkText: {
    color: colors.primary,
  },
});

export default OTPLoginScreen;
