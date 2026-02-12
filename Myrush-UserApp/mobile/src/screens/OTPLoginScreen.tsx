import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Image,
  KeyboardAvoidingView, Platform, Alert, Dimensions,
  ImageBackground, BackHandler, TouchableOpacity, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { RootStackParamList } from '../types';
import { Container } from '../components/common/Container';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const { width, height } = Dimensions.get('window');

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

const OTPLoginScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);

  // Reset state when screen gains focus (e.g. coming back from Profile Setup)
  useFocusEffect(
    React.useCallback(() => {
      // Optional: Only reset if we want to force user to enter phone again
      // setShowOTP(false); 
      // setOtp(['', '', '', '', '']);
      // For now, let's keep the state as user might have accidentally pressed back.
      // But user COMPLAINED about this. "User is redirecting to the OTP entering Screen Which is not good".
      // So we MUST reset.
      setShowOTP(false);
      setOtp(['', '', '', '', '']);
      setPhoneNumber(''); // Clear phone too? Maybe. Let's clear OTP state at least.
      // Actually, if they come back, they probably want to Start Over or Change Number.
      // Let's reset to phone input.
    }, [])
  );
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  // Timer State
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputs = useRef<(TextInput | null)[]>([]);

  const { loginWithPhone } = useAuthStore();

  // Handle Android Back Button
  useEffect(() => {
    const backAction = () => {
      if (showOTP) {
        setShowOTP(false);
        setOtp(['', '', '', '', '']);
        return true; // Prevent default behavior (app exit)
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showOTP]);

  // Handle Resend Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOTP && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOTP, timer]);

  const handleContinue = async () => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number (0-9 only).');
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
        // Reset Timer
        setTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '']); // Clear previous OTP

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
    if (value.length > 1) value = value[value.length - 1]; // Take only last char
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
    if (enteredOTP.length !== 5) return;

    setIsLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const { otpApi } = require('../api/otp');
      const verifyResponse = await otpApi.verifyOTP(formattedPhone, enteredOTP);

      if (verifyResponse.needs_profile) {
        setIsLoading(false);
        Alert.alert(
          'Welcome to MyRush!',
          'Please complete your profile to continue.',
          [
            {
              text: "Let's Go",
              onPress: () => {
                const { useAuthStore } = require('../store/authStore');
                useAuthStore.setState({
                  user: {
                    id: '',
                    phoneNumber: formattedPhone,
                  },
                  tempOTP: enteredOTP,
                });
                navigation.navigate('PlayerProfile');
              }
            }
          ]
        );
        return;
      }

      if (verifyResponse.access_token) {
        // Direct login with received token to avoid double-verification issue
        const { useAuthStore } = require('../store/authStore');
        const { setAuthSuccess } = useAuthStore.getState();

        await setAuthSuccess(verifyResponse.access_token);
        // Navigation is handled by AppNavigator observing auth state
      }
    } catch (error: any) {
      // Always show an alert for any verification failure
      const msg = error.message || 'Invalid OTP';
      const isInvalid = msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('incorrect');
      const title = isInvalid ? 'Incorrect OTP' : 'Verification Failed';
      const body = isInvalid ? 'The OTP you entered is invalid or has expired. Please try again.' : msg;

      Alert.alert(title, body);

      setOtp(['', '', '', '', '']); // Clear OTP on error
      otpInputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '']);
    await handleContinue();
  };

  const openTerms = () => setShowTerms(true);

  const isValidPhone = phoneNumber.length === 10;
  const isOtpComplete = otp.every(digit => digit !== '');

  const [showTerms, setShowTerms] = useState(false);

  const termsContent = `
Terms & Conditions & Privacy Policy

Terms & Conditions
We do not collect personal information through myrush.in. The website serves as an informational platform, and any interactions with our services or inquiries are managed through direct communication methods such as phone or email.

Cookies
Our website may use cookies to enhance user experience. Cookies are small files stored on your device that help us understand how you interact with our website. You can choose to disable cookies through your browser settings.

Security
While we do not collect personal data through the website, we implement appropriate security measures to protect the integrity of the website and any information transmitted through it.

Refunds/Cancellations Policy
We strive to ensure that our customers are satisfied with our services. If you are not satisfied with any service booked through direct communication with AddRush Sports Private Limited, you may request a refund or cancellation under the following conditions:

Eligibility: Refunds or cancellations can be requested within 7 days of service booking.
Process: To request a refund, please contact our customer support team at anto@myrush.in with your booking details.
Timeline: Once your refund is approved, the amount will be credited to your bank account within 5-7 working days.
Non-Refundable Services: Please note that certain services, once availed, may be non-refundable. Specific terms will be communicated at the time of booking.

Pricing in INR
All prices for our services and products are listed in INR (Indian Rupees).
All transactions and bookings conducted through direct communication with AddRush Sports Private Limited will be processed in INR.

Shipping Policy
Since AddRush Sports Private Limited primarily offers sports services and facilities, there is no physical product shipping involved. However, if any merchandise or physical items are sold in the future:

Shipping Areas: Shipping will be available across India.
Shipping Costs: Any applicable shipping costs will be communicated at the time of purchase.
Timeline: Standard shipping timelines will range from 3-7 working days, depending on the location.
Order Tracking: Customers will be provided with tracking information once the order is dispatched.
Delayed/Lost Shipments: In the case of a delayed or lost shipment, customers should contact our support team at anto@myrush.in for resolution.
  `;

  return (
    <Container scrollable={false} backgroundColor="#000000" padding={false}>
      {/* Hero Background Image */}
      <ImageBackground
        source={require('../../assets/login-image.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)', '#000000']}
          locations={[0.3, 0.6, 1]}
          style={styles.gradientOverlay}
        />
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.bottomSheetContainer}>

            {/* Branding Section - Removed Text per request */}
            <View style={styles.header}>
              <Text style={styles.title}>RUSH</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {!showOTP ? (
                <>
                  <Input
                    label="Mobile Number"
                    placeholder="Enter 10-digit number"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    leftIcon={
                      <View style={styles.flagContainer}>
                        <Text style={styles.flagText}>+91</Text>
                        <View style={styles.flagDivider} />
                      </View>
                    }
                    error={phoneNumber.length > 0 && phoneNumber.length < 10 ? "Enter full 10-digit number" : undefined}
                  />

                  <Button
                    title="Get OTP"
                    onPress={handleContinue}
                    loading={isLoading}
                    disabled={!isValidPhone}
                    fullWidth
                    style={[styles.button, !isValidPhone ? styles.disabledButton : null]}
                  />
                </>
              ) : (
                <>
                  <View style={styles.otpHeader}>
                    <Text style={styles.otpTitle}>Enter Verification Code</Text>
                    <Text style={styles.otpSubtitle}>
                      Sent to +91 {phoneNumber}
                    </Text>
                  </View>

                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpInputs.current[index] = ref; }}
                        style={[
                          styles.otpInput,
                          digit ? styles.otpInputFilled : null,
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        placeholderTextColor={colors.text.secondary}
                        textContentType="oneTimeCode"
                        autoComplete="sms-otp"
                      />
                    ))}
                  </View>

                  {/* Error Message for Invalid OTP */}
                  {/* Note: We rely on Alert for now, but inline error text would be better if state allowed it. 
                         The verifyOTP function catches errors and shows alerts. */}

                  <Button
                    title={isLoading ? 'Verifying...' : 'Verify & Login'}
                    onPress={() => verifyOTP(otp.join(''))}
                    loading={isLoading}
                    disabled={!isOtpComplete}
                    fullWidth
                    style={[styles.button, !isOtpComplete ? styles.disabledButton : null]}
                  />

                  <View style={styles.footerActions}>
                    <Text style={styles.resendLabel}>Didn't receive code?</Text>
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={!canResend}
                      style={styles.resendButton}
                    >
                      <Text style={[
                        styles.resendText,
                        !canResend && styles.resendTextDisabled
                      ]}>
                        {canResend ? "Resend OTP" : `Resend in ${timer}s`}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => { setShowOTP(false); setOtp(['', '', '', '', '']); }}
                    style={styles.changeNumberButton}
                  >
                    <Text style={styles.changeNumberText}>Change Number</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={() => setShowTerms(true)} activeOpacity={0.7} style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By continuing, you agree to our <Text style={styles.linkText}>Terms</Text> <Text>&</Text> <Text style={styles.linkText}>Privacy Policy</Text>.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      {showTerms && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalText}>{termsContent}</Text>
            </ScrollView>
            <Button
              title="Close"
              onPress={() => setShowTerms(false)}
              fullWidth
              style={styles.modalButton}
            />
          </View>
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    width: width,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    paddingHorizontal: moderateScale(24),
    paddingBottom: hp(5),
    justifyContent: 'flex-end',
    minHeight: height * 0.55,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: '#FFFFFF', // High contrast
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...typography.body,
    color: '#DDDDDD', // Lighter for better readability on dark
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  formContainer: {
    width: '100%',
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  flagText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  flagDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border.light,
    marginLeft: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  disabledButton: {
    opacity: 0.5,
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  otpTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  otpSubtitle: {
    ...typography.body,
    color: '#AAAAAA',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: wp(14),
    height: wp(14),
    borderRadius: borderRadius.lg,
    backgroundColor: '#1C1C1E', // Darker input bg
    color: '#FFFFFF',
    fontSize: fontScale(24),
    textAlign: 'center',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#333333',
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: '#2C2C2E',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resendLabel: {
    ...typography.bodySmall,
    color: '#888',
    marginRight: spacing.sm,
  },
  resendButton: {
    padding: 4,
  },
  resendText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  resendTextDisabled: {
    color: '#666',
  },
  changeNumberButton: {
    marginTop: spacing.md,
    padding: spacing.xs,
    alignSelf: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.text.secondary,
  },
  changeNumberText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: moderateScale(14),
  },
  termsText: {
    ...typography.caption,
    color: '#888888',
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    height: '80%',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    ...typography.h3,
    color: '#FFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScroll: {
    flex: 1,
    marginBottom: 15,
  },
  modalText: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 22,
  },
  modalButton: {
    marginTop: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  termsContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
});

export default OTPLoginScreen;
