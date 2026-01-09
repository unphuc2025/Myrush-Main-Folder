import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    FlatList,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { bookingsApi } from '../api/venues';
import { useAuthStore } from '../store/authStore';
import { couponsApi } from '../api/venues';

type ReviewBookingRouteProp = RouteProp<RootStackParamList, 'ReviewBooking'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const ReviewBookingScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<ReviewBookingRouteProp>();
    const { user } = useAuthStore();
    const [cartItems, setCartItems] = useState(1);
    const [isBookingCreating, setIsBookingCreating] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponResult, setCouponResult] = useState<{
        valid: boolean;
        discount_percentage?: number;
        discount_amount?: number;
        final_amount?: number;
        message: string;
    } | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [showCouponDropdown, setShowCouponDropdown] = useState(false);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

    const { venue, date, month, timeSlot, selectedSlots, totalPrice, slotPrice, numPlayers, teamName, specialRequests, venueObject } = route.params || {};

    console.log('ReviewBooking - Slot selected!', slotPrice ? `₹${slotPrice}` : 'No price');

    // Get dynamic location from venue data
    const getVenueLocation = () => {
        if (!venueObject) return "Location not available";

        // Try different possible location fields
        const location = venueObject.location || venueObject.properties?.location ||
            venueObject.search_location || venueObject.description || "Location not available";
        return location;
    };

    // Calculate total cost: Use totalPrice from slot selection if available
    const calculateTotalCost = () => {
        // If we have selectedSlots and totalPrice from multi-slot selection
        if (selectedSlots && selectedSlots.length > 0 && totalPrice) {
            let total = totalPrice;

            // Apply coupon discount if valid
            if (couponResult?.valid && couponResult?.final_amount !== undefined) {
                total = Math.floor(couponResult.final_amount);
            }

            console.log('REVIEW BOOKING - Multi-slot Total:', {
                selectedSlotsCount: selectedSlots.length,
                totalPrice: totalPrice,
                couponResult: couponResult,
                finalTotal: total
            });

            return total;
        }

        // Fallback: Single slot calculation (slot price * number of players)
        const price = slotPrice ? Number(slotPrice) : 0;
        const players = numPlayers ? Number(numPlayers) : 2;
        let total = Math.floor(price * players);

        // Apply coupon discount if valid
        if (couponResult?.valid && couponResult?.final_amount !== undefined) {
            total = Math.floor(couponResult.final_amount);
        }

        console.log('REVIEW BOOKING - Single slot Total:', {
            inputSlotPrice: slotPrice,
            parsedSlotPrice: price,
            inputNumPlayers: numPlayers,
            parsedNumPlayers: players,
            couponResult: couponResult,
            calculatedTotal: total
        });

        return total;
    };

    // Generate player avatars
    const generatePlayerAvatars = () => {
        const totalPlayers = numPlayers || 2;
        const maxVisiblePlayers = 3;
        const visibleCount = Math.min(totalPlayers, maxVisiblePlayers);
        const remaining = totalPlayers - visibleCount;

        const players = [];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

        for (let i = 0; i < visibleCount; i++) {
            players.push({
                id: i,
                color: colors[i % colors.length],
                initial: String.fromCharCode(65 + i), // A, B, C...
            });
        }

        return { players, remaining };
    };

    const { players, remaining } = generatePlayerAvatars();

    // Load available coupons on component mount
    useEffect(() => {
        const loadAvailableCoupons = async () => {
            setIsLoadingCoupons(true);
            try {
                const result = await couponsApi.getAvailableCoupons();
                if (result.success && result.data) {
                    setAvailableCoupons(result.data);
                }
            } catch (error) {
                console.error('Failed to load available coupons:', error);
            } finally {
                setIsLoadingCoupons(false);
            }
        };

        loadAvailableCoupons();
    }, []);

    const handleSelectCoupon = (coupon: any) => {
        setCouponCode(coupon.code);
        setShowCouponDropdown(false);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            Alert.alert('Invalid Coupon', 'Please enter a coupon code');
            return;
        }

        setIsValidatingCoupon(true);
        try {
            const originalTotal = calculateOriginalTotal();
            const result = await couponsApi.validateCoupon(couponCode.trim(), originalTotal);

            if (result.success && result.data) {
                setCouponResult(result.data);
                if (!result.data.valid) {
                    Alert.alert('Invalid Coupon', result.data.message);
                } else {
                    // Success - coupon applied
                    Alert.alert('Success', `Coupon applied! ${(result.data as any).discount_percentage || 0}% discount.`);
                }
            } else {
                setCouponResult({ valid: false, message: 'Failed to validate coupon' });
                Alert.alert('Error', 'Failed to validate coupon. Please try again.');
            }
        } catch (error) {
            setCouponResult({ valid: false, message: 'Failed to validate coupon' });
            Alert.alert('Error', 'Failed to validate coupon. Please try again.');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const calculateOriginalTotal = () => {
        // If we have selectedSlots with totalPrice, use that
        if (selectedSlots && selectedSlots.length > 0 && totalPrice) {
            return totalPrice;
        }

        // Fallback: Single slot calculation
        const price = slotPrice ? Number(slotPrice) : 0;
        const players = numPlayers ? Number(numPlayers) : 2;
        return Math.floor(price * players);
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setCouponResult(null);
    };

    const handleConfirmBooking = async () => {
        if (isBookingCreating) return;

        setIsBookingCreating(true);

        try {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            // Extract booking data from route params
            const venueData = venueObject || {};

            // Extract venue ID with better error handling
            const venueId = venueData.id || venueData.venue_id;

            if (!venueId) {
                console.error('❌ Missing venue ID in venueObject:', venueData);
                Alert.alert(
                    'Booking Error',
                    'Venue information is missing. Please go back and select the venue again.',
                    [{ text: 'OK' }]
                );
                setIsBookingCreating(false);
                return;
            }

            // Calculate financials
            const originalTotal = calculateOriginalTotal();
            const discountVal = (couponResult?.valid && couponResult.discount_amount) ? Number(couponResult.discount_amount) : 0;
            // Ensure we don't assume price per hour is the only cost model, use calculated totals

            // Prepare Time Slots
            let formattedSlots: any[] = [];
            let totalDuration = 60;
            let startBookingTime = timeSlot?.split(' - ')[0] || '10:00';

            if (selectedSlots && selectedSlots.length > 0) {
                formattedSlots = selectedSlots;
                totalDuration = selectedSlots.length * 60;
                // Use first slot time for legacy start_time
                if (selectedSlots[0].time) {
                    startBookingTime = selectedSlots[0].time;
                }
            } else {
                // Single slot fallback
                formattedSlots = [{
                    time: startBookingTime,
                    price: slotPrice ? Number(slotPrice) : 200,
                    display_time: timeSlot
                }];
            }

            const bookingData = {
                userId: user.id,
                courtId: venueId,
                bookingDate: `${route.params?.year || new Date().getFullYear()}-${String((route.params?.monthIndex || new Date().getMonth()) + 1).padStart(2, '0')}-${String(date)?.padStart(2, '0')}`,
                startTime: startBookingTime,
                durationMinutes: totalDuration,
                numberOfPlayers: numPlayers || 2,
                pricePerHour: slotPrice ? Number(slotPrice) : 200, // Legacy field
                originalPricePerHour: slotPrice ? Number(slotPrice) : 200,
                teamName: teamName,
                specialRequests: specialRequests,

                // Multi-slot fields
                timeSlots: formattedSlots,
                originalAmount: originalTotal,
                discountAmount: discountVal,
                couponCode: couponResult?.valid ? couponCode : undefined,
                totalAmount: originalTotal - discountVal
            };

            console.log('Creating booking with data:', bookingData);

            // Call the API to create booking
            const result = await bookingsApi.createBooking(bookingData);

            if (result.success) {
                Alert.alert(
                    '🎉 Booking Confirmed!',
                    `Your booking has been successfully created!\n\n💰 Total Amount: ₹${calculateTotalCost()}\n⏰ ${timeSlot}\n📅 ${route.params?.date}/${route.params?.month?.substring(0, 3)}/${route.params?.year}`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Reset navigation stack to MainTabs (home screen)
                                navigation.dispatch(
                                    CommonActions.reset({
                                        index: 0,
                                        routes: [{ name: 'MainTabs' }],
                                    })
                                );
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Booking Failed',
                    result.error || 'Unable to create booking. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            Alert.alert(
                'Booking Failed',
                'An unexpected error occurred. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsBookingCreating(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Your Booking</Text>
                <View style={{ width: wp(10) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Location Card */}
                <View style={styles.reviewCard}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                        <Ionicons name="location" size={moderateScale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{venue}</Text>
                        <Text style={styles.cardSubtitle}>{getVenueLocation()}</Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Date & Time Card */}
                <View style={styles.reviewCard}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                        <Ionicons name="calendar" size={moderateScale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Wednesday, {date}th {month}</Text>
                        {selectedSlots && selectedSlots.length > 0 ? (
                            <View>
                                {selectedSlots.map((slot, index) => (
                                    <Text key={index} style={styles.cardSubtitle}>
                                        {slot.display_time} - ₹{slot.price}
                                    </Text>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.cardSubtitle}>{timeSlot}</Text>
                        )}
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Players Card */}
                <View style={styles.reviewCard}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                        <Ionicons name="person" size={moderateScale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Players</Text>
                        <View style={styles.playersAvatarRow}>
                            {players.map((player, index) => (
                                <View
                                    key={player.id}
                                    style={[
                                        styles.playerAvatar,
                                        { backgroundColor: index === 0 ? colors.primary : colors.accent },
                                        index > 0 && { marginLeft: -wp(3) },
                                    ]}
                                >
                                    <Text style={styles.playerAvatarText}>{player.initial}</Text>
                                </View>
                            ))}
                            {remaining > 0 && (
                                <View
                                    style={[
                                        styles.playerAvatar,
                                        { backgroundColor: colors.gray[400], marginLeft: -wp(3) },
                                    ]}
                                >
                                    <Text style={[styles.playerAvatarText, { color: colors.white }]}>
                                        +{remaining}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Team Name Card (if provided) */}
                {teamName ? (
                    <View style={styles.reviewCard}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                            <Ionicons name="shield" size={moderateScale(24)} color={colors.primary} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Team Name</Text>
                            <Text style={styles.cardSubtitle}>{teamName}</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Special Requests Card (if provided) */}
                {specialRequests ? (
                    <View style={styles.reviewCard}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                            <Ionicons name="chatbox-ellipses" size={moderateScale(24)} color={colors.primary} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Special Requests</Text>
                            <Text style={styles.cardSubtitle}>{specialRequests}</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Coupon Card */}
                <View style={styles.reviewCard}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.brand.light }]}>
                        <Ionicons name="pricetag" size={moderateScale(24)} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Have a Coupon?</Text>
                        {couponResult?.valid && 'discount_percentage' in couponResult ? (
                            <View>
                                <Text style={[styles.cardSubtitle, { color: colors.success }]}>
                                    ✓ {couponResult.discount_percentage}% off applied
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: colors.success }]}>
                                    Save ₹{couponResult.discount_amount}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.cardSubtitle}>Enter coupon code to get discount</Text>
                        )}
                    </View>
                    {couponResult?.valid ? (
                        <TouchableOpacity onPress={handleRemoveCoupon}>
                            <Ionicons name="close" size={moderateScale(20)} color={colors.error} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleApplyCoupon} disabled={isValidatingCoupon}>
                            {isValidatingCoupon ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="checkmark" size={moderateScale(20)} color={colors.accent} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Coupon Input Row */}
                {!couponResult?.valid && (
                    <View>
                        {/* Coupon Input Container */}
                        <View style={styles.couponInputContainer}>
                            <TextInput
                                style={styles.couponInput}
                                placeholder="Enter coupon code or select from dropdown"
                                value={couponCode}
                                onChangeText={setCouponCode}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                maxLength={20}
                            />
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setShowCouponDropdown(true)}
                            >
                                <Ionicons name="chevron-down" size={moderateScale(16)} color={colors.text.secondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.applyButtonSmall, (!couponCode.trim() || isValidatingCoupon) && styles.applyButtonDisabled]}
                                onPress={handleApplyCoupon}
                                disabled={!couponCode.trim() || isValidatingCoupon}
                            >
                                {isValidatingCoupon ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Ionicons name="checkmark" size={moderateScale(16)} color={colors.white} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Available Coupons List */}
                        {availableCoupons.length > 0 && (
                            <View style={styles.availableCouponsContainer}>
                                <Text style={styles.availableCouponsTitle}>Available Coupons:</Text>
                                <View style={styles.availableCouponsList}>
                                    {availableCoupons.slice(0, 3).map((coupon) => (
                                        <TouchableOpacity
                                            key={coupon.code}
                                            style={styles.couponOption}
                                            onPress={() => handleSelectCoupon(coupon)}
                                        >
                                            <View style={styles.couponOptionLeft}>
                                                <Text style={styles.couponCodeText}>{coupon.code}</Text>
                                                {coupon.description && (
                                                    <Text style={styles.couponDescriptionText} numberOfLines={1}>
                                                        {coupon.description}
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={styles.couponDiscountText}>
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}% off`
                                                    : `₹${coupon.discount_value} off`}
                                                {coupon.min_order_value && (
                                                    <Text style={styles.couponMinOrderText}>
                                                        {"\n"}Min ₹{coupon.min_order_value}
                                                    </Text>
                                                )}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                    {availableCoupons.length > 3 && (
                                        <TouchableOpacity
                                            style={styles.seeMoreButton}
                                            onPress={() => setShowCouponDropdown(true)}
                                        >
                                            <Text style={styles.seeMoreText}>
                                                See {availableCoupons.length - 3} more coupons
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Full Coupon Dropdown Modal */}
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
                                <TouchableOpacity
                                    onPress={() => setShowCouponDropdown(false)}
                                    style={styles.closeModalButton}
                                >
                                    <Ionicons name="close" size={moderateScale(24)} color={colors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={availableCoupons}
                                keyExtractor={(item) => item.code}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item: coupon }) => (
                                    <TouchableOpacity
                                        style={styles.modalCouponOption}
                                        onPress={() => handleSelectCoupon(coupon)}
                                    >
                                        <View style={styles.modalCouponLeft}>
                                            <Text style={styles.modalCouponCode}>{coupon.code}</Text>
                                            {coupon.description && (
                                                <Text style={styles.modalCouponDescription} numberOfLines={2}>
                                                    {coupon.description}
                                                </Text>
                                            )}
                                            {coupon.min_order_value && (
                                                <Text style={styles.modalCouponMinOrder}>
                                                    Minimum order: ₹{coupon.min_order_value}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.modalCouponRight}>
                                            <Text style={styles.modalCouponDiscount}>
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}% off`
                                                    : `₹${coupon.discount_value} off`}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyCoupons}>
                                        <Ionicons name="pricetag-outline" size={moderateScale(48)} color={colors.text.secondary} />
                                        <Text style={styles.emptyCouponsText}>No coupons available</Text>
                                    </View>
                                }
                            />
                        </View>
                    </View>
                </Modal>

                {/* Spacer */}
                <View style={{ height: hp(15) }} />
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <View style={styles.totalCostContainer}>
                    <Text style={styles.totalCostLabel}>Total Cost</Text>
                    <Text style={styles.totalCostAmount}>₹{calculateTotalCost()}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmButton, isBookingCreating && styles.confirmButtonDisabled]}
                    onPress={handleConfirmBooking}
                    disabled={isBookingCreating}
                >
                    {isBookingCreating ? (
                        <>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={styles.confirmButtonText}>Creating Booking...</Text>
                        </>
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Floating Cart Button */}
            {cartItems > 0 && (
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart" size={moderateScale(24)} color={colors.white} />
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartItems}</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(6),
        paddingBottom: hp(2),
        backgroundColor: colors.background.primary,
    },
    backButton: {
        width: wp(10),
        height: wp(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.text.primary,
    },
    scrollContent: {
        padding: wp(5),
    },
    reviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(16),
        padding: wp(4),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: wp(13),
        height: wp(13),
        borderRadius: wp(6.5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
    },
    editText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.accent,
    },
    playersAvatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerAvatar: {
        width: wp(9),
        height: wp(9),
        borderRadius: wp(4.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background.primary,
    },
    playerAvatarText: {
        fontSize: fontScale(12),
        fontWeight: '700',
        color: colors.white,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background.primary,
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        paddingBottom: hp(3),
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    totalCostContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    totalCostLabel: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
    },
    totalCostAmount: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: colors.text.primary,
    },
    confirmButton: {
        backgroundColor: colors.primary,
        paddingVertical: hp(2),
        borderRadius: moderateScale(25),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonDisabled: {
        backgroundColor: colors.gray[400],
        shadowColor: colors.gray[400],
        shadowOpacity: 0.2,
    },
    confirmButtonText: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.white,
    },
    cartButton: {
        position: 'absolute',
        bottom: hp(16),
        right: wp(5),
        width: wp(15),
        height: wp(15),
        borderRadius: wp(7.5),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cartBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.error,
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: fontScale(10),
        fontWeight: '700',
        color: colors.white,
    },
    couponInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(16),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    couponInput: {
        flex: 1,
        fontSize: fontScale(14),
        color: colors.text.primary,
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        backgroundColor: colors.background.secondary,
        borderRadius: moderateScale(8),
        marginRight: wp(3),
    },
    applyButton: {
        backgroundColor: colors.accent,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: moderateScale(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonDisabled: {
        backgroundColor: colors.gray[400],
        opacity: 0.5,
    },
    applyButtonText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.white,
    },
    dropdownButton: {
        paddingHorizontal: wp(2),
        paddingVertical: hp(1),
        backgroundColor: colors.gray[200],
        borderRadius: moderateScale(6),
        marginRight: wp(2),
    },
    applyButtonSmall: {
        backgroundColor: colors.primary,
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: moderateScale(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    availableCouponsContainer: {
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(16),
        padding: wp(4),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    availableCouponsTitle: {
        fontSize: fontScale(14),
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: hp(1.5),
    },
    availableCouponsList: {
        gap: hp(1),
    },
    couponOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray[50],
        borderRadius: moderateScale(12),
        padding: wp(3),
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    couponOptionLeft: {
        flex: 1,
    },
    couponCodeText: {
        fontSize: fontScale(14),
        fontWeight: '700',
        color: colors.primary,
        marginBottom: hp(0.5),
    },
    couponDescriptionText: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
    },
    couponDiscountText: {
        fontSize: fontScale(14),
        fontWeight: '700',
        color: colors.success,
        textAlign: 'right',
    },
    couponMinOrderText: {
        fontSize: fontScale(11),
        color: colors.text.tertiary,
        textAlign: 'right',
    },
    seeMoreButton: {
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(3),
        backgroundColor: colors.brand.light,
        borderRadius: moderateScale(8),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    seeMoreText: {
        fontSize: fontScale(12),
        fontWeight: '600',
        color: colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        maxHeight: hp(70),
        minHeight: hp(40),
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: wp(5),
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    modalTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: colors.text.primary,
    },
    closeModalButton: {
        padding: wp(1),
    },
    modalCouponOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(4),
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    modalCouponLeft: {
        flex: 1,
    },
    modalCouponCode: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.primary,
        marginBottom: hp(0.5),
    },
    modalCouponDescription: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        marginBottom: hp(0.5),
    },
    modalCouponMinOrder: {
        fontSize: fontScale(12),
        color: colors.text.tertiary,
        fontStyle: 'italic',
    },
    modalCouponRight: {
        alignItems: 'flex-end',
    },
    modalCouponDiscount: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.success,
    },
    emptyCoupons: {
        alignItems: 'center',
        padding: wp(10),
    },
    emptyCouponsText: {
        fontSize: fontScale(16),
        color: colors.text.secondary,
        marginTop: hp(2),
        textAlign: 'center',
    },
});

export default ReviewBookingScreen;
