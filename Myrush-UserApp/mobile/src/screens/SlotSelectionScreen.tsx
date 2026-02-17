import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    SafeAreaView, // Keep for layout wrapper if needed, but insets are better
    Image,
    Platform,
    Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

    // Get current date
    const today = new Date();

    // States
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSlots, setSelectedSlots] = useState<Array<{
        time: string;
        display_time: string;
        price: number;
    }>>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<Array<{
        time: string;
        display_time: string;
        price: number;
        available: boolean;
    }>>([]);

    // Data from params
    const venueName = route.params?.venue?.court_name || route.params?.venue?.name || 'Play Arena HSR';
    const venueLocation = route.params?.venue?.location || 'Bengaluru';
    const venueId = route.params?.venue?.id || '';
    const pitchName = 'Pitch 1 - Football';

    const monthNames = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Check if a date is in the past
    const isPastDate = (day: number, month: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(month.getFullYear(), month.getMonth(), day);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate < today;
    };

    // Helper to check if a specific time slot is in the past (for Today)
    const isTimeSlotPast = (timeStr: string) => {
        const now = new Date();
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);

        // Reset checkDate to start of day for accurate day comparison
        const checkDateStart = new Date(checkDate);
        checkDateStart.setHours(0, 0, 0, 0);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        if (checkDateStart.getTime() !== todayStart.getTime()) {
            return false; // Not today, so time is not past (unless past date, handled by isPastDate)
        }

        const [hours, minutes] = timeStr.split(':').map(Number);

        // Create a date object for the slot time today
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);

        // Add a buffer? User said disable "completed" time. 
        // Let's strict check: if slot start time < current time.
        return slotTime < now;
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        // Only generate valid days for this month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isPast = isPastDate(i, currentMonth);

            // Only add current/future days
            if (!isPast) {
                days.push({
                    day: i,
                    weekDay: weekDays[date.getDay()],
                    isPast,
                    fullDate: date
                });
            }
        }
        return days;
    };

    // Check availability logic
    useEffect(() => {
        if (venueId) {
            // Clear selected slots when date changes (Issue #3 fix)
            setSelectedSlots([]);
            fetchAvailableSlots();
        }
    }, [selectedDate, currentMonth]);

    const fetchAvailableSlots = async () => {
        setIsLoadingSlots(true);
        try {
            const year = currentMonth.getFullYear();
            const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
            const day = selectedDate.toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            console.log('[SLOT SELECTION] Fetching slots for:', dateStr);
            const response = await venuesApi.getAvailableSlots(venueId, dateStr);

            if (response.success && response.data) {
                setAvailableSlots(response.data.slots);
            } else {
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('[SLOT SELECTION] Error:', error);
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    // Group available slots
    const morningSlots = availableSlots.filter(s => {
        const hour = parseInt(s.time.split(':')[0]);
        return hour < 16;
    });

    const eveningSlots = availableSlots.filter(s => {
        const hour = parseInt(s.time.split(':')[0]);
        return hour >= 16;
    });


    const handleConfirmBooking = () => {
        if (selectedSlots.length === 0) {
            Alert.alert('Select Slot', 'Please select at least one time slot to proceed.');
            return;
        }

        const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);

        navigation.navigate('BookingDetails', {
            venue: venueName,
            venueObject: route.params?.venue,
            pitch: pitchName,
            date: selectedDate,
            month: monthNames[currentMonth.getMonth()],
            monthIndex: currentMonth.getMonth(),
            year: currentMonth.getFullYear(),
            selectedSlots: selectedSlots,
            totalPrice: totalPrice,
        });
    };

    const toggleSlotSelection = (slot: any) => {
        // Double check past time constraint
        if (isTimeSlotPast(slot.time)) {
            Alert.alert('Slot Unavailable', 'This time slot has already passed.');
            return;
        }

        const isSelected = selectedSlots.some(s => s.display_time === slot.display_time);
        if (isSelected) {
            setSelectedSlots(prev => prev.filter(s => s.display_time !== slot.display_time));
        } else {
            if (selectedSlots.length >= 4) {
                Alert.alert('Limit Reached', 'You can only select up to 4 slots per booking.');
                return;
            }
            setSelectedSlots(prev => [...prev, slot]);
        }
    };

    const calendarData = generateCalendarDays();

    // Helper to render slot
    const renderSlot = (slot: any, index: number, prefix: string) => {
        const isSelected = selectedSlots.some(s => s.display_time === slot.display_time);
        const isPast = isTimeSlotPast(slot.time);

        return (
            <TouchableOpacity
                key={`${prefix}-${index}`}
                disabled={isPast}
                style={[
                    styles.slotChip,
                    isSelected && styles.slotChipSelected,
                    isPast && styles.slotChipDisabled // Style for disabled
                ]}
                onPress={() => toggleSlotSelection(slot)}
            >
                <Text style={[
                    styles.slotTime,
                    isSelected && styles.slotTimeSelected,
                    isPast && styles.slotTimeDisabled
                ]} numberOfLines={1} adjustsFontSizeToFit>{slot.display_time}</Text>
                {
                    isSelected && (
                        <View style={styles.slotDot} />
                    )
                }
            </TouchableOpacity >
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + hp(1) : insets.top + hp(1) }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Select Slot</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                        {venueName} • {venueLocation.split(',')[0]}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(15) + insets.bottom }]}>

                {/* Month Navigation */}
                <View style={styles.monthHeader}>
                    <Text style={styles.monthText}>
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </Text>
                    <View style={styles.monthControls}>
                        <TouchableOpacity
                            onPress={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setMonth(newDate.getMonth() - 1);
                                if (newDate >= new Date(new Date().setDate(1))) {
                                    setCurrentMonth(newDate);
                                }
                            }}
                            style={styles.monthIcon}
                        >
                            <Ionicons name="chevron-back" size={moderateScale(20)} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setMonth(newDate.getMonth() + 1);
                                setCurrentMonth(newDate);
                            }}
                            style={styles.monthIcon}
                        >
                            <Ionicons name="chevron-forward" size={moderateScale(20)} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Horizontal Date Picker */}
                <View style={styles.datePickerContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.datesScroll}
                        contentContainerStyle={styles.datesScrollContent}
                        decelerationRate="fast"
                        overScrollMode="never"
                    >
                        {calendarData.map((item, index) => {
                            const isSelected = selectedDate === item.day;
                            const isDisabled = item.isPast;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.7}
                                    disabled={isDisabled}
                                    onPress={() => setSelectedDate(item.day)}
                                    style={[
                                        styles.dateCard,
                                        isSelected && styles.dateCardSelected,
                                        isDisabled && styles.dateCardDisabled
                                    ]}
                                >
                                    <Text style={[
                                        styles.dayNameText,
                                        isSelected && styles.dayNameTextSelected,
                                        isDisabled && styles.textDisabled
                                    ]}>
                                        {item.weekDay}
                                    </Text>
                                    <Text style={[
                                        styles.dateNumText,
                                        isSelected && styles.dateNumTextSelected,
                                        isDisabled && styles.textDisabled
                                    ]}>
                                        {item.day}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                {/* Slots Section */}
                {isLoadingSlots ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Fetching available slots...</Text>
                    </View>
                ) : availableSlots.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={moderateScale(48)} color="#333" />
                        <Text style={styles.emptyText}>No slots available for this date.</Text>
                    </View>
                ) : (
                    <>
                        {/* Morning Section */}
                        {morningSlots.length > 0 && (
                            <View style={styles.slotSection}>
                                <View style={styles.sectionHeader}>
                                    <Feather name="sun" size={moderateScale(18)} color="#999" />
                                    <Text style={styles.sectionTitle}>MORNING</Text>
                                </View>
                                <View style={styles.slotsGrid}>
                                    {morningSlots.map((slot, index) => renderSlot(slot, index, 'm'))}
                                </View>
                            </View>
                        )}

                        {/* Evening Section */}
                        {eveningSlots.length > 0 && (
                            <View style={styles.slotSection}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="moon-outline" size={moderateScale(18)} color="#999" />
                                    <Text style={styles.sectionTitle}>EVENING</Text>
                                </View>
                                <View style={styles.slotsGrid}>
                                    {eveningSlots.map((slot, index) => renderSlot(slot, index, 'e'))}
                                </View>
                            </View>
                        )}
                    </>
                )}

            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(hp(3), insets.bottom + 10) }]}>
                <View style={styles.priceInfo}>
                    <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                    <Text style={styles.totalAmount}>
                        ₹{selectedSlots.reduce((sum, slot) => sum + slot.price, 0)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.payButton}
                    onPress={handleConfirmBooking}
                    activeOpacity={0.8}
                >
                    <Text style={styles.payButtonText}>PAY NOW</Text>
                </TouchableOpacity>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingBottom: hp(2),
        backgroundColor: '#000'
    },
    backButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerInfo: {
        marginLeft: wp(2),
        flex: 1,
    },
    headerTitle: {
        fontSize: fontScale(22),
        fontWeight: '700',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: fontScale(13),
        color: '#666',
        marginTop: 2,
    },
    scrollContent: {
        // Padding bottom set inline
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        marginTop: hp(2),
        marginBottom: hp(2),
    },
    monthText: {
        fontSize: fontScale(16),
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    monthControls: {
        flexDirection: 'row',
        gap: wp(4),
    },
    monthIcon: {
        padding: 4,
    },
    datePickerContainer: {
        height: hp(12),
        marginBottom: hp(2),
    },
    datesScroll: {
        flexGrow: 0,
    },
    datesScrollContent: {
        paddingHorizontal: wp(5),
    },
    dateCard: {
        width: wp(16),
        height: hp(10), // Taller vertical card
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
        borderWidth: 1,
        borderColor: '#333',
    },
    dateCardSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dateCardDisabled: {
        opacity: 0.3,
    },
    dayNameText: {
        fontSize: fontScale(12),
        color: '#999',
        marginBottom: hp(0.5),
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dayNameTextSelected: {
        color: '#000',
        fontWeight: '700',
    },
    dateNumText: {
        fontSize: fontScale(18),
        color: '#fff',
        fontWeight: '700',
    },
    dateNumTextSelected: {
        color: '#000',
        fontWeight: '800',
    },
    textDisabled: {
        color: '#666',
    },
    loadingContainer: {
        marginTop: hp(5),
        alignItems: 'center',
    },
    loadingText: {
        color: '#666',
        marginTop: hp(2),
        fontSize: fontScale(14),
    },
    emptyContainer: {
        marginTop: hp(5),
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        marginTop: hp(2),
        fontSize: fontScale(14),
    },
    slotSection: {
        marginBottom: hp(4),
        paddingHorizontal: wp(5),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
        gap: wp(2),
    },
    sectionTitle: {
        fontSize: fontScale(14),
        fontWeight: '700',
        color: '#999',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(3), // Use gap for consistent spacing
    },
    slotChip: {
        width: (width - wp(10) - wp(6)) / 3, // 3 columns accurately
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        paddingVertical: hp(1.8),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
        position: 'relative',
        overflow: 'hidden',
    },
    slotChipSelected: {
        backgroundColor: '#1C1C1E', // Keep dark bg but green border
        borderColor: colors.primary,
        borderWidth: 2, // Thicker border
    },
    slotChipDisabled: {
        opacity: 0.3,
        borderColor: '#222',
        backgroundColor: '#111',
    },
    slotTime: {
        fontSize: fontScale(12),
        color: '#ccc',
        fontWeight: '600',
    },
    slotTimeSelected: {
        color: colors.primary,
        fontWeight: '700',
    },
    slotTimeDisabled: {
        color: '#555',
        textDecorationLine: 'line-through',
    },
    slotDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C1C1E',
        paddingHorizontal: wp(6),
        paddingTop: hp(2.5),
        // Padding bottom handled inline
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
    },
    priceInfo: {
        flex: 1,
    },
    totalLabel: {
        fontSize: fontScale(10),
        color: '#999',
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: fontScale(24),
        color: '#fff',
        fontWeight: '700',
    },
    payButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.8),
        borderRadius: moderateScale(30),
        minWidth: wp(40),
        alignItems: 'center',
    },
    payButtonText: {
        color: '#000',
        fontSize: fontScale(14),
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default SlotSelectionScreen;
