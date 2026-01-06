import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { notificationService } from '../services/NotificationService';
import { wp, hp } from '../utils/responsive';
import { colors } from '../theme/colors';

const NotificationTest: React.FC = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notificationStatus, setNotificationStatus] = useState<string>('Checking...');
    const [lastNotification, setLastNotification] = useState<any>(null);

    useEffect(() => {
        checkNotificationStatus();
        getStoredToken();
        setupNotificationListeners();
    }, []);

    const checkNotificationStatus = async () => {
        try {
            const enabled = await notificationService.isNotificationsEnabled();
            setNotificationStatus(enabled ? '✅ Enabled' : '❌ Disabled');
        } catch (error) {
            setNotificationStatus('❌ Error checking status');
        }
    };

    const getStoredToken = async () => {
        try {
            const token = await notificationService.getStoredToken();
            setExpoPushToken(token);
        } catch (error) {
            console.error('Error getting stored token:', error);
        }
    };

    const setupNotificationListeners = () => {
        const unsubscribe = notificationService.setupListeners(
            (notification) => {
                console.log('📱 Test component received notification:', notification);
                setLastNotification({
                    type: 'received',
                    data: notification,
                    timestamp: new Date().toLocaleTimeString()
                });
                Alert.alert(
                    'Notification Received!',
                    `Title: ${notification.notification?.title || 'No Title'}\nBody: ${notification.notification?.body || 'No Body'}`
                );
            },
            (response) => {
                console.log('📱 Test component notification response:', response);
                setLastNotification({
                    type: 'opened',
                    data: response,
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        );

        return unsubscribe;
    };

    const requestPermissions = async () => {
        Alert.alert(
            'Request Permissions',
            'This will request notification permissions from the user.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Request',
                    onPress: async () => {
                        const token = await notificationService.registerForPushNotifications();
                        if (token) {
                            setExpoPushToken(token);
                            Alert.alert('Success', `Push token obtained: ${token}`);
                        } else {
                            Alert.alert('Failed', 'Could not obtain push token');
                        }
                        await checkNotificationStatus();
                    }
                }
            ]
        );
    };

    const sendLocalNotification = async () => {
        Alert.alert(
            'Local Notifications Not Available',
            'Local notification scheduling requires additional setup with React Native Firebase. Use "Send Test Notification" for immediate alerts.',
            [{ text: 'OK' }]
        );
    };

    const sendTestNotification = async () => {
        Alert.alert(
            'Send Test Notification',
            'This will immediately show a test notification.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: async () => {
                        await notificationService.sendTestNotification();
                        Alert.alert('Sent', 'Test notification sent (should appear in 1 second)');
                    }
                }
            ]
        );
    };

    const cancelAllNotifications = async () => {
        Alert.alert(
            'Cancel All Notifications',
            'This feature is not available with the current Firebase setup. Notifications are handled by FCM.',
            [{ text: 'OK' }]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🔔 Notification Test</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <Text style={styles.statusText}>Notifications: {notificationStatus}</Text>
                <Text style={styles.tokenText}>
                    Token: {expoPushToken ? `${expoPushToken.substring(0, 20)}...` : 'Not available'}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>

                <TouchableOpacity style={styles.button} onPress={requestPermissions}>
                    <Text style={styles.buttonText}>🔑 Request Permissions</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={sendTestNotification}>
                    <Text style={styles.buttonText}>📱 Send Test Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={sendLocalNotification}>
                    <Text style={styles.buttonText}>⏰ Schedule Local Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonSecondary} onPress={cancelAllNotifications}>
                    <Text style={styles.buttonTextSecondary}>❌ Cancel All Notifications</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Last Notification</Text>
                {lastNotification ? (
                    <View style={styles.notificationInfo}>
                        <Text style={styles.infoText}>Type: {lastNotification.type}</Text>
                        <Text style={styles.infoText}>Time: {lastNotification.timestamp}</Text>
                        <Text style={styles.infoText} numberOfLines={3}>
                            Data: {JSON.stringify(lastNotification.data, null, 2)}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.noNotificationText}>No notifications received yet</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Testing Instructions</Text>
                <Text style={styles.instructionText}>
                    1. Tap "Request Permissions" to enable notifications{'\n'}
                    2. Check console logs for push token{'\n'}
                    3. Try "Send Test Notification" for immediate test{'\n'}
                    4. Try "Schedule Local Notification" for delayed test{'\n'}
                    5. Use external tools to send push notifications{'\n'}
                    6. Check "Last Notification" for received events
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔗 FCM Push Token</Text>
                <Text style={styles.tokenFullText} selectable>
                    {expoPushToken || 'Token not available yet'}
                </Text>
                {expoPushToken && (
                    <Text style={styles.instructionText}>
                        Copy this token to test push notifications from external services
                    </Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
        padding: wp(5),
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: hp(3),
    },
    section: {
        backgroundColor: colors.background.primary,
        borderRadius: 12,
        padding: wp(4),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: hp(1.5),
    },
    statusText: {
        fontSize: 16,
        color: colors.primary,
        marginBottom: hp(1),
    },
    tokenText: {
        fontSize: 14,
        color: colors.text.secondary,
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(4),
        borderRadius: 8,
        marginBottom: hp(1),
        alignItems: 'center',
    },
    buttonSecondary: {
        backgroundColor: colors.error,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(4),
        borderRadius: 8,
        marginBottom: hp(1),
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextSecondary: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    notificationInfo: {
        backgroundColor: colors.background.secondary,
        padding: wp(3),
        borderRadius: 6,
    },
    infoText: {
        fontSize: 14,
        color: colors.text.primary,
        marginBottom: hp(0.5),
        fontFamily: 'monospace',
    },
    noNotificationText: {
        fontSize: 16,
        color: colors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: hp(2),
    },
    instructionText: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
    },
    tokenFullText: {
        fontSize: 12,
        color: colors.text.primary,
        fontFamily: 'monospace',
        backgroundColor: colors.background.secondary,
        padding: wp(2),
        borderRadius: 4,
        marginBottom: hp(1),
    },
});

export default NotificationTest;
