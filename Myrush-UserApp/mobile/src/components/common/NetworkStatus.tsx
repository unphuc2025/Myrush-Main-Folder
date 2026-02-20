import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 44;

export const NetworkStatus: React.FC = () => {
    // Track connection state in a ref to avoid stale closure in NetInfo callback
    const isConnectedRef = useRef<boolean | null>(true);
    const [bannerState, setBannerState] = useState<'offline' | 'online' | 'hidden'>('hidden');
    const slideAnim = useRef(new Animated.Value(BANNER_HEIGHT + 34)).current;
    const insets = useSafeAreaInsets();
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showBanner = (state: 'offline' | 'online') => {
        // Clear any existing hide timer when we need to show again
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        setBannerState(state);

        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        if (state === 'online') {
            // Auto-hide after 3 seconds
            hideTimerRef.current = setTimeout(() => {
                hideBanner();
            }, 3000);
        }
    };

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: BANNER_HEIGHT + (insets.bottom || 34),
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setBannerState('hidden');
        });
    };

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const connected = state.isConnected;
            const prevConnected = isConnectedRef.current;

            // Only act if state actually changed
            if (connected === prevConnected) return;

            const wasOffline = prevConnected === false;
            isConnectedRef.current = connected;

            if (connected === false) {
                // Went offline — show red banner and keep it visible
                showBanner('offline');
            } else if (connected === true && wasOffline) {
                // Came back online after being offline — show green, then hide
                showBanner('online');
            }
        });

        return () => {
            unsubscribe();
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []); // empty deps — we use ref to avoid stale closure

    if (bannerState === 'hidden') return null;

    const isOnline = bannerState === 'online';
    const backgroundColor = isOnline ? '#2E7D32' : '#C62828';
    const message = isOnline ? '✓  Back Online' : '✕  No Internet Connection';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor,
                    paddingBottom: Math.max(insets.bottom, 10),
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'auto',
        minHeight: BANNER_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        paddingTop: 10,
        paddingHorizontal: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: 'Lexend_500Medium',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
});
