import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, TextInput } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';

import {
  useFonts,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_900Black
} from '@expo-google-fonts/lexend';

export default function App() {
  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_900Black,
  });

  useEffect(() => {
    // ... notifications (commented out) ...
    console.log('📱 App started in Expo Go mode (Firebase disabled)');
  }, []);

  // Set default font family globally
  const setGlobalStyles = () => {
    const customTextProps = {
      style: {
        fontFamily: 'Lexend_400Regular',
      },
      allowFontScaling: false, // Disable system font scaling
    };

    // @ts-ignore
    Text.defaultProps = {
      // @ts-ignore
      ...Text.defaultProps,
      ...customTextProps,
      style: [customTextProps.style, (Text as any).defaultProps?.style],
    };

    // @ts-ignore
    TextInput.defaultProps = {
      // @ts-ignore
      ...TextInput.defaultProps,
      ...customTextProps,
      style: [customTextProps.style, (TextInput as any).defaultProps?.style],
    };
  };

  useEffect(() => {
    if (fontsLoaded) {
      setGlobalStyles();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
