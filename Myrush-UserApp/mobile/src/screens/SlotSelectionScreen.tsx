import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { venuesApi } from '../api/venues';

const { width } = Dimensions.get('window');

type SlotSelectionRouteProp = RouteProp<RootStackParamList, 'SlotSelection'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const SlotSelectionScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<SlotSelectionRouteProp>();

    // Get current date
    const today = new Date();
    const currentDay = today.getDate();

    const [selectedDate, setSelectedDate] = useState(currentDay);
    const [selectedSlots, setSelectedSlots] = useState<Array<{
        time: string;
        display_time: string;
        price: number;
    }>>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Current month
    const [cartItems, setCartItems] = useState(1);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<Array<{
        time: string;
        display_time: string;
        price: number;
        available: boolean;
    }>>([]);

    const venueName = route.params?.venue?.court_name || route.params?.venue?.name || 'Play Arena HSR';
    const venueId = route.params?.venue?.id || '';
    const pitchName = 'Pitch 1';

    // Check if a date is in the past
    const isPastDate = (day: number, month: Date, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return true; // Previous/next month dates are always disabled

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

        const checkDate = new Date(month.getFullYear(), month.getMonth(), day);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate < today;
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month days (always disabled)
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                isPast: true
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const isPast = isPastDate(i, currentMonth, true);
            days.push({
                day: i,
                isCurrentMonth: true,
                isPast
            });
        }

        return days;
    };

    // Check if we can navigate to previous month
    const canNavigateToPreviousMonth = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthIndex = today.getMonth();

        const displayYear = currentMonth.getFullYear();
        const displayMonthIndex = currentMonth.getMonth();

        // Can't go before current month
        if (displayYear < currentYear) return false;
        if (displayYear === currentYear && displayMonthIndex <= currentMonthIndex) return false;

        return true;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Fetch available slots when date changes
    useEffect(() => {
        if (venueId && selectedDate) {
            fetchAvailableSlots();
        }
    }, [selectedDate, currentMonth]);

    const fetchAvailableSlots = async () => {
        setIsLoadingSlots(true);
        try {
            // Format date as YYYY-MM-DD
            const year = currentMonth.getFullYear();
            const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
            const day = selectedDate.toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            console.log('[SLOT SELECTION] Fetching slots for:', dateStr);
            const response = await venuesApi.getAvailableSlots(venueId, dateStr);

            if (response.success && response.data) {
                setAvailableSlots(response.data.slots);
                console.log('[SLOT SELECTION] Loaded', response.data.slots.length, 'slots');
            } else {
                console.error('[SLOT SELECTION] Failed to fetch slots:', response.error);
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('[SLOT SELECTION] Error:', error);
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleConfirmBooking = () => {
        if (selectedSlots.length === 0) {
            alert('Please select at least one time slot');
            return;
        }

        const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);

        console.log('Navigating to ReviewBooking with:', {
            selectedSlots,
            totalPrice,
            venueName,
            date: selectedDate
        });

        navigation.navigate('BookingDetails', {
            venue: venueName,
            venueObject: route.params?.venue,
            pitch: pitchName,
            date: selectedDate,
            month: monthNames[currentMonth.getMonth()],
            monthIndex: currentMonth.getMonth(),
            year: currentMonth.getFullYear(),
            selectedSlots: selectedSlots, // Pass array of slots
            totalPrice: totalPrice,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{venueName}</Text>
                    <Text style={styles.headerSubtitle}>{pitchName}</Text>
                </View>
                <View style={{ width: wp(10) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Calendar */}
                <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                if (canNavigateToPreviousMonth()) {
                                    const newDate = new Date(currentMonth);
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    setCurrentMonth(newDate);
                                }
                            }}
                            disabled={!canNavigateToPreviousMonth()}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={moderateScale(24)}
                                color={canNavigateToPreviousMonth() ? "#333" : "#ccc"}
                            />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setMonth(newDate.getMonth() + 1);
                                setCurrentMonth(newDate);
                            }}
                        >
                            <Ionicons name="chevron-forward" size={moderateScale(24)} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Week Days */}
                    <View style={styles.weekDaysRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                            <Text key={index} style={styles.weekDayText}>{day}</Text>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {generateCalendarDays().map((item, index) => {
                            const isDisabled = !item.isCurrentMonth || item.isPast;
                            const isSelected = selectedDate === item.day && item.isCurrentMonth && !item.isPast;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        isDisabled && styles.dayCellInactive,
                                        isSelected && styles.dayCellSelected,
                                    ]}
                                    onPress={() => {
                                        if (!isDisabled) {
                                            setSelectedDate(item.day);
                                        }
                                    }}
                                    disabled={isDisabled}
                                >
                                    <Text
                                        style={[
                                            styles.dayText,
                                            isDisabled && styles.dayTextInactive,
                                            isSelected && styles.dayTextSelected,
                                        ]}
                                    >
                                        {item.day}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Available Slots */}
                <View style={styles.slotsContainer}>
                    <Text style={styles.slotsTitle}>
                        Available Slots for {monthNames[currentMonth.getMonth()]} {selectedDate}
                    </Text>
                    {isLoadingSlots ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Loading available slots...</Text>
                        </View>
                    ) : availableSlots.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={moderateScale(40)} color="#ccc" />
                            <Text style={styles.emptyText}>No available slots for this date</Text>
                        </View>
                    ) : (
                        <View style={styles.slotsGrid}>
                            {availableSlots.map((slot, index) => {
                                const isSelected = selectedSlots.some(
                                    s => s.display_time === slot.display_time
                                );

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.slotButton,
                                            isSelected && styles.slotButtonSelected,
                                        ]}
                                        onPress={() => {
                                            if (isSelected) {
                                                // Remove from selection
                                                setSelectedSlots(prev =>
                                                    prev.filter(s => s.display_time !== slot.display_time)
                                                );
                                                console.log('Deselected slot:', slot.display_time);
                                            } else {
                                                // Add to selection
                                                setSelectedSlots(prev => [...prev, slot]);
                                                console.log('Selected slot:', slot.display_time, 'Price:', slot.price);
                                            }
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.slotText,
                                                isSelected && styles.slotTextSelected,
                                            ]}
                                        >
                                            {slot.display_time}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.slotPrice,
                                                isSelected && styles.slotPriceSelected,
                                            ]}
                                        >
                                            ₹{slot.price}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={moderateScale(18)}
                                                color="#fff"
                                                style={styles.checkmark}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Spacer */}
                <View style={{ height: hp(15) }} />
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <View style={styles.totalPriceContainer}>
                    <Text style={styles.totalPriceLabel}>Total Price</Text>
                    <Text style={styles.totalPriceAmount}>
                        ₹{selectedSlots.reduce((sum, slot) => sum + slot.price, 0)}
                    </Text>
                </View>
                {selectedSlots.length > 0 && (
                    <Text style={styles.selectedSlotsCount}>
                        {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                    </Text>
                )}
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmBooking}
                >
                    <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                </TouchableOpacity>
            </View>

            {/* Floating Cart Button */}
            {cartItems > 0 && (
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart" size={moderateScale(24)} color="#fff" />
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
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(6),
        paddingBottom: hp(2),
        backgroundColor: '#fff',
    },
    backButton: {
        width: wp(10),
        height: wp(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: fontScale(13),
        color: '#999',
        marginTop: 2,
    },
    calendarContainer: {
        backgroundColor: '#fff',
        margin: wp(5),
        marginTop: hp(2),
        borderRadius: moderateScale(20),
        padding: wp(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(3),
    },
    monthText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#333',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: hp(2),
    },
    weekDayText: {
        fontSize: fontScale(13),
        color: '#999',
        fontWeight: '500',
        width: width / 9,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: width / 9,
        height: hp(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: hp(0.5),
    },
    dayCellInactive: {
        opacity: 0.3,
    },
    dayCellSelected: {
        backgroundColor: colors.primary,
        borderRadius: moderateScale(20),
    },
    dayText: {
        fontSize: fontScale(14),
        color: '#333',
    },
    dayTextInactive: {
        color: '#ccc',
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    slotsContainer: {
        paddingHorizontal: wp(5),
        marginTop: hp(1),
    },
    slotsTitle: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(2),
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    slotButton: {
        width: '31%',
        backgroundColor: '#fff',
        borderRadius: moderateScale(12),
        paddingVertical: hp(2.5),
        marginBottom: hp(1.5),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minHeight: hp(8),
    },
    slotButtonSelected: {
        backgroundColor: colors.primary,
    },
    slotText: {
        fontSize: fontScale(13),
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    slotTextSelected: {
        color: '#fff',
    },
    slotPrice: {
        fontSize: fontScale(11),
        fontWeight: '500',
        color: '#666',
        marginTop: hp(0.5),
        textAlign: 'center',
    },
    slotPriceSelected: {
        color: '#fff',
    },
    loadingContainer: {
        paddingVertical: hp(4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: hp(1),
        fontSize: fontScale(13),
        color: '#666',
    },
    emptyContainer: {
        paddingVertical: hp(4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: hp(1),
        fontSize: fontScale(13),
        color: '#999',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        paddingBottom: hp(3),
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    totalPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    totalPriceLabel: {
        fontSize: fontScale(14),
        color: '#999',
    },
    totalPriceAmount: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#333',
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
    confirmButtonText: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#fff',
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
        backgroundColor: '#FF4757',
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: fontScale(10),
        fontWeight: '700',
        color: '#fff',
    },
    checkmark: {
        position: 'absolute',
        top: hp(0.5),
        right: wp(1),
    },
    selectedSlotsCount: {
        fontSize: fontScale(12),
        color: '#666',
        textAlign: 'center',
        marginBottom: hp(1),
    },
});

export default SlotSelectionScreen;
