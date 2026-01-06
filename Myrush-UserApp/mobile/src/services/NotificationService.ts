import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
// Firebase disabled for Expo Go - using mock implementation
// import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { notificationApi } from '../api/notifications';

const NOTIFICATION_TOKEN_KEY = '@notification_token';

// Mock Firebase types for Expo Go
type RemoteMessage = {
    notification?: {
        title?: string;
        body?: string;
    };
    data?: any;
};

class NotificationService {
    constructor() {
        console.log('📱 NotificationService: Running in Expo Go mode (Firebase disabled)');
    }

    // Initialize the service
    initialize() {
        console.log('📱 NotificationService: Initialized (mock mode)');
    }

    // Setup notification handler
    private setupNotificationHandler() {
        console.log('📱 NotificationService: Handler setup (mock mode)');
    }

    // Request permissions
    async requestPermissions(): Promise<boolean> {
        console.log('📱 NotificationService: Permissions requested (mock mode)');
        return true; // Mock: always return true
    }

    // Register for push notifications
    async registerForPushNotifications(): Promise<string | null> {
        console.log('📱 NotificationService: Registration requested (mock mode)');
        // Return a mock token
        const mockToken = 'expo-go-mock-token-' + Date.now();
        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, mockToken);
        return mockToken;
    }

    // Get stored token
    async getStoredToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
        } catch (error) {
            console.error('❌ Error getting stored token:', error);
            return null;
        }
    }

    // Setup listeners for incoming notifications
    setupListeners(
        onNotificationReceived?: (remoteMessage: RemoteMessage) => void,
        onNotificationOpened?: (remoteMessage: RemoteMessage) => void
    ): (() => void) {
        console.log('📱 NotificationService: Listeners setup (mock mode)');

        // Return mock unsubscribe function
        return () => {
            console.log('📱 NotificationService: Listeners unsubscribed (mock mode)');
        };
    }

    // Send test notification (for development)
    async sendTestNotification() {
        Alert.alert('Test Notification', 'This is a test notification (Expo Go mock)');
    }

    // Delete token
    async deleteToken() {
        try {
            await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
            console.log('✅ Push token deleted (mock mode)');
        } catch (error) {
            console.error('❌ Error deleting push token:', error);
        }
    }

    // Check if notifications are enabled
    async isNotificationsEnabled(): Promise<boolean> {
        console.log('📱 NotificationService: Checking if enabled (mock mode)');
        return true; // Mock: always return true
    }

    // Register token with backend
    async registerTokenWithBackend(token: string) {
        try {
            console.log('📱 NotificationService: Registering token with backend (mock mode)');

            const deviceInfo = {
                platform: Platform.OS,
                version: Platform.Version,
                model: 'Expo Go',
                manufacturer: 'Expo',
            };

            // Commenting out actual API call for Expo Go
            /*
            await notificationApi.registerPushToken({
                device_token: token,
                device_type: Platform.OS,
                device_info: deviceInfo,
            });
            */

            console.log('✅ Token registered with backend successfully (mock mode)');
            return true;
        } catch (error) {
            console.error('❌ Error registering token with backend:', error);
            return false;
        }
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
