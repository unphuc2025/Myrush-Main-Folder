import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    PanResponder,
    Animated,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { couponsApi, bookingsApi, paymentsApi } from '../api/venues';
import { useAuthStore } from '../store/authStore';

// Conditional import for Razorpay - Only works in development builds, not Expo Go
let RazorpayCheckout: any = null;
try {
    RazorpayCheckout = require('react-native-razorpay').default;
} catch (error) {
    console.log('[Razorpay] Native module not available (Expo Go) - using fallback');
}


type BookingDetailsRouteProp = RouteProp<RootStackParamList, 'BookingDetails'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

// Slide Button Component (PanResponder Version)
const SlideToPay = ({ amount, onSlideSuccess }: { amount: number, onSlideSuccess: () => void }) => {
    const BUTTON_HEIGHT = hp(7);
    const CONTAINER_PADDING = 4;
    const BUTTON_WIDTH = wp(90);
    const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - (CONTAINER_PADDING * 2);
    const H_SWIPE_RANGE = BUTTON_WIDTH - SWIPEABLE_DIMENSIONS - (CONTAINER_PADDING * 2);

    const [toggled, setToggled] = useState(false);
    const pan = useRef(new Animated.ValueXY()).current;

    // Animate text opacity based on drag
    const textOpacity = pan.x.interpolate({
        inputRange: [0, H_SWIPE_RANGE / 2],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Initialize
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                if (toggled) return;

                if (gestureState.dx > H_SWIPE_RANGE * 0.7) { // Trigger at 70%
                    // Complete the swipe
                    Animated.spring(pan, {
                        toValue: { x: H_SWIPE_RANGE, y: 0 },
                        useNativeDriver: false,
                    }).start(() => {
                        setToggled(true);
                        onSlideSuccess();
                    });
                } else {
                    // Reset
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    // Clamp the slide movement
    const slideTransform = {
        transform: [{
            translateX: pan.x.interpolate({
                inputRange: [0, H_SWIPE_RANGE],
                outputRange: [0, H_SWIPE_RANGE],
                extrapolate: 'clamp',
            })
        }]
    };

    return (
        <View style={[styles.slideButtonContainer, { width: BUTTON_WIDTH, height: BUTTON_HEIGHT }]}>
            {/* Background Text */}
            <Animated.Text style={[styles.slideText, { opacity: textOpacity }]}>
                SLIDE TO PAY ₹{amount}
            </Animated.Text>

            {/* Slider Handle */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.slideHandle,
                    {
                        width: SWIPEABLE_DIMENSIONS,
                        height: SWIPEABLE_DIMENSIONS,
                        top: CONTAINER_PADDING,
                        left: CONTAINER_PADDING
                    },
                    slideTransform
                ]}
            >
                <Ionicons name="arrow-forward" size={24} color="#000" />
            </Animated.View>
        </View>
    );
};

const BookingDetailsScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<BookingDetailsRouteProp>();

    // Params
    const { venue, date, month, timeSlot, selectedSlots, totalPrice } = route.params || {};

    // State for functionality
    const [numPlayers, setNumPlayers] = useState(2);
    const [teamName, setTeamName] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const { user } = useAuthStore();

    // Payment Method State
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | null>('upi');

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [showCouponDropdown, setShowCouponDropdown] = useState(false);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [couponResult, setCouponResult] = useState<{
        valid: boolean;
        discount_percentage?: number;
        discount_amount?: number;
        final_amount?: number;
        message: string;
    } | null>(null);

    // Financials
    const platformFee = 20;

    // Calculate Costs Dynamic
    const calculateBasePrice = () => {
        // As per user request: Cost calculated based on Number of Players
        // Assuming Price passed (totalPrice) is per-slot/per-game base.
        // Formula: (Slots Total * Players). 
        // Note: If totalPrice is already aggregate of slots, we multipy by players.
        return (totalPrice || 0) * numPlayers;
    };

    const basePrice = calculateBasePrice();
    const discountAmount = couponResult?.valid && couponResult.discount_amount ? couponResult.discount_amount : 0;
    const finalTotal = basePrice + platformFee - discountAmount;

    // Load Coupons
    useEffect(() => {
        loadAvailableCoupons();
    }, []);

    // Recalculate coupon if players change (since base total changes)
    useEffect(() => {
        if (couponResult?.valid && couponCode) {
            validateCoupon(couponCode); // Re-validate with new total
        }
    }, [numPlayers]);

    const loadAvailableCoupons = async () => {
        try {
            const result = await couponsApi.getAvailableCoupons();
            if (result.success && result.data) {
                setAvailableCoupons(result.data);
            }
        } catch (error) {
            console.error('Failed to load coupons', error);
        }
    };

    const validateCoupon = async (code: string) => {
        if (!code.trim()) return;

        setIsValidatingCoupon(true);
        try {
            const currentTotal = calculateBasePrice(); // Check against base price
            const result = await couponsApi.validateCoupon(code.trim(), currentTotal);

            if (result.success && result.data) {
                setCouponResult(result.data);
                if (!result.data.valid) {
                    Alert.alert('Invalid Coupon', result.data.message || 'This coupon code is not valid.');
                }
            } else {
                Alert.alert('Invalid Coupon', 'This coupon code is not valid.');
                setCouponResult({ valid: false, message: 'Invalid Coupon' });
            }
        } catch (error) {
            console.error('Coupon validation error', error);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleApplyManual = () => {
        if (!couponCode.trim()) {
            Alert.alert('Error', 'Please enter a coupon code');
            return;
        }
        validateCoupon(couponCode).then(() => {
            // We can check local state or assume updated object from effect/promise, 
            // sadly state updates are async. We'll rely on the visual feedback.
        });
    };

    const handleSelectCoupon = (coupon: any) => {
        setCouponCode(coupon.code);
        setShowCouponDropdown(false);
        validateCoupon(coupon.code);
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setCouponResult(null);
    };

    const handleIncrement = () => setNumPlayers(prev => prev + 1);
    const handleDecrement = () => numPlayers > 1 && setNumPlayers(prev => prev - 1);

    const handleConfirmBooking = async () => {
        if (isBookingLoading) return;

        if (!selectedPaymentMethod) {
            Alert.alert('Select Payment', 'Please select a payment method to continue.');
            return;
        }

        setIsBookingLoading(true);
        try {
            // Construct Date String (YYYY-MM-DD)
            const formattedMonth = (route.params?.monthIndex !== undefined ? route.params.monthIndex + 1 : 1).toString().padStart(2, '0');
            const formattedDay = (date || 1).toString().padStart(2, '0');
            const bookingDate = `${route.params?.year || 2024}-${formattedMonth}-${formattedDay}`;

            // Duration (assuming 60 mins per slot for now if not provided)
            const duration = (selectedSlots?.length || 1) * 60;

            // 1. Create Order on Backend
            const orderResult = await paymentsApi.createOrder({
                courtId: route.params?.venueObject?.id || 'unknown_court',
                bookingDate: bookingDate,
                startTime: timeSlot || selectedSlots?.[0]?.time || "07:00",
                durationMinutes: duration,
                timeSlots: selectedSlots || [],
                numberOfPlayers: numPlayers,
                couponCode: couponResult?.valid ? couponCode : undefined
            });

            if (!orderResult.success || !orderResult.data) {
                Alert.alert('Order Failed', orderResult.error || 'Could not initiate payment.');
                setIsBookingLoading(false);
                return;
            }

            const { id: order_id, key_id, amount, currency } = orderResult.data;


            // 2. Open Razorpay Checkout
            const options = {
                description: `Booking for ${venue}`,
                image: 'https://myrush.app/logo.png',
                currency: currency,
                key: key_id,
                amount: amount,
                name: 'MyRush',
                order_id: order_id,
                prefill: {
                    email: user?.email || 'guest@myrush.app',
                    contact: (user as any)?.phone_number || (user as any)?.phoneNumber || '',
                    name: user ? `${user.firstName} ${user.lastName}` : 'Guest User',
                    method: selectedPaymentMethod === 'upi' ? 'upi' : 'card'
                },
                theme: { color: colors.primary || '#CCFF00' },
                modal: {
                    ondismiss: () => setIsBookingLoading(false)
                }
            };

            // Check if Razorpay native module is available
            if (RazorpayCheckout) {
                RazorpayCheckout.open(options).then(async (data: any) => {
                    // handle success
                    console.log('Razorpay Success:', data);
                    await processSuccessfulBooking(data);
                }).catch((error: any) => {
                    // handle failure
                    console.log('Razorpay Error:', error);
                    Alert.alert('Payment Cancelled', error.description || 'Payment was cancelled or failed.');
                    setIsBookingLoading(false);
                });
            } else {
                // Expo Go / Dev Fallback
                console.log('Razorpay Native Module not found (Expo Go). Simulating success.');
                Alert.alert(
                    'Dev Mode (Expo Go)',
                    'Razorpay native module is not available in Expo Go. Simulating a successful payment for testing?',
                    [
                        { text: 'Cancel', onPress: () => setIsBookingLoading(false), style: 'cancel' },
                        {
                            text: 'Simulate Success',
                            onPress: async () => {
                                await processSuccessfulBooking({
                                    razorpay_payment_id: 'pay_mock_' + Date.now(),
                                    razorpay_order_id: 'order_mock_' + Date.now(),
                                    razorpay_signature: 'sig_mock_' + Date.now()
                                });
                            }
                        }
                    ]
                );
            }

        } catch (error: any) {
            console.error('Booking Flow Error:', error);
            Alert.alert('Error', error.message || 'An unexpected error occurred.');
            setIsBookingLoading(false);
        }
    };

    const processSuccessfulBooking = async (response: any) => {
        try {
            // 3. Create Booking with Payment Details
            const formattedMonth = (route.params?.monthIndex !== undefined ? route.params.monthIndex + 1 : 1).toString().padStart(2, '0');
            const formattedDay = (date || 1).toString().padStart(2, '0');
            const bookingDate = `${route.params?.year || 2024}-${formattedMonth}-${formattedDay}`;
            const duration = (selectedSlots?.length || 1) * 60;

            console.log('[BOOKING DETAILS] Processing Razorpay Response:', response);

            const result = await bookingsApi.createBooking({
                userId: user?.id || 'guest',
                courtId: route.params?.venueObject?.id || 'unknown_court',
                bookingDate: bookingDate,
                startTime: timeSlot || selectedSlots?.[0]?.time || "07:00",
                durationMinutes: duration,
                numberOfPlayers: numPlayers,
                pricePerHour: route.params?.slotPrice || 200,
                teamName: teamName,
                specialRequests: specialRequests,

                // Detailed data
                timeSlots: selectedSlots,
                originalAmount: finalTotal + (couponResult?.discount_amount || 0),
                discountAmount: couponResult?.discount_amount || 0,
                couponCode: couponResult?.valid ? couponCode : undefined,
                totalAmount: finalTotal,

                // Razorpay Details - USE REAL DATA
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
            });

            if (result.success && result.data) {
                // Success! Navigate to Success Screen
                navigation.navigate('BookingSuccess', {
                    venue: venue || "Central Arena",
                    date: `${month} ${date}`,
                    timeSlot: timeSlot || "7:00 AM",
                    totalAmount: result.data.total_amount || finalTotal, // Use backend amount preferably
                    bookingId: result.data.id || result.data.booking_id || '#839201',
                    selectedSlots,
                    paymentId: response.razorpay_payment_id
                });
            } else {
                Alert.alert('Booking Failed', result.error || 'Payment successful but booking creation failed. Please contact support.');
            }
        } catch (error) {
            console.error('Process Booking Error:', error);
            Alert.alert('Error', 'Failed to process booking after payment.');
        } finally {
            setIsBookingLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: wp(10) }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* 1. BOOKING DETAILS (Players & Team) */}
                    <Text style={styles.sectionHeader}>BOOKING DETAILS</Text>
                    <View style={styles.detailsCard}>
                        {/* Number of Players */}
                        <View style={styles.playerRow}>
                            <View>
                                <Text style={styles.inputLabel}>Number of Players</Text>
                                <Text style={styles.inputSubLabel}>Total players on pitch</Text>
                            </View>
                            <View style={styles.counterContainer}>
                                <TouchableOpacity onPress={handleDecrement} style={styles.counterBtn}>
                                    <Ionicons name="remove" size={16} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.counterText}>{numPlayers}</Text>
                                <TouchableOpacity onPress={handleIncrement} style={styles.counterBtn}>
                                    <Ionicons name="add" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Inputs */}
                        <TextInput
                            style={styles.input}
                            placeholder="Team Name (Optional)"
                            placeholderTextColor="#666"
                            value={teamName}
                            onChangeText={setTeamName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Special Requests (Optional)"
                            placeholderTextColor="#666"
                            value={specialRequests}
                            onChangeText={setSpecialRequests}
                        />
                    </View>

                    {/* 2. OFFERS & COUPONS */}
                    <Text style={styles.sectionHeader}>OFFERS & COUPONS</Text>
                    <View style={styles.couponContainer}>
                        {couponResult?.valid ? (
                            <View style={styles.couponAppliedWrapper}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.couponAppliedCode}>{couponCode}</Text>
                                    <Text style={styles.couponAppliedMsg}>
                                        Save ₹{couponResult.discount_amount} with this code
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={handleRemoveCoupon}>
                                    <Ionicons name="close-circle" size={24} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.couponInputWrapper}>
                                    <MaterialCommunityIcons name="ticket-percent-outline" size={20} color="#666" style={styles.couponIcon} />
                                    <TextInput
                                        style={styles.couponInput}
                                        placeholder="Enter Coupon Code"
                                        placeholderTextColor="#666"
                                        value={couponCode}
                                        onChangeText={setCouponCode}
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity onPress={() => setShowCouponDropdown(true)}>
                                        <Ionicons name="chevron-down" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={[styles.applyBtn, isValidatingCoupon && { opacity: 0.7 }]}
                                    onPress={handleApplyManual}
                                    disabled={isValidatingCoupon}
                                >
                                    {isValidatingCoupon ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Text style={styles.applyBtnText}>APPLY</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* 3. ORDER SUMMARY */}
                    <Text style={styles.sectionHeader}>ORDER SUMMARY</Text>
                    <View style={styles.orderCard}>
                        <View style={styles.venueRow}>
                            <View style={styles.venueIcon}>
                                <MaterialCommunityIcons name="soccer-field" size={moderateScale(24)} color="#fff" />
                            </View>
                            <View style={styles.venueInfo}>
                                <Text style={styles.venueName}>{venue}</Text>
                                <Text style={styles.venueDetails}>
                                    {month} {date}, {timeSlot} • {selectedSlots?.length} Slot(s)
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Base Price (x{numPlayers} Players)</Text>
                            <Text style={styles.costValue}>₹{basePrice}</Text>
                        </View>
                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Platform Fee</Text>
                            <Text style={styles.costValue}>₹{platformFee}</Text>
                        </View>
                        {discountAmount > 0 && (
                            <View style={styles.costRow}>
                                <Text style={[styles.costLabel, { color: colors.primary }]}>Discount</Text>
                                <Text style={[styles.costValue, { color: colors.primary }]}>- ₹{discountAmount}</Text>
                            </View>
                        )}

                        <View style={[styles.divider, { marginVertical: hp(1) }]} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₹{finalTotal}</Text>
                        </View>
                    </View>

                    {/* 4. PAYMENT METHOD */}
                    <Text style={styles.sectionHeader}>PAYMENT METHOD</Text>

                    {/* Payment Options */}
                    <View style={styles.paymentOptionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.optionCard,
                                selectedPaymentMethod === 'upi' && styles.optionCardSelected
                            ]}
                            onPress={() => setSelectedPaymentMethod('upi')}
                        >
                            <View style={styles.optionRow}>
                                <MaterialCommunityIcons
                                    name="bank"
                                    size={24}
                                    color={selectedPaymentMethod === 'upi' ? colors.primary : '#fff'}
                                />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[
                                        styles.optionText,
                                        selectedPaymentMethod === 'upi' && { color: colors.primary, fontWeight: '700' }
                                    ]}>
                                        UPI / GPay / PhonePe
                                    </Text>
                                    <Text style={styles.optionSubText}>Pay via any UPI app</Text>
                                </View>
                            </View>
                            {selectedPaymentMethod === 'upi' && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.optionCard,
                                selectedPaymentMethod === 'card' && styles.optionCardSelected
                            ]}
                            onPress={() => setSelectedPaymentMethod('card')}
                        >
                            <View style={styles.optionRow}>
                                <Ionicons
                                    name="card-outline"
                                    size={24}
                                    color={selectedPaymentMethod === 'card' ? colors.primary : '#fff'}
                                />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[
                                        styles.optionText,
                                        selectedPaymentMethod === 'card' && { color: colors.primary, fontWeight: '700' }
                                    ]}>
                                        Credit / Debit Card
                                    </Text>
                                    <Text style={styles.optionSubText}>Visa, Mastercard, RuPay & more</Text>
                                </View>
                            </View>
                            {selectedPaymentMethod === 'card' && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={styles.footer}>
                <SlideToPay
                    amount={finalTotal}
                    onSlideSuccess={handleConfirmBooking}
                />
            </View>

            {/* Coupon Dropdown Modal */}
            <Modal
                visible={showCouponDropdown}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCouponDropdown(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Coupon</Text>
                            <TouchableOpacity onPress={() => setShowCouponDropdown(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={availableCoupons}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalCouponItem}
                                    onPress={() => handleSelectCoupon(item)}
                                >
                                    <View>
                                        <Text style={styles.modalCouponCode}>{item.code}</Text>
                                        <Text style={styles.modalCouponDesc}>{item.description}</Text>
                                    </View>
                                    <Text style={styles.modalCouponValue}>
                                        {item.discount_type === 'percentage' ? `${item.discount_value}%` : `₹${item.discount_value}`} OFF
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>No coupons found</Text>}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp(2) : hp(6),
        paddingBottom: hp(2),
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(15),
    },
    sectionHeader: {
        fontSize: fontScale(12),
        fontWeight: '700',
        color: '#666',
        marginTop: hp(3),
        marginBottom: hp(1.5),
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Booking Details
    detailsCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: moderateScale(16),
        borderWidth: 1,
        borderColor: '#333',
        gap: hp(2),
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: fontScale(14),
        color: '#fff',
        fontWeight: '600',
    },
    inputSubLabel: {
        fontSize: fontScale(10),
        color: '#666',
        marginTop: 2,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    counterBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#fff',
        minWidth: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#000',
        borderRadius: moderateScale(10),
        padding: moderateScale(12),
        color: '#fff',
        fontSize: fontScale(14),
        borderWidth: 1,
        borderColor: '#333',
    },
    // Coupon Section
    couponContainer: {
        flexDirection: 'row',
        gap: wp(2),
        minHeight: hp(6),
    },
    couponInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: wp(3),
    },
    couponIcon: {
        marginRight: wp(2),
    },
    couponInput: {
        flex: 1,
        color: '#fff',
        fontSize: fontScale(14),
        paddingVertical: hp(1.5),
    },
    applyBtn: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        borderWidth: 1,
        borderColor: colors.primary,
    },
    applyBtnText: {
        color: colors.primary,
        fontSize: fontScale(12),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    couponAppliedWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(204, 255, 0, 0.1)', // Light primary tint
        borderRadius: moderateScale(12),
        padding: moderateScale(12),
        borderWidth: 1,
        borderColor: colors.primary,
        justifyContent: 'space-between'
    },
    couponAppliedCode: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: fontScale(14),
        marginBottom: 2
    },
    couponAppliedMsg: {
        color: '#ccc',
        fontSize: fontScale(12)
    },
    // Order Card
    orderCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: moderateScale(16),
        borderWidth: 1,
        borderColor: '#333',
    },
    venueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    venueIcon: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(8),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    venueInfo: {
        flex: 1,
    },
    venueName: {
        fontSize: fontScale(14),
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    venueDetails: {
        fontSize: fontScale(12),
        color: '#999',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: hp(1.5),
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(0.5),
    },
    costLabel: {
        fontSize: fontScale(13),
        color: '#999',
    },
    costValue: {
        fontSize: fontScale(13),
        color: '#ccc',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#fff',
    },
    totalValue: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: colors.primary, // Green
    },
    // Payment Area
    paymentOptionsContainer: {
        gap: hp(1.5),
        marginBottom: hp(3),
    },
    optionCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionCardSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(204, 255, 0, 0.05)',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: fontScale(14),
        color: '#fff',
        fontWeight: '500',
    },
    optionSubText: {
        fontSize: fontScale(11),
        color: '#888',
        marginTop: 2,
    },
    paymentCard: {
        borderRadius: moderateScale(16),
        padding: moderateScale(20),
        height: hp(22),
        justifyContent: 'space-between',
        marginBottom: hp(1.5),
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardBrand: {
        fontSize: fontScale(16),
        fontWeight: '900',
        color: '#fff',
        fontStyle: 'italic',
    },
    cardNum: {
        fontSize: fontScale(18),
        color: '#fff',
        letterSpacing: 2,
        marginTop: hp(2),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardHolder: {
        fontSize: fontScale(10),
        color: '#999',
        textTransform: 'uppercase',
    },
    cardExpiry: {
        fontSize: fontScale(10),
        color: '#999',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: wp(5),
        paddingBottom: hp(4),
        backgroundColor: '#000',
    },
    payButton: {
        backgroundColor: '#1C1C1E',
        height: hp(7),
        borderRadius: moderateScale(100),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(2),
        borderWidth: 1,
        borderColor: colors.primary, // Green border
    },
    payIconContainer: {
        width: hp(6),
        height: hp(6),
        borderRadius: hp(3),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    payButtonText: {
        flex: 1,
        textAlign: 'center',
        color: '#fff',
        fontSize: fontScale(14),
        fontWeight: '700',
        letterSpacing: 1,
        marginRight: hp(6),
    },
    // Slide Button Styles
    slideButtonContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(100),
        alignSelf: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
        position: 'relative',
    },
    slideText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        color: '#fff',
        backgroundColor: 'transparent',
        fontSize: fontScale(14),
        fontWeight: '800',
        letterSpacing: 2,
        zIndex: 1,
    },
    slideHandle: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: moderateScale(100),
        position: 'absolute',
        zIndex: 2,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
        padding: wp(5),
        maxHeight: hp(60),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    modalTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#fff',
    },
    modalCouponItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalCouponCode: {
        color: '#fff',
        fontWeight: '700',
        fontSize: fontScale(14),
    },
    modalCouponDesc: {
        color: '#999',
        fontSize: fontScale(12),
        marginTop: 2,
    },
    modalCouponValue: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: fontScale(14),
    },
});

export default BookingDetailsScreen;
