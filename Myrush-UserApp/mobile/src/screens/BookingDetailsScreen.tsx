import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

type BookingDetailsRouteProp = RouteProp<RootStackParamList, 'BookingDetails'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const BookingDetailsScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<BookingDetailsRouteProp>();
    const [numPlayers, setNumPlayers] = useState(2);
    const [teamName, setTeamName] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [cartItems, setCartItems] = useState(1);

    const { venue, date, month, timeSlot, venueObject, year, monthIndex, slotPrice } = route.params || {};

    const handleIncrement = () => {
        setNumPlayers(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (numPlayers > 1) {
            setNumPlayers(prev => prev - 1);
        }
    };

    const handleConfirmBooking = () => {
        navigation.navigate('ReviewBooking', {
            venue,
            date,
            month,
            timeSlot,
            slotPrice,
            numPlayers,
            teamName,
            specialRequests,
            venueObject,
            year,
            monthIndex,
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
                    <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={{ width: wp(10) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Venue Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/dashboard-hero.png')}
                        style={styles.venueImage}
                        resizeMode="cover"
                    />
                </View>

                <View style={styles.content}>
                    {/* Booking Summary */}
                    <Text style={styles.sectionLabel}>BOOKING SUMMARY</Text>
                    <Text style={styles.venueName}>{venue}</Text>
                    <Text style={styles.dateText}>Wed, {date} {month?.substring(0, 3)}</Text>
                    <Text style={styles.timeText}>{timeSlot}</Text>

                    {/* Number of Players */}
                    <View style={styles.playersContainer}>
                        <View style={styles.playersLabelRow}>
                            <Ionicons name="people-outline" size={moderateScale(24)} color={colors.primary} />
                            <Text style={styles.playersLabel}>Number of Players</Text>
                        </View>
                        <View style={styles.counterContainer}>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={handleDecrement}
                            >
                                <Ionicons name="remove" size={moderateScale(20)} color={colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{numPlayers}</Text>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={handleIncrement}
                            >
                                <Ionicons name="add" size={moderateScale(20)} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Team Name */}
                    <Text style={styles.inputLabel}>Team Name (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your team's name"
                        placeholderTextColor={colors.text.tertiary}
                        value={teamName}
                        onChangeText={setTeamName}
                    />

                    {/* Special Requests */}
                    <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g., need extra stumps"
                        placeholderTextColor={colors.text.tertiary}
                        value={specialRequests}
                        onChangeText={setSpecialRequests}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    {/* Spacer */}
                    <View style={{ height: hp(12) }} />
                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
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
    imageContainer: {
        height: hp(25),
        backgroundColor: colors.brand.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    venueImage: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: wp(5),
    },
    sectionLabel: {
        fontSize: fontScale(11),
        fontWeight: '600',
        color: colors.primary,
        marginBottom: hp(1),
        letterSpacing: 0.5,
    },
    venueName: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: hp(0.5),
    },
    dateText: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        marginBottom: hp(0.3),
    },
    timeText: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        marginBottom: hp(3),
    },
    playersContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(16),
        padding: wp(4),
        marginBottom: hp(3),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    playersLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playersLabel: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.primary,
        marginLeft: wp(2),
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButton: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: colors.gray[50],
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterValue: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: colors.text.primary,
        marginHorizontal: wp(4),
        minWidth: wp(8),
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: hp(1),
    },
    input: {
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(12),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: fontScale(14),
        color: colors.text.primary,
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    textArea: {
        height: hp(15),
        paddingTop: hp(1.5),
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
        color: colors.white,
    },
    cartButton: {
        position: 'absolute',
        bottom: hp(14),
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
});

export default BookingDetailsScreen;
