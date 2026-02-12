import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Image,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Linking,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import courtsApi from '../api/courts';

const { width } = Dimensions.get('window');

type VenueDetailsRouteProp = RouteProp<RootStackParamList, 'VenueDetails'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const VenueDetailsScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<VenueDetailsRouteProp>();
    const [isFavorite, setIsFavorite] = useState(false);
    const [cartItems, setCartItems] = useState(0);

    // Dynamic ratings and reviews state
    const [ratings, setRatings] = useState({ average_rating: 0, total_reviews: 0 });
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoadingRatings, setIsLoadingRatings] = useState(true);

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
        rules: 'Standard rules apply.',
        googleMapUrl: '',
    };

    // Map the API venue data to the screen's expected format
    const venue = paramsVenue ? {
        id: paramsVenue.id,
        name: paramsVenue.court_name || paramsVenue.branch_name || 'Unnamed Court',
        location: paramsVenue.location || `${paramsVenue.branch_name}, ${paramsVenue.city_name}`,
        rating: ratings.average_rating || 0,
        reviews: ratings.total_reviews || 0,
        price: paramsVenue.prices,
        image: paramsVenue.photos && paramsVenue.photos.length > 0
            ? { uri: paramsVenue.photos[0] }
            : require('../../assets/dashboard-hero.png'),
        amenities: paramsVenue.amenities || [],
        about: paramsVenue.description || paramsVenue.ground_overview || `Premium ${paramsVenue.game_type} facility at ${paramsVenue.branch_name}. Book your slots now for the best playing experience.`,
        terms_and_conditions: paramsVenue.terms_condition || paramsVenue.terms_and_conditions || 'Standard booking terms apply. Cancellations must be made 24 hours in advance.',
        rules: paramsVenue.rule || '',
        googleMapUrl: paramsVenue.google_map_url || '',
    } : defaultVenue;

    // Fetch ratings and reviews when component mounts
    useEffect(() => {
        const fetchRatingsAndReviews = async () => {
            if (!venue.id) return;

            setIsLoadingRatings(true);
            try {
                const [ratingsResponse, reviewsResponse] = await Promise.all([
                    courtsApi.getCourtRatings(venue.id),
                    courtsApi.getCourtReviews(venue.id, 5)
                ]);

                if (ratingsResponse.success) {
                    setRatings(ratingsResponse.data);
                }

                if (reviewsResponse.success) {
                    setReviews(reviewsResponse.data.reviews);
                }
            } catch (error) {
                console.error('Error fetching ratings:', error);
            } finally {
                setIsLoadingRatings(false);
            }
        };

        fetchRatingsAndReviews();
    }, [venue.id]);

    const openMap = () => {
        if (venue.googleMapUrl) {
            Linking.openURL(venue.googleMapUrl).catch(err => console.error("Couldn't load page", err));
            return;
        }

        const label = encodeURIComponent(venue.name);
        // This is a basic map intent; in a real app you'd use lat/long if available
        const url = Platform.select({
            ios: `maps:0,0?q=${label}`,
            android: `geo:0,0?q=${label}`,
        });
        if (url) {
            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                }
            });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp(15) }}>
                {/* Immersive Header Image */}
                <ImageBackground
                    source={venue.image}
                    style={styles.headerImage}
                    imageStyle={styles.headerImageStyle}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)', '#000000']}
                        style={styles.gradientOverlay}
                    >
                        <View style={styles.headerSafeArea}>
                            <View style={styles.headerIcons}>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => setIsFavorite(!isFavorite)}
                                >
                                    <Ionicons
                                        name={isFavorite ? 'heart' : 'heart-outline'}
                                        size={moderateScale(24)}
                                        color={isFavorite ? '#FF4757' : '#fff'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>

                {/* Venue Info Content */}
                <View style={styles.content}>
                    <View style={styles.titleSection}>
                        <Text style={styles.venueName}>{venue.name}</Text>
                        <TouchableOpacity style={styles.locationRow} onPress={openMap}>
                            <Ionicons name="location-outline" size={moderateScale(16)} color={colors.primary} />
                            <Text style={styles.locationText}>{venue.location}</Text>
                            <Ionicons name="chevron-forward" size={moderateScale(14)} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={moderateScale(14)} color="#000" />
                                <Text style={styles.ratingValue}>{venue.rating.toFixed(1)}</Text>
                            </View>
                            <Text style={styles.statLabel}>{venue.reviews} Reviews</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={moderateScale(20)} color="#ccc" />
                            <Text style={styles.statLabel}>Open 24/7</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Ionicons name="navigate-outline" size={moderateScale(20)} color="#ccc" />
                            <Text style={styles.statLabel}>2.5 km</Text>
                        </View>
                    </View>

                    {/* Amenities */}
                    {venue.amenities && venue.amenities.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>AMENITIES</Text>
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
                                                    name="checkmark-circle-outline"
                                                    size={moderateScale(24)}
                                                    color={colors.primary}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.facilityLabel} numberOfLines={1}>{amenity.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* About */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ABOUT VENUE</Text>
                        <Text style={styles.aboutText}>{venue.about}</Text>
                    </View>

                    {/* Rules */}
                    {venue.rules ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Rules</Text>
                            <Text style={styles.termsText}>{venue.rules}</Text>
                        </View>
                    ) : null}

                    {/* Terms and Conditions */}
                    {venue.terms_and_conditions && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>TERMS & CONDITIONS</Text>
                            <Text style={styles.termsText}>{venue.terms_and_conditions}</Text>
                        </View>
                    )}

                    {/* Reviews */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>REVIEWS</Text>
                            {venue.reviews > 0 && (
                                <TouchableOpacity>
                                    <Text style={styles.seeAllText}>See All</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isLoadingRatings ? (
                            <View style={styles.loadingState}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : ratings.total_reviews === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubble-outline" size={moderateScale(32)} color="#333" />
                                <Text style={styles.emptyStateText}>No reviews yet</Text>
                            </View>
                        ) : (
                            <View style={styles.reviewsList}>
                                {reviews.map((review, idx) => (
                                    <View key={review.id || idx} style={styles.reviewCard}>
                                        <View style={styles.reviewHeader}>
                                            <View style={styles.reviewUser}>
                                                <View style={styles.avatarPlaceholder}>
                                                    <Text style={styles.avatarText}>
                                                        {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.reviewUserName}>{review.user_name || 'Anonymous'}</Text>
                                                    <Text style={styles.reviewDate}>
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.reviewRating}>
                                                <Ionicons name="star" size={moderateScale(12)} color="#FFB800" />
                                                <Text style={styles.reviewRatingText}>{review.rating}</Text>
                                            </View>
                                        </View>
                                        {review.review_text && (
                                            <Text style={styles.reviewText}>{review.review_text}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                style={styles.footerGradient}
                pointerEvents="none"
            />
            <View style={styles.footer}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>TOTAL PRICE</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <Text style={styles.priceAmount}>{venue.price}</Text>
                        <Text style={styles.priceUnit}>/hr</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('SlotSelection', { venue: venue })}
                    activeOpacity={0.8}
                >
                    <Text style={styles.bookButtonText}>BOOK SLOT</Text>
                    <Ionicons name="arrow-forward" size={moderateScale(20)} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Floating Cart Button (if needed) */}
            {cartItems > 0 && (
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart" size={moderateScale(24)} color="#000" />
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
        backgroundColor: '#000000',
    },
    headerImage: {
        width: width,
        height: hp(45),
    },
    headerImageStyle: {
        // No radius, fully immersive
    },
    gradientOverlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerSafeArea: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(1),
    },
    headerButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: 'rgba(0,0,0,0.3)', // Glass effect
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        // backdropFilter: 'blur(10px)', // Not supported in React Native standard definitions
    },
    content: {
        paddingHorizontal: wp(5),
        marginTop: -hp(4), // Overlap with image slightly if needed, but here we just flow naturally from the gradient
    },
    titleSection: {
        marginBottom: hp(3),
    },
    venueName: {
        fontSize: fontScale(28),
        fontWeight: '900',
        color: '#fff',
        marginBottom: hp(1),
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: fontScale(14),
        color: '#ccc',
        marginLeft: wp(1),
        marginRight: wp(1),
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: moderateScale(16),
        marginBottom: hp(4),
        borderWidth: 1,
        borderColor: '#333',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.3),
        borderRadius: moderateScale(8),
        marginBottom: hp(0.5),
    },
    ratingValue: {
        fontSize: fontScale(12),
        fontWeight: '800',
        color: '#000',
        marginLeft: 4,
    },
    statLabel: {
        fontSize: fontScale(12),
        color: '#9CA3AF',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: '#333',
    },
    section: {
        marginBottom: hp(4),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: fontScale(14),
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: hp(2),
    },
    seeAllText: {
        color: colors.primary,
        fontSize: fontScale(14),
        fontWeight: '600',
    },
    facilitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(12),
    },
    facilityItem: {
        width: '31%', // roughly 3 per row with gap
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        padding: moderateScale(12),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    facilityIcon: {
        marginBottom: hp(1),
    },
    facilityLabel: {
        fontSize: fontScale(12),
        color: '#fff',
        textAlign: 'center',
        fontWeight: '500',
    },
    aboutText: {
        fontSize: fontScale(14),
        color: '#ccc',
        lineHeight: fontScale(22),
    },
    termsText: {
        fontSize: fontScale(13),
        color: '#999',
        lineHeight: fontScale(20),
    },
    loadingState: {
        padding: hp(2),
        alignItems: 'center',
    },
    emptyState: {
        padding: hp(3),
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyStateText: {
        color: '#666',
        marginTop: hp(1),
        fontSize: fontScale(14),
    },
    reviewsList: {
        gap: hp(2),
    },
    reviewCard: {
        backgroundColor: '#1C1C1E',
        padding: moderateScale(16),
        borderRadius: moderateScale(16),
        borderWidth: 1,
        borderColor: '#333',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(1.5),
    },
    reviewUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    avatarText: {
        color: '#fff',
        fontSize: fontScale(16),
        fontWeight: '600',
    },
    reviewUserName: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: fontScale(12),
        color: '#666',
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    reviewRatingText: {
        color: '#FFB800',
        fontWeight: '700',
        fontSize: fontScale(12),
        marginLeft: 4,
    },
    reviewText: {
        fontSize: fontScale(14),
        color: '#ccc',
        lineHeight: fontScale(20),
    },
    footerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: hp(20),
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C1E',
        paddingHorizontal: wp(5),
        paddingTop: hp(2.5),
        paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(3),
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    priceContainer: {},
    priceLabel: {
        fontSize: fontScale(10),
        color: '#9CA3AF',
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currencySymbol: {
        color: colors.primary,
        fontSize: fontScale(18),
        fontWeight: '700',
        marginRight: 2,
    },
    priceAmount: {
        fontSize: fontScale(24),
        fontWeight: '900',
        color: '#fff',
    },
    priceUnit: {
        fontSize: fontScale(12),
        fontWeight: '600',
        color: '#999',
        marginLeft: 4,
    },
    bookButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.8),
        borderRadius: moderateScale(100),
        alignItems: 'center',
        gap: wp(2),
    },
    bookButtonText: {
        fontSize: fontScale(14),
        fontWeight: '800',
        color: '#000',
        letterSpacing: 0.5,
    },
    cartButton: {
        position: 'absolute',
        bottom: hp(14),
        right: wp(5),
        width: wp(14),
        height: wp(14),
        borderRadius: wp(7),
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
        top: -2,
        right: -2,
        backgroundColor: '#FF4757',
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    cartBadgeText: {
        fontSize: fontScale(10),
        fontWeight: '800',
        color: '#fff',
    },
});

export default VenueDetailsScreen;
