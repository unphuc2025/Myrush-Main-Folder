import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, TextInput, StatusBar as RNStatusBar, Platform } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { NetworkStatus } from './src/components/common/NetworkStatus';


import {
  useFonts,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_900Black
} from '@expo-google-fonts/lexend';

// Keep the splash screen visible while we fetch fonts + resources
SplashScreen.preventAutoHideAsync();

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
    console.log('📱 App started in Expo Go mode (Firebase disabled)');
    // On Android, imperatively set the status bar so it always shows
    // light (white) icons regardless of the system's light/dark theme
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('light-content', true);
      RNStatusBar.setBackgroundColor('transparent', true);
      RNStatusBar.setTranslucent(true);
    }
  }, []);

  // Set default font family globally
  const setGlobalStyles = () => {
    // @ts-ignore
    Text.defaultProps = Text.defaultProps || {};
    // @ts-ignore
    Text.defaultProps.style = { fontFamily: 'Lexend_400Regular' };
    // @ts-ignore
    Text.defaultProps.allowFontScaling = false;

    // @ts-ignore
    TextInput.defaultProps = TextInput.defaultProps || {};
    // @ts-ignore
    TextInput.defaultProps.style = { fontFamily: 'Lexend_400Regular' };
    // @ts-ignore
    TextInput.defaultProps.allowFontScaling = false;
  };

  useEffect(() => {
    if (fontsLoaded) {
      setGlobalStyles();
      // Hide splash screen now that app is ready (was held by preventAutoHideAsync)
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {/* backgroundColor="transparent" + translucent: the status bar overlays the app content.
          Since the app has a dark background, white icons (style="light") are always visible
          even when the device is in system light mode. Without this, Android puts a white
          background behind the status bar in light mode, making white icons invisible. */}
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <AppNavigator />
      <NetworkStatus />
    </SafeAreaProvider>
  );
}
