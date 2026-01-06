import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
// import { notificationService } from './src/services/NotificationService';

export default function App() {
  useEffect(() => {
    // Firebase notifications disabled for Expo Go testing
    // To enable: uncomment the code below and build a development build

    /*
    // Initialize FCM Notifications (Android & iOS)
    const initializeNotifications = async () => {
      try {
        console.log('🚀 Initializing FCM Notifications...');

        // Initialize service (setup handlers)
        notificationService.initialize();

        // Register for push notifications
        const token = await notificationService.registerForPushNotifications();

        if (token) {
          console.log('✅ FCM token obtained:', token);

          // Register token with backend
          const registered = await notificationService.registerTokenWithBackend(token);
          if (registered) {
            console.log('✅ Token registered with backend');
          } else {
            console.log('⚠️ Token registration failed, but token stored locally');
          }
        } else {
          console.log('❌ Failed to get FCM token');
        }

        // Setup notification listeners
        const unsubscribe = notificationService.setupListeners(
          (remoteMessage) => {
            console.log('📱 Foreground notification received:', remoteMessage);
            // Handle foreground notification
          },
          (remoteMessage) => {
            console.log('📱 Notification opened from background:', remoteMessage);
            // Handle notification opened
          }
        );

        console.log('🎉 FCM Notifications initialized successfully!');

        // Cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    // Initialize notifications on app start (Android only)
    let cleanup: Promise<any> | undefined;
    if (Platform.OS === 'android') {
      cleanup = initializeNotifications();
    }

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup.then(unsubscribe => unsubscribe?.());
      }
    };
    */

    console.log('📱 App started in Expo Go mode (Firebase disabled)');
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
