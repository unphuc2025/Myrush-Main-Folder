import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
// import { notificationService } from './src/services/NotificationService';

import { ActivityIndicator, View } from 'react-native';
import { useAppFonts } from './src/hooks/useAppFonts';

export default function App() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    console.log('📱 App started in Expo Go mode (Firebase disabled)');
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#39E079" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
