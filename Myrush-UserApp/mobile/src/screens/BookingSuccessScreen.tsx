import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, Share, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { LinearGradient } from 'expo-linear-gradient';

type BookingSuccessRouteProp = RouteProp<RootStackParamList, 'BookingSuccess'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const BookingSuccessScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<BookingSuccessRouteProp>();
    const insets = useSafeAreaInsets();

    // Mock Data (or from params)
    const {
        venue = "Central Sports Arena",
        date = "Today",
        timeSlot = "7:00 AM",
        totalAmount = 1200,
        bookingId = "#839201",
        selectedSlots,
        paymentId
    } = route.params || {};

    const handleViewBookings = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{
                    name: 'MainTabs',
                    state: {
                        routes: [{ name: 'BookTab' }], // Fixed route name from 'Book' to 'BookTab'
                    },
                }],
            })
        );
    };

    const handleInviteFriends = async () => {
        try {
            const result = await Share.share({
                message: `Hey! I just booked a slot at ${venue} for ${date} at ${timeSlot}. Join me for a game on MyRush!`,
            });
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
        } catch (error: any) {
            console.log(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header - Fixed Overlap */}
            <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + hp(2) : insets.top + hp(2) }]}>
                <TouchableOpacity onPress={handleViewBookings} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Success Message */}
                <Text style={styles.successTitle}>SUCCESS!</Text>
                <Text style={styles.successSub}>Your slot has been reserved.</Text>

                {/* Animated Check Circle (Static for now) */}
                <View style={styles.successCard}>
                    <LinearGradient
                        colors={[colors.primary, '#2C2C2E']} // Gradient hint or just primary
                        style={styles.checkCircle}
                    >
                        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                            <Ionicons name="checkmark" size={40} color="#fff" />
                        </View>
                    </LinearGradient>

                    <Text style={styles.confirmedText}>Booking Confirmed</Text>
                    <Text style={styles.idText}>Booking ID: {bookingId}</Text>
                    {paymentId && (
                        <Text style={[styles.idText, { marginTop: 4, opacity: 0.7 }]}>Payment Ref: {paymentId}</Text>
                    )}
                </View>

                {/* Details Ticket */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Venue</Text>
                        <Text style={styles.value}>{venue}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Time</Text>
                        <Text style={styles.value}>{timeSlot}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.totalLabel}>Total Paid</Text>
                        <Text style={styles.totalValue}>₹{totalAmount}</Text>
                    </View>
                </View>

                {/* Actions */}
                <TouchableOpacity style={styles.actionButton} onPress={handleViewBookings}>
                    <Text style={styles.actionButtonText}>View My Bookings</Text>
                </TouchableOpacity>

                <View style={styles.inviteContainer}>
                    <Text style={styles.inviteLabel}>Game on better with friends</Text>
                    <TouchableOpacity onPress={handleInviteFriends}>
                        <Text style={styles.inviteLink}>INVITE FRIENDS</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(2),
    },
    closeButton: {
        alignSelf: 'flex-start',
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: wp(5),
        alignItems: 'center',
        paddingTop: hp(2),
    },
    successTitle: {
        fontSize: fontScale(28),
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: hp(0.5),
    },
    successSub: {
        fontSize: fontScale(14),
        color: '#888',
        marginBottom: hp(4),
    },
    successCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(24),
        paddingVertical: hp(4),
        paddingHorizontal: wp(10),
        alignItems: 'center',
        width: '100%',
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: '#333',
    },
    checkCircle: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2),
        elevation: 10,
        shadowColor: colors.primary, // Glow effect
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    confirmedText: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: '#fff',
        marginBottom: hp(0.5),
    },
    idText: {
        fontSize: fontScale(12),
        color: '#666',
    },
    detailsCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(20),
        padding: moderateScale(20),
        width: '100%',
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: '#333',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    label: {
        color: '#888',
        fontSize: fontScale(14),
    },
    value: {
        color: '#fff',
        fontSize: fontScale(14),
        fontWeight: '700',
        textAlign: 'right',
        flex: 1,
        marginLeft: wp(4)
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: hp(1.5),
    },
    totalLabel: {
        color: '#fff',
        fontSize: fontScale(18),
        fontWeight: '700',
    },
    totalValue: {
        color: colors.primary,
        fontSize: fontScale(20),
        fontWeight: '700',
    },
    actionButton: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(100), // Pill shape
        paddingVertical: hp(2),
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: hp(4),
    },
    actionButtonText: {
        color: '#fff',
        fontSize: fontScale(16),
        fontWeight: '600',
    },
    inviteContainer: {
        alignItems: 'center',
        gap: hp(1),
    },
    inviteLabel: {
        color: '#666',
        fontSize: fontScale(12),
    },
    inviteLink: {
        color: colors.primary,
        fontSize: fontScale(14),
        fontWeight: '800',
        letterSpacing: 1,
    }
});

export default BookingSuccessScreen;
