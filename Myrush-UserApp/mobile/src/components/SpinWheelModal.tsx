import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, Dimensions, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { moderateScale, fontScale, wp, hp } from '../utils/responsive';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.9; // Slightly larger for impact
const RADIUS = WHEEL_SIZE / 2;

// 10 Segments matching the reference image (100-1000)
// Colors: Alternating Dark Pink/Magenta and Light Pink
const SEGMENTS = [
    { label: '100', color: '#880E4F', textColor: '#FFF' },   // Dark Magenta
    { label: '200', color: '#F8BBD0', textColor: '#880E4F' }, // Light Pink
    { label: '300', color: '#C2185B', textColor: '#FFF' },
    { label: '400', color: '#F8BBD0', textColor: '#880E4F' },
    { label: '500', color: '#D81B60', textColor: '#FFF' },
    { label: '600', color: '#F8BBD0', textColor: '#880E4F' },
    { label: '700', color: '#AD1457', textColor: '#FFF' },
    { label: '800', color: '#F8BBD0', textColor: '#880E4F' },
    { label: '900', color: '#E91E63', textColor: '#FFF' },
    { label: '1000', color: '#F8BBD0', textColor: '#880E4F' },
];

const SEGMENT_ANGLE = 360 / SEGMENTS.length; // 36 degrees
// Triangle Geometry for 36deg wedge:
// tan(18deg) = 0.3249
const HALF_WEDGE_WIDTH = RADIUS * 0.3249;

interface SpinWheelModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({ visible, onClose }) => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<typeof SEGMENTS[0] | null>(null);

    // Pulse animation for the center button
    useEffect(() => {
        if (!spinning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseValue, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseValue, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseValue.setValue(1);
        }
    }, [spinning]);

    const startSpin = () => {
        if (spinning) return;
        setSpinning(true);
        setResult(null);
        spinValue.setValue(0);

        const randomAngle = Math.floor(Math.random() * 360);
        const spinTo = (360 * 5) + randomAngle; // 5 Full spins + random

        Animated.timing(spinValue, {
            toValue: spinTo,
            duration: 4000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
        }).start(() => {
            setSpinning(false);

            const normalizedAngle = spinTo % 360;
            // Pointer is at Top (0deg visually in container? No, usually Top is -90deg or 270deg)
            // Our wedges starts at 0deg (East/Right).
            // If we rotate clockwise by `spinTo`, the wedge at Top is:
            // (270 - spinTo) % 360.

            let angleAtPointer = (270 - normalizedAngle) % 360;
            if (angleAtPointer < 0) angleAtPointer += 360;

            const index = Math.floor(angleAtPointer / SEGMENT_ANGLE);
            setResult(SEGMENTS[index]);
        });
    };

    const spin = spinValue.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    // Render "Lights" on the ring
    const renderLights = () => {
        const lights = [];
        const totalLights = 24;
        for (let i = 0; i < totalLights; i++) {
            const rotate = `${i * (360 / totalLights)}deg`;
            lights.push(
                <View
                    key={i}
                    style={[
                        styles.lightContainer,
                        { transform: [{ rotate: rotate }] }
                    ]}
                >
                    <View style={styles.lightBulb} />
                </View>
            );
        }
        return lights;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.mainContainer}>

                    <Text style={styles.headerTitle}>PREMIUM WHEEL</Text>
                    <Text style={styles.headerSubtitle}>Spin for Exclusive Rewards</Text>

                    <View style={styles.wheelContainer}>

                        {/* Outer Rim with Lights */}
                        <LinearGradient
                            colors={['#4A148C', '#2A0E45']} // Dark Purple Rim
                            style={styles.outerRim}
                        >
                            {renderLights()}

                            {/* Inner Gold Border */}
                            <View style={styles.goldBorder}>
                                <View style={styles.wheelInner}>
                                    <Animated.View style={[styles.spinningPart, { transform: [{ rotate: spin }] }]}>
                                        {SEGMENTS.map((segment, index) => {
                                            const rotate = `${index * SEGMENT_ANGLE}deg`;
                                            return (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.segmentContainer,
                                                        { transform: [{ rotate: rotate }] }
                                                    ]}
                                                >
                                                    {/* Wedge Shape */}
                                                    <View style={[
                                                        styles.wedge,
                                                        {
                                                            borderTopColor: segment.color,
                                                            borderLeftWidth: HALF_WEDGE_WIDTH + 1, // +1 for overlap/antialiasing
                                                            borderRightWidth: HALF_WEDGE_WIDTH + 1,
                                                        }
                                                    ]} />

                                                    {/* Text/Content */}
                                                    <View style={styles.segmentContent}>
                                                        <Text style={[styles.segmentText, { color: segment.textColor }]}>
                                                            {segment.label}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )
                                        })}
                                    </Animated.View>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Pointer (Tear Drop) */}
                        <View style={styles.pointerWrapper}>
                            <View style={styles.pointerGoldBorder}>
                                <LinearGradient
                                    colors={['#FFD700', '#FFA000']}
                                    style={styles.pointerBody}
                                />
                            </View>
                        </View>

                        {/* Center Hub */}
                        <View style={styles.centerHubWrapper}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={startSpin}
                                disabled={spinning}
                            >
                                <Animated.View style={[styles.centerHub, { transform: [{ scale: pulseValue }] }]}>
                                    <LinearGradient
                                        colors={['#FFD700', '#F57F17', '#FFD700']}
                                        style={styles.hubGradient}
                                    >
                                        <View style={styles.hubInner}>
                                            <Text style={styles.spinLabel}>{spinning ? '...' : 'SPIN'}</Text>
                                        </View>
                                    </LinearGradient>
                                </Animated.View>
                            </TouchableOpacity>
                        </View>

                    </View>

                    {/* Win Result Modal/Overlay */}
                    {result && !spinning && (
                        <View style={styles.winCard}>
                            <Text style={styles.winTitle}>CONGRATULATIONS!</Text>
                            <Text style={styles.winAmount}>{result.label}</Text>
                            <Text style={styles.winSub}>Points Added</Text>

                            <TouchableOpacity style={styles.claimBtn} onPress={onClose}>
                                <LinearGradient colors={['#E91E63', '#C2185B']} style={styles.claimGradient}>
                                    <Text style={styles.claimText}>Collect</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close-circle-outline" size={36} color="#FFF" />
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(20, 0, 40, 0.95)', // Deep purple overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContainer: {
        alignItems: 'center',
        width: '100%',
    },
    headerTitle: {
        fontSize: fontScale(28),
        fontWeight: 'bold',
        color: '#FFD700',
        letterSpacing: 2,
        marginBottom: 5,
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowRadius: 10,
    },
    headerSubtitle: {
        fontSize: fontScale(14),
        color: '#E1BEE7',
        marginBottom: hp(4),
    },
    wheelContainer: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    outerRim: {
        width: '100%',
        height: '100%',
        borderRadius: WHEEL_SIZE / 2,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
        borderWidth: 2,
        borderColor: '#6A1B9A',
    },
    lightContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    lightBulb: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF176', // Light Yellow
        marginTop: 4, // Offset from edge
        shadowColor: '#FFF',
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    goldBorder: {
        width: '100%',
        height: '100%',
        borderRadius: WHEEL_SIZE / 2,
        padding: 4,
        backgroundColor: '#FFD700', // Gold ring inside purple
    },
    wheelInner: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: (WHEEL_SIZE) / 2,
        overflow: 'hidden',
        position: 'relative',
    },
    spinningPart: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },

    // WEDGE LOGIC
    segmentContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        justifyContent: 'flex-start', // Items at top
        alignItems: 'center',
    },
    wedge: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderTopWidth: RADIUS,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        // Borders defined in inline style
    },
    segmentContent: {
        position: 'absolute',
        top: 30, // Distance from center? No, distance from Edge.
        alignItems: 'center',
        // Rotate text to read from outside in? Or inside out?
        // In reference, 100 is readable with head towards center.
        // Top segment: We want text upright?
        // Actually, simple text is fine.
    },
    segmentText: {
        fontSize: fontScale(14),
        fontWeight: 'bold',
        // Transform needed if we want specific orientation
    },

    // POINTER
    pointerWrapper: {
        position: 'absolute',
        top: -20,
        zIndex: 50,
        alignItems: 'center',
    },
    pointerGoldBorder: {
        width: 50,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    pointerBody: {
        width: 40,
        height: 50,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomEndRadius: 0, // Make it pointy at bottom?
        // Tear drop shape: Circle top, point bottom.
        // Actually Pointer points DOWN to the wheel.
        // Re-do shape:
        borderRadius: 5,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        // Triangle hack is better for pointer.
    },

    // CENTER HUB
    centerHubWrapper: {
        position: 'absolute',
        zIndex: 40,
    },
    centerHub: {
        width: 70,
        height: 70,
        borderRadius: 35,
        // Gold metallic look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
    },
    hubGradient: {
        flex: 1,
        borderRadius: 35,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hubInner: {
        flex: 1,
        width: '100%',
        borderRadius: 35,
        backgroundColor: '#B71C1C', // Deep Red Center or Gold?
        // Reference has Gold/Bronze center.
        backgroundColor: '#F57F17',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF59D',
    },
    spinLabel: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 14,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowRadius: 2,
    },

    // WIN CARD
    winCard: {
        position: 'absolute',
        bottom: hp(15),
        backgroundColor: '#2A0E45',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        width: '80%',
        shadowColor: '#E91E63',
        shadowRadius: 20,
        shadowOpacity: 0.6,
        elevation: 20,
    },
    winTitle: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    winAmount: {
        color: '#FFF',
        fontSize: 48,
        fontWeight: '900',
        textShadowColor: '#E91E63',
        textShadowRadius: 10,
    },
    winSub: {
        color: '#E0E0E0',
        fontSize: 14,
        marginBottom: 20,
    },
    claimBtn: {
        width: '100%',
        borderRadius: 25,
        overflow: 'hidden',
    },
    claimGradient: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    claimText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },

    closeBtn: {
        position: 'absolute',
        bottom: hp(5),
    },
});

export default SpinWheelModal;
