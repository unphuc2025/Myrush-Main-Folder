import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Image,
  KeyboardAvoidingView, Platform, Alert, Dimensions,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
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

      if (verifyResponse.needs_profile) {
        setIsLoading(false);
        Alert.alert(
          'Welcome!',
          'Please complete your profile to continue',
          [
            {
              text: 'OK',
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
        const success = await loginWithPhone(formattedPhone, enteredOTP);
        if (!success) {
          Alert.alert('Error', 'Login failed. Please try again.');
          setOtp(['', '', '', '', '']);
          otpInputs.current[0]?.focus();
        }
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
    <Container scrollable={false} backgroundColor="#000000" padding={false}>
      {/* Hero Background Image */}
      <ImageBackground
        source={require('../../assets/login-image.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
          locations={[0.4, 0.7, 1]}
          style={styles.gradientOverlay}
        />
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.bottomSheetContainer}>

          {/* Branding Section */}
          <View style={styles.header}>
            {/*<View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>*/}
            <Text style={styles.title}>RUSH</Text>
            <Text style={styles.subtitle}>
              From football to badminton, get live games, training, and bookings.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {!showOTP ? (
              <>
                <Input
                  label="Mobile Number"
                  placeholder="Enter 10-digit number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  leftIcon={
                    <View style={styles.flagContainer}>
                      <Text style={styles.flagText}>+91</Text>
                      <View style={styles.flagDivider} />
                    </View>
                  }
                />

                <Button
                  title="Get OTP"
                  onPress={handleContinue}
                  loading={isLoading}
                  fullWidth
                  style={styles.button}
                />
              </>
            ) : (
              <>
                <View style={styles.otpHeader}>
                  <Text style={styles.otpTitle}>Enter Code</Text>
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
                    />
                  ))}
                </View>

                <Button
                  title={isLoading ? 'Verifying...' : 'Verify & Login'}
                  onPress={() => verifyOTP(otp.join(''))}
                  loading={isLoading}
                  fullWidth
                  style={styles.button}
                />

                <View style={styles.footerActions}>
                  <Text style={styles.resendText}>Didn't receive code?</Text>
                  <Button
                    title="Resend OTP"
                    onPress={handleResendOTP}
                    variant="ghost"
                    size="small"
                  />
                </View>

                <Button
                  title="Change Number"
                  onPress={() => { setShowOTP(false); setOtp(['', '', '', '', '']); }}
                  variant="ghost"
                  textStyle={styles.changeNumberText}
                />
              </>
            )}

            <Text style={styles.termsText}>
              By continuing, you agree to our <Text style={styles.linkText}>Terms</Text> & <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65, // Cover top 65%
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
    minHeight: height * 0.5, // Ensure it takes up bottom half
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.md,
    // Add shadow/glow effect
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
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
  otpHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  otpTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  otpSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
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
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    fontSize: fontScale(24),
    textAlign: 'center',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: colors.transparent,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.background.tertiary,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  resendText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  changeNumberText: {
    color: colors.text.secondary,
  },
  termsText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    color: colors.primary,
  },
});

export default OTPLoginScreen;
