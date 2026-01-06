import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

type VenueDetailsRouteProp = RouteProp<RootStackParamList, 'VenueDetails'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const VenueDetailsScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<VenueDetailsRouteProp>();
    const [isFavorite, setIsFavorite] = useState(false);
    const [cartItems, setCartItems] = useState(0);

    // Get venue data from params
    const paramsVenue = route.params?.venue;

    // Default mock data if no params (fallback)
    const defaultVenue = {
        id: '1',
        name: 'Kanteerava Cricket Nets',
        location: 'Sampangiramnagar, Bengaluru',
        rating: 4.5,
        reviews: 120,
        price: 900,
        image: require('../../assets/dashboard-hero.png'),
        amenities: [
            { id: '1', name: 'WI-FI', icon: null, icon_url: null, description: 'Free WiFi available' },
            { id: '2', name: 'Parking', icon: null, icon_url: null, description: 'Parking available' },
        ],
        about: 'Prime cricket facility in the heart of Bengaluru with well-maintained practice nets, floodlights, parking, and changing rooms. Perfect for evening sessions and weekend games.',
        terms_and_conditions: 'Default terms and conditions apply.',
    };

    // Map the API venue data to the screen's expected format
    const venue = paramsVenue ? {
        id: paramsVenue.id,
        name: paramsVenue.court_name || paramsVenue.branch_name || 'Unnamed Court',
        location: paramsVenue.location || `${paramsVenue.branch_name}, ${paramsVenue.city_name}`,
        rating: 4.5, // Mock rating as it's not in DB yet
        reviews: 120, // Mock reviews
        price: paramsVenue.prices,
        image: paramsVenue.photos && paramsVenue.photos.length > 0
            ? { uri: paramsVenue.photos[0] }
            : require('../../assets/dashboard-hero.png'),
        amenities: paramsVenue.amenities || [],
        about: paramsVenue.description || `Premium ${paramsVenue.game_type} facility at ${paramsVenue.branch_name}. Book your slots now for the best playing experience.`,
        terms_and_conditions: paramsVenue.terms_and_conditions || 'Standard booking terms apply. Cancellations must be made 24 hours in advance.',
    } : defaultVenue;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <ImageBackground
                    source={venue.image}
                    style={styles.headerImage}
                    imageStyle={styles.headerImageStyle}
                >
                    <View style={styles.headerOverlay}>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={moderateScale(24)} color="#333" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => setIsFavorite(!isFavorite)}
                            >
                                <Ionicons
                                    name={isFavorite ? 'heart' : 'heart-outline'}
                                    size={moderateScale(24)}
                                    color={isFavorite ? '#FF4757' : '#333'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>

                {/* Venue Info */}
                <View style={styles.content}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={moderateScale(16)} color="#999" />
                        <Text style={styles.locationText}>{venue.location}</Text>
                    </View>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={moderateScale(16)} color="#FFB800" />
                        <Text style={styles.ratingText}>{venue.rating}</Text>
                        <Text style={styles.reviewsText}>({venue.reviews} reviews)</Text>
                    </View>

                    {/* Amenities */}
                    {venue.amenities && venue.amenities.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Amenities</Text>
                            <View style={styles.facilitiesGrid}>
                                {venue.amenities.map((amenity: any, index: number) => (
                                    <View key={index} style={styles.facilityItem}>
                                        <View style={styles.facilityIcon}>
                                            {amenity.icon_url ? (
                                                <Image
                                                    source={{ uri: amenity.icon_url }}
                                                    style={{ width: moderateScale(24), height: moderateScale(24) }}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Ionicons
                                                    name="star-outline"
                                                    size={moderateScale(24)}
                                                    color={colors.primary}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.facilityLabel}>{amenity.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* About */}
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.aboutText}>{venue.about}</Text>

                    {/* Terms and Conditions */}
                    {venue.terms_and_conditions && (
                        <>
                            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                            <Text style={styles.termsText}>{venue.terms_and_conditions}</Text>
                        </>
                    )}

                    {/* Reviews */}
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <View style={styles.reviewsContainer}>
                        <Text style={styles.reviewsRating}>{venue.rating}</Text>
                        <View style={styles.starsContainer}>
                            {[...Array(5)].map((_, i) => (
                                <Ionicons
                                    key={i}
                                    name={i < Math.floor(venue.rating) ? 'star' : 'star-outline'}
                                    size={moderateScale(20)}
                                    color="#FFB800"
                                />
                            ))}
                        </View>
                        <Text style={styles.reviewsCount}>{venue.reviews} reviews</Text>
                    </View>

                    {/* Spacer for fixed footer */}
                    <View style={{ height: hp(12) }} />
                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceAmount}>₹{venue.price}</Text>
                        <Text style={styles.priceUnit}>/hour</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('SlotSelection', { venue: venue })}
                >
                    <Text style={styles.bookButtonText}>Book Now</Text>
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
    headerImage: {
        width: width,
        height: hp(35),
    },
    headerImageStyle: {
        borderBottomLeftRadius: moderateScale(30),
        borderBottomRightRadius: moderateScale(30),
    },
    headerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderBottomLeftRadius: moderateScale(30),
        borderBottomRightRadius: moderateScale(30),
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(6),
    },
    headerButton: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        padding: wp(5),
    },
    venueName: {
        fontSize: fontScale(22),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(1),
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    locationText: {
        fontSize: fontScale(14),
        color: '#999',
        marginLeft: wp(1),
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(3),
    },
    ratingText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#333',
        marginLeft: wp(1),
    },
    reviewsText: {
        fontSize: fontScale(13),
        color: '#999',
        marginLeft: wp(1),
    },
    sectionTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(2),
        marginTop: hp(2),
    },
    facilitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    facilityItem: {
        width: '22%',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    facilityIcon: {
        width: wp(15),
        height: wp(15),
        borderRadius: wp(7.5),
        backgroundColor: colors.brand.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(0.5),
    },
    facilityLabel: {
        fontSize: fontScale(11),
        color: '#666',
        textAlign: 'center',
    },
    aboutText: {
        fontSize: fontScale(14),
        color: '#666',
        lineHeight: fontScale(22),
    },
    termsText: {
        fontSize: fontScale(14),
        color: '#666',
        lineHeight: fontScale(22),
    },
    reviewsContainer: {
        alignItems: 'center',
        paddingVertical: hp(2),
    },
    reviewsRating: {
        fontSize: fontScale(36),
        fontWeight: '700',
        color: '#333',
        marginBottom: hp(1),
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: hp(0.5),
    },
    reviewsCount: {
        fontSize: fontScale(13),
        color: '#999',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    priceContainer: {},
    priceLabel: {
        fontSize: fontScale(12),
        color: '#999',
        marginBottom: 2,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceAmount: {
        fontSize: fontScale(24),
        fontWeight: '700',
        color: '#333',
    },
    priceUnit: {
        fontSize: fontScale(14),
        color: '#999',
        marginLeft: wp(1),
    },
    bookButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: wp(10),
        paddingVertical: hp(1.8),
        borderRadius: moderateScale(25),
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bookButtonText: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#fff',
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
});

export default VenueDetailsScreen;
