import React, { useState, useEffect } from 'react';
import { Modal, TouchableWithoutFeedback, View as RNView } from 'react-native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { venuesApi, Venue } from '../api/venues';
import { profileApi } from '../api/profile';
import { RootStackParamList } from '../types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const VenuesScreen = () => {
    const navigation = useNavigation<Navigation>();
    const { user } = useAuthStore();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGameType, setSelectedGameType] = useState<string | null>(null);

    // Filter states
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
    const [availableGameTypes, setAvailableGameTypes] = useState<{ id: string; name: string }[]>([]);
    const [availableBranches, setAvailableBranches] = useState<{ id: string; name: string; city_id?: string }[]>([]);
    const [filters, setFilters] = useState<{
        location: string;
        branch: string;
        gameTypes: string[];
        priceRange: string;
    }>({
        location: '',
        branch: '',
        gameTypes: [],
        priceRange: '',
    });

    const [userProfile, setUserProfile] = useState<any>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState<string>('');

    // Get user's city and favorite sports from profile API
    const userCity = userProfile?.city || (user as any)?.city || 'Hyderabad';
    const userSports = userProfile?.sports || (user as any)?.sports || (user as any)?.favorite_sports || [];

    // Use selected city if available, otherwise use user's city
    const displayCity = selectedCity || userCity;

    useEffect(() => {
        fetchUserProfile();
        loadFilterOptions();
    }, []);

    useEffect(() => {
        if (!isProfileLoading) {
            fetchVenues();
        }
    }, [isProfileLoading, displayCity]);

    const fetchUserProfile = async () => {
        try {
            // Pass empty string since profileApi expects phone number but backend uses auth token
            const response = await profileApi.getProfile('');
            if (response.success && response.data) {
                console.log('[VENUES SCREEN] User profile:', response.data);
                setUserProfile(response.data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Fallback to user object if profile fetch fails
            if (user) {
                setUserProfile({ city: (user as any)?.city, sports: (user as any)?.favorite_sports });
            }
        } finally {
            setIsProfileLoading(false);
        }
    };

    const loadFilterOptions = async () => {
        try {
            const [citiesResponse, gameTypesResponse] = await Promise.all([
                profileApi.getCities(),
                profileApi.getGameTypes(),
            ]);

            if (citiesResponse.success) {
                setAvailableCities(citiesResponse.data);
            }

            if (gameTypesResponse.success) {
                setAvailableGameTypes(gameTypesResponse.data);
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    };

    const loadBranchesForCity = async (cityName: string) => {
        try {
            // Find city_id from the selected city name
            const selectedCityObj = availableCities.find(c => c.name === cityName);
            if (!selectedCityObj) {
                setAvailableBranches([]);
                return;
            }

            const branchesResponse = await profileApi.getBranches(selectedCityObj.id);
            if (branchesResponse.success) {
                setAvailableBranches(branchesResponse.data);
            } else {
                setAvailableBranches([]);
            }
        } catch (error) {
            console.error('Error loading branches:', error);
            setAvailableBranches([]);
        }
    };

    const fetchVenues = async () => {
        setIsLoading(true);
        try {
            // Show all courts for the selected city
            const response = await venuesApi.getVenues({
                location: displayCity,
                // Don't filter by game type - show all mixed games
            });

            if (response.success && response.data) {
                setVenues(response.data);
            }
        } catch (error) {
            console.error('Error fetching venues:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to parse game_type (could be string or array)
    const getGameTypes = (venue: Venue): string[] => {
        if (typeof venue.game_type === 'string') {
            // If it's a comma-separated string, split it
            return venue.game_type.split(',').map(s => s.trim());
        }
        return [];
    };

    const applyFilters = async () => {
        setIsLoading(true);
        try {
            const filterParams: any = {};

            if (filters.location) {
                filterParams.location = filters.location;
            }

            if (filters.branch) {
                filterParams.branch_id = filters.branch;
            }

            if (filters.gameTypes.length > 0) {
                filterParams.game_type = filters.gameTypes;
            }

            // Note: Price filtering would need backend support
            // For now, we'll still fetch all and filter client-side if needed
            const response = await venuesApi.getVenues(filterParams);

            if (response.success && response.data) {
                let filteredData = response.data;

                // Client-side price filtering if needed
                if (filters.priceRange) {
                    filteredData = response.data.filter(venue => {
                        const price = typeof venue.prices === 'string'
                            ? parseInt(venue.prices)
                            : venue.prices;

                        if (filters.priceRange === 'low') {
                            return price >= 0 && price <= 500;
                        } else if (filters.priceRange === 'medium') {
                            return price > 500 && price <= 1000;
                        } else if (filters.priceRange === 'high') {
                            return price > 1000;
                        }
                        return true;
                    });
                }

                setVenues(filteredData);
            }
        } catch (error) {
            console.error('Error applying filters:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderVenueCard = (venue: Venue) => {
        const gameTypes = getGameTypes(venue);
        const firstPhoto = venue.photos && venue.photos.length > 0 ? venue.photos[0] : null;

        return (
            <TouchableOpacity
                key={venue.id}
                style={styles.venueCard}
                onPress={() => {
                    navigation.navigate('VenueDetails', { venue });
                }}
            >
                {firstPhoto ? (
                    <Image
                        source={{ uri: firstPhoto }}
                        style={styles.venueImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.venueImage, styles.placeholderImage]}>
                        <Ionicons name="image-outline" size={moderateScale(40)} color="#ccc" />
                    </View>
                )}

                <View style={styles.venueInfo}>
                    <Text style={styles.venueName}>{venue.court_name}</Text>

                    <View style={styles.venueMetaRow}>
                        <Ionicons name="location-outline" size={moderateScale(14)} color="#666" />
                        <Text style={styles.venueMeta}>{venue.location}</Text>
                    </View>

                    {venue.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {venue.description}
                        </Text>
                    )}

                    {/* Show game types */}
                    {gameTypes.length > 0 && (
                        <View style={styles.sportsRow}>
                            {gameTypes.slice(0, 3).map((gameType, index) => (
                                <View key={index} style={styles.sportChip}>
                                    <Text style={styles.sportChipText}>{gameType}</Text>
                                </View>
                            ))}
                            {gameTypes.length > 3 && (
                                <Text style={styles.moreSports}>+{gameTypes.length - 3}</Text>
                            )}
                        </View>
                    )}

                    {venue.prices && (
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Starting from</Text>
                            <Text style={styles.price}>₹{venue.prices}/hr</Text>
                        </View>
                    )}

                    {venue.photos && venue.photos.length > 1 && (
                        <View style={styles.photoCount}>
                            <Ionicons name="images-outline" size={moderateScale(14)} color="#666" />
                            <Text style={styles.photoCountText}>{venue.photos.length} photos</Text>
                        </View>
                    )}

                    {venue.videos && venue.videos.length > 0 && (
                        <View style={styles.videoCount}>
                            <Ionicons name="videocam-outline" size={moderateScale(14)} color="#666" />
                            <Text style={styles.videoCountText}>{venue.videos.length} videos</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('VenueDetails', { venue });
                        }}
                    >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                        <Ionicons name="arrow-forward" size={moderateScale(16)} color="#fff" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Venues in {displayCity}</Text>
                    <Text style={styles.headerSubtitle}>
                        {venues.length} venue{venues.length !== 1 ? 's' : ''} available
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="filter" size={moderateScale(24)} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Venues List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading venues...</Text>
                </View>
            ) : venues.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="location-outline" size={moderateScale(60)} color="#ccc" />
                    <Text style={styles.emptyTitle}>No venues found</Text>
                    <Text style={styles.emptyText}>
                        No venues available in {userCity} for the selected sports
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.venuesList}
                    contentContainerStyle={styles.venuesListContent}
                    showsVerticalScrollIndicator={false}
                >
                    {venues.map(renderVenueCard)}
                </ScrollView>
            )}

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
                    <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>

                <View style={styles.filterModal}>
                    <View style={styles.filterModalHeader}>
                        <Text style={styles.filterModalTitle}>Filters</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Ionicons name="close" size={moderateScale(24)} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
                        {/* Location Filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Location</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.locationChipsContainer}
                            >
                                {availableCities.map((city) => (
                                    <TouchableOpacity
                                        key={city.id}
                                        style={[
                                            styles.locationChip,
                                            filters.location === city.name && styles.locationChipActive
                                        ]}
                                        onPress={() => {
                                            const newCityName = filters.location === city.name ? '' : city.name;
                                            setFilters(prev => ({
                                                ...prev,
                                                location: newCityName,
                                                branch: '' // Reset branch when city changes
                                            }));
                                            // Load branches for selected city
                                            if (newCityName) {
                                                loadBranchesForCity(newCityName);
                                            } else {
                                                setAvailableBranches([]);
                                            }
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.locationChipText,
                                                filters.location === city.name && styles.locationChipTextActive
                                            ]}
                                        >
                                            {city.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Branch Filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Branch</Text>
                            {!filters.location ? (
                                <Text style={styles.filterEmptyText}>
                                    Select a city first to view branches
                                </Text>
                            ) : availableBranches.length === 0 ? (
                                <Text style={styles.filterEmptyText}>
                                    No branches available in {filters.location}
                                </Text>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.locationChipsContainer}
                                >
                                    {availableBranches.map((branch) => (
                                        <TouchableOpacity
                                            key={branch.id}
                                            style={[
                                                styles.locationChip,
                                                filters.branch === branch.id && styles.locationChipActive
                                            ]}
                                            onPress={() =>
                                                setFilters(prev => ({
                                                    ...prev,
                                                    branch: prev.branch === branch.id ? '' : branch.id
                                                }))
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.locationChipText,
                                                    filters.branch === branch.id && styles.locationChipTextActive
                                                ]}
                                            >
                                                {branch.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* Game Types Filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Sports</Text>
                            <View style={styles.gameTypesGrid}>
                                {availableGameTypes.map((gameType) => {
                                    const isSelected = filters.gameTypes.includes(gameType.name);
                                    return (
                                        <TouchableOpacity
                                            key={gameType.id}
                                            style={[
                                                styles.gameTypeChip,
                                                isSelected && styles.gameTypeChipActive
                                            ]}
                                            onPress={() => {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    gameTypes: isSelected
                                                        ? prev.gameTypes.filter(g => g !== gameType.name)
                                                        : [...prev.gameTypes, gameType.name]
                                                }));
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.gameTypeChipText,
                                                    isSelected && styles.gameTypeChipTextActive
                                                ]}
                                            >
                                                {gameType.name}
                                            </Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={moderateScale(14)} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Price Range Filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Price Range</Text>
                            <View style={styles.priceRangeContainer}>
                                {[
                                    { key: '', label: 'Any Price' },
                                    { key: 'low', label: '₹0 - ₹500' },
                                    { key: 'medium', label: '₹500 - ₹1000' },
                                    { key: 'high', label: '₹1000+' },
                                ].map((price) => (
                                    <TouchableOpacity
                                        key={price.key}
                                        style={[
                                            styles.priceChip,
                                            filters.priceRange === price.key && styles.priceChipActive
                                        ]}
                                        onPress={() =>
                                            setFilters(prev => ({
                                                ...prev,
                                                priceRange: prev.priceRange === price.key ? '' : price.key
                                            }))
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.priceChipText,
                                                filters.priceRange === price.key && styles.priceChipTextActive
                                            ]}
                                        >
                                            {price.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Modal Actions */}
                    <View style={styles.filterModalActions}>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                                setFilters({
                                    location: '',
                                    branch: '',
                                    gameTypes: [],
                                    priceRange: '',
                                });
                            }}
                        >
                            <Text style={styles.clearButtonText}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => {
                                // Update selected city if a location filter was chosen
                                if (filters.location) {
                                    setSelectedCity(filters.location);
                                } else {
                                    setSelectedCity(''); // Reset to user's city
                                }
                                // Apply filters and fetch venues
                                applyFilters();
                                setShowFilterModal(false);
                            }}
                        >
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
    },
    backButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        marginLeft: wp(3),
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: colors.text.primary,
    },
    headerSubtitle: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
        marginTop: 2,
    },
    headerRight: {
        width: moderateScale(40),
    },
    filterButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        backgroundColor: colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    filterContent: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
    },
    filterChip: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: moderateScale(20),
        backgroundColor: '#F5F7FA',
        marginRight: wp(2),
    },
    filterChipActive: {
        backgroundColor: colors.primary,
    },
    filterChipText: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: hp(2),
        fontSize: fontScale(14),
        color: colors.text.secondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(8),
    },
    emptyTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: hp(2),
    },
    emptyText: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: hp(1),
    },
    venuesList: {
        flex: 1,
    },
    venuesListContent: {
        padding: wp(4),
    },
    venueCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: moderateScale(16),
        marginBottom: hp(2),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    venueImage: {
        width: '100%',
        height: hp(20),
        backgroundColor: '#F5F7FA',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    venueInfo: {
        padding: wp(4),
    },
    venueName: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: hp(1),
    },
    venueMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    venueMeta: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
        marginLeft: wp(1),
    },
    description: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
        lineHeight: fontScale(18),
        marginBottom: hp(1),
    },
    sportsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: hp(1),
    },
    sportChip: {
        backgroundColor: colors.brand.light,
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.5),
        borderRadius: moderateScale(12),
        marginRight: wp(1.5),
        marginBottom: hp(0.5),
    },
    sportChipText: {
        fontSize: fontScale(11),
        color: colors.primary,
        fontWeight: '500',
    },
    moreSports: {
        fontSize: fontScale(11),
        color: colors.text.secondary,
        alignSelf: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(1),
    },
    priceLabel: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
        marginRight: wp(2),
    },
    price: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.primary,
    },
    photoCount: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(0.5),
    },
    photoCountText: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
        marginLeft: wp(1),
    },
    videoCount: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(0.5),
    },
    videoCountText: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
        marginLeft: wp(1),
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(12),
        marginTop: hp(1.5),
    },
    bookButtonText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#fff',
        marginRight: wp(1),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    filterModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background.secondary,
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        maxHeight: hp(80),
        minHeight: hp(50),
    },
    filterModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    filterModalTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: colors.text.primary,
    },
    closeButton: {
        width: moderateScale(32),
        height: moderateScale(32),
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModalContent: {
        padding: wp(6),
        flexGrow: 1,
    },
    filterSection: {
        marginBottom: hp(3),
    },
    filterSectionTitle: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: hp(1.5),
    },
    filterEmptyText: {
        fontSize: fontScale(14),
        color: '#999',
        fontStyle: 'italic',
        marginTop: hp(1),
    },
    locationChipsContainer: {
        marginBottom: hp(1),
    },
    locationChip: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: moderateScale(20),
        backgroundColor: '#F5F7FA',
        marginRight: wp(2),
        borderWidth: 1,
        borderColor: '#F5F7FA',
    },
    locationChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    locationChipText: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        fontWeight: '500',
    },
    locationChipTextActive: {
        color: '#fff',
    },
    gameTypesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: hp(1),
    },
    gameTypeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: moderateScale(16),
        backgroundColor: '#F5F7FA',
        marginRight: wp(2),
        marginBottom: hp(1),
        borderWidth: 1,
        borderColor: '#F5F7FA',
        minWidth: moderateScale(80),
        justifyContent: 'center',
    },
    gameTypeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    gameTypeChipText: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
        fontWeight: '500',
    },
    gameTypeChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    priceRangeContainer: {
        marginTop: hp(1),
    },
    priceChip: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(12),
        backgroundColor: '#F5F7FA',
        marginBottom: hp(1),
        borderWidth: 1,
        borderColor: '#F5F7FA',
        alignItems: 'center',
    },
    priceChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    priceChipText: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        fontWeight: '500',
    },
    priceChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    filterModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    clearButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        borderRadius: moderateScale(12),
        marginRight: wp(3),
    },
    clearButtonText: {
        fontSize: fontScale(16),
        color: colors.text.secondary,
        fontWeight: '600',
    },
    applyButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: moderateScale(12),
    },
    applyButtonText: {
        fontSize: fontScale(16),
        color: '#fff',
        fontWeight: '600',
    },
});

export default VenuesScreen;
