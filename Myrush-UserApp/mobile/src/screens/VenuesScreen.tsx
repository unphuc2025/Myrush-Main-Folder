import React, { useState, useEffect } from 'react';
import { Modal, TouchableWithoutFeedback, View as RNView, TextInput, ImageBackground, StatusBar } from 'react-native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
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
    const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

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

    // Client-side filtering when search text or game type chips change
    useEffect(() => {
        let result = venues;

        // Filter by Search Text (Name or Location)
        if (searchText) {
            const lowerText = searchText.toLowerCase();
            result = result.filter(v =>
                v.court_name.toLowerCase().includes(lowerText) ||
                v.location.toLowerCase().includes(lowerText)
            );
        }

        setFilteredVenues(result);
    }, [searchText, venues]);

    const fetchUserProfile = async () => {
        try {
            const response = await profileApi.getProfile('');
            if (response.success && response.data) {
                console.log('[VENUES SCREEN] User profile:', response.data);
                setUserProfile(response.data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
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
            const response = await venuesApi.getVenues({
                location: displayCity,
            });

            if (response.success && response.data) {
                setVenues(response.data);
                // Also update filtered venues initially
                setFilteredVenues(response.data);
            }
        } catch (error) {
            console.error('Error fetching venues:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getGameTypes = (venue: Venue): string[] => {
        if (typeof venue.game_type === 'string') {
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

            const response = await venuesApi.getVenues(filterParams);

            if (response.success && response.data) {
                let filteredData = response.data;

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
                // Also update filtered venues
                setFilteredVenues(filteredData);
            }
        } catch (error) {
            console.error('Error applying filters:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderVenueCard = (venue: Venue) => {
        const firstPhoto = venue.photos && venue.photos.length > 0 ? venue.photos[0] : null;

        return (
            <TouchableOpacity
                key={venue.id}
                style={styles.venueCard}
                onPress={() => {
                    navigation.navigate('VenueDetails', { venue });
                }}
                activeOpacity={0.9}
            >
                <ImageBackground
                    source={firstPhoto ? { uri: firstPhoto } : undefined}
                    style={styles.venueCardBackground}
                    imageStyle={styles.venueCardImage}
                >
                    {!firstPhoto && (
                        <View style={styles.placeholderOverlay}>
                            <Ionicons name="image-outline" size={moderateScale(40)} color="rgba(255,255,255,0.5)" />
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.venueName}>{venue.court_name}</Text>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={moderateScale(12)} color="#000" />
                                    <Text style={styles.ratingText}>4.5</Text>
                                </View>
                            </View>

                            <View style={styles.venueMetaRow}>
                                <Ionicons name="location-outline" size={moderateScale(14)} color="#ccc" />
                                <Text style={styles.venueMeta} numberOfLines={1}>{venue.location}</Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <View>
                                    <Text style={styles.startingFromLabel}>STARTING FROM</Text>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.currencySymbol}>₹</Text>
                                        <Text style={styles.priceAmount}>{venue.prices}</Text>
                                        <Text style={styles.priceUnit}>/hr</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.bookButton}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        navigation.navigate('VenueDetails', { venue });
                                    }}
                                >
                                    <Text style={styles.bookButtonText}>BOOK</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Venues</Text>
                <TouchableOpacity style={styles.searchButtonPlaceholder}>
                    <Ionicons name="search" size={moderateScale(24)} color="transparent" />
                </TouchableOpacity>
            </View>

            {/* Search Bar & Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={moderateScale(20)} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search venues..."
                        placeholderTextColor="#9CA3AF"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity
                        onPress={() => setShowFilterModal(true)}
                        style={styles.filterIconButton}
                    >
                        <Ionicons name="filter" size={moderateScale(20)} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Chips */}
            <View style={styles.categoryContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContent}
                >
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            filters.gameTypes.length === 0 && styles.categoryChipActive
                        ]}
                        onPress={() => {
                            setFilters(prev => ({ ...prev, gameTypes: [] }));
                            // Trigger general fetch
                            venuesApi.getVenues({ ...filters, game_type: [] }).then(res => {
                                if (res.success && res.data) {
                                    setVenues(res.data);
                                    setFilteredVenues(res.data); // Reset filtered venues too
                                }
                            });
                        }}
                    >
                        <Text style={[
                            styles.categoryText,
                            filters.gameTypes.length === 0 && styles.categoryTextActive
                        ]}>All</Text>
                    </TouchableOpacity>

                    {availableGameTypes.map((gameType) => {
                        const isSelected = filters.gameTypes.includes(gameType.name);
                        return (
                            <TouchableOpacity
                                key={gameType.id}
                                style={[
                                    styles.categoryChip,
                                    isSelected && styles.categoryChipActive
                                ]}
                                onPress={() => {
                                    const newGameTypes = [gameType.name];
                                    setFilters(prev => ({ ...prev, gameTypes: newGameTypes }));

                                    venuesApi.getVenues({ ...filters, game_type: newGameTypes }).then(res => {
                                        if (res.success && res.data) {
                                            setVenues(res.data);
                                            setFilteredVenues(res.data);
                                        }
                                    });
                                }}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    isSelected && styles.categoryTextActive
                                ]}>{gameType.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Venues List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading venues...</Text>
                </View>
            ) : filteredVenues.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="location-outline" size={moderateScale(60)} color="#333" />
                    <Text style={styles.emptyTitle}>No venues found</Text>
                    <Text style={styles.emptyText}>
                        Try adjusting your search or filters
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.venuesList}
                    contentContainerStyle={styles.venuesListContent}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredVenues.map(renderVenueCard)}
                    <View style={{ height: hp(5) }} />
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
                            <Ionicons name="close" size={moderateScale(24)} color="#fff" />
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
                                if (filters.location) {
                                    setSelectedCity(filters.location);
                                } else {
                                    setSelectedCity('');
                                }
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
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: '#000',
    },
    backButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: '#fff',
    },
    searchButtonPlaceholder: {
        width: moderateScale(40),
        alignItems: 'flex-end',
    },
    searchContainer: {
        paddingHorizontal: wp(4),
        marginBottom: hp(2),
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        paddingHorizontal: wp(4),
        height: hp(6),
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: wp(3),
        fontSize: fontScale(14),
    },
    filterIconButton: {
        padding: moderateScale(4),
    },
    categoryContainer: {
        marginBottom: hp(2),
    },
    categoryContent: {
        paddingHorizontal: wp(4),
    },
    categoryChip: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(5),
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(20),
        marginRight: wp(3),
        borderWidth: 1,
        borderColor: '#333',
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        color: '#fff',
        fontSize: fontScale(14),
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#000',
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
        color: '#9CA3AF',
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
        color: '#fff',
        marginTop: hp(2),
    },
    emptyText: {
        fontSize: fontScale(14),
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: hp(1),
    },
    venuesList: {
        flex: 1,
    },
    venuesListContent: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(4),
    },
    venueCard: {
        borderRadius: moderateScale(24),
        marginBottom: hp(3),
        overflow: 'hidden',
        height: hp(45),
        backgroundColor: '#1C1C1E',
    },
    venueCardBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    venueCardImage: {
        borderRadius: moderateScale(24),
    },
    placeholderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardGradient: {
        padding: wp(5),
        paddingTop: hp(10),
    },
    cardContent: {
        justifyContent: 'flex-end',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(0.5),
    },
    venueName: {
        fontSize: fontScale(24),
        fontWeight: '900',
        color: '#fff',
        textTransform: 'uppercase',
        flex: 1,
        marginRight: wp(2),
        letterSpacing: 0.5,
        lineHeight: fontScale(28),
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: moderateScale(12),
    },
    ratingText: {
        color: '#000',
        fontWeight: '700',
        fontSize: fontScale(12),
        marginLeft: wp(1),
    },
    venueMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
        marginTop: hp(0.5),
    },
    venueMeta: {
        color: '#ccc',
        fontSize: fontScale(13),
        marginLeft: wp(1),
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: hp(1),
    },
    startingFromLabel: {
        color: '#9CA3AF',
        fontSize: fontScale(10),
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currencySymbol: {
        color: colors.primary,
        fontSize: fontScale(20),
        fontWeight: '800',
        marginRight: 2,
    },
    priceAmount: {
        color: colors.primary,
        fontSize: fontScale(28),
        fontWeight: '900',
    },
    priceUnit: {
        color: '#fff',
        fontSize: fontScale(14),
        fontWeight: '600',
        marginLeft: 4,
    },
    bookButton: {
        backgroundColor: colors.primary,
        paddingVertical: hp(1.2),
        paddingHorizontal: wp(6),
        borderRadius: moderateScale(100),
    },
    bookButtonText: {
        color: '#000',
        fontWeight: '800',
        fontSize: fontScale(14),
        textTransform: 'uppercase',
    },
    // Filter Modal Styles
    filterModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C1C1E',
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
        borderBottomColor: '#333',
    },
    filterModalTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: '#fff',
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
        color: '#fff',
        marginBottom: hp(1.5),
    },
    filterEmptyText: {
        fontSize: fontScale(14),
        color: '#666',
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
        backgroundColor: '#2C2C2E',
        marginRight: wp(2),
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    locationChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    locationChipText: {
        fontSize: fontScale(14),
        color: '#ccc',
        fontWeight: '500',
    },
    locationChipTextActive: {
        color: '#000',
        fontWeight: '600',
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
        backgroundColor: '#2C2C2E',
        marginRight: wp(2),
        marginBottom: hp(1),
        borderWidth: 1,
        borderColor: '#2C2C2E',
        minWidth: moderateScale(80),
        justifyContent: 'center',
    },
    gameTypeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    gameTypeChipText: {
        fontSize: fontScale(13),
        color: '#ccc',
        fontWeight: '500',
    },
    gameTypeChipTextActive: {
        color: '#000',
        fontWeight: '600',
    },
    priceRangeContainer: {
        marginTop: hp(1),
    },
    priceChip: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(12),
        backgroundColor: '#2C2C2E',
        marginBottom: hp(1),
        borderWidth: 1,
        borderColor: '#2C2C2E',
        alignItems: 'center',
    },
    priceChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    priceChipText: {
        fontSize: fontScale(14),
        color: '#ccc',
        fontWeight: '500',
    },
    priceChipTextActive: {
        color: '#000',
        fontWeight: '600',
    },
    filterModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    clearButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: moderateScale(12),
        marginRight: wp(3),
    },
    clearButtonText: {
        fontSize: fontScale(16),
        color: '#fff',
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
        color: '#000',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
});

export default VenuesScreen;
