import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { profileApi } from '../api/profile';
import { bookingsApi } from '../api/venues';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/ui/Button';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PlayScreen = () => {
    const navigation = useNavigation<Navigation>();
    const { user } = useAuthStore();

    const [selectedTab, setSelectedTab] = useState('All');
    const [selectedSport, setSelectedSport] = useState('Pickleball');
    const [showCityModal, setShowCityModal] = useState(false);

    // User profile and city management
    const [userProfile, setUserProfile] = useState<any>(null);
    const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [availableSports, setAvailableSports] = useState<{ name: string; color: string; bgColor: string }[]>([]);

    // Tournaments State
    const [tournamentType, setTournamentType] = useState('Public');
    const [showTournamentTypeDropdown, setShowTournamentTypeDropdown] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Mock Colors for accents (Neon palette)
    const SPORT_COLORS = [
        { color: '#39E079', bgColor: 'rgba(57, 224, 121, 0.1)' }, // Brand Green
        { color: '#FF9F43', bgColor: 'rgba(255, 159, 67, 0.1)' }, // Orange Accent
        { color: '#5856D6', bgColor: 'rgba(88, 86, 214, 0.1)' }, // Purple
        { color: '#FF3B30', bgColor: 'rgba(255, 59, 48, 0.1)' }, // Red
        { color: '#00D1FF', bgColor: 'rgba(0, 209, 255, 0.1)' }, // Cyan
    ];

    // Map cities to their states (same map as before)
    const cityStateMap: { [key: string]: string } = {
        'Hyderabad': 'Telangana',
        'Bangalore': 'Karnataka',
        'Mumbai': 'Maharashtra',
        'Delhi': 'Delhi',
        // ... (Simplified for this file, keeping logic dynamic)
    };

    const displayCity = selectedCity || userProfile?.city || (user as any)?.city || 'Hyderabad';
    const displayState = cityStateMap[displayCity] || 'India';

    const tabs = ['All', 'Tournaments', 'Host Game', 'Join Game'];

    // Bookings State for Hosting
    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {
        fetchUserProfile();
        loadCities();
        loadGameTypes();
    }, []);

    useEffect(() => {
        if (selectedTab === 'Host Game') {
            loadBookings();
        }
    }, [selectedTab]);

    const loadBookings = async () => {
        if (!user?.id) return;
        try {
            const result = await bookingsApi.getUserBookings(user.id);
            if (result.success) {
                const now = new Date();
                const hostable = (result.data || []).filter((booking: any) => {
                    const bookingDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
                    return booking.status.toLowerCase() !== 'cancelled' && bookingDateTime > now;
                });
                setBookings(hostable);
            }
        } catch (error) {
            console.error('[PLAY SCREEN] Error loading bookings:', error);
        }
    };

    const fetchUserProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const response = await profileApi.getProfile('');
            if (response.success && response.data) {
                setUserProfile(response.data);
            }
        } catch (error) {
            console.error('[PLAY SCREEN] Error fetching profile:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const loadCities = async () => {
        try {
            const response = await profileApi.getCities();
            if (response.success) {
                setAvailableCities(response.data);
            }
        } catch (error) {
            console.error('[PLAY SCREEN] Error loading cities:', error);
        }
    };

    const loadGameTypes = async () => {
        try {
            const response = await profileApi.getGameTypes();
            if (response.success && response.data) {
                const mappedSports = response.data.map((game, index) => {
                    const colorSet = SPORT_COLORS[index % SPORT_COLORS.length];
                    return {
                        name: game.name,
                        color: colorSet.color,
                        bgColor: colorSet.bgColor
                    };
                });
                setAvailableSports(mappedSports);
                if (mappedSports.length > 0 && !selectedSport) {
                    setSelectedSport(mappedSports[0].name);
                }
            }
        } catch (error) {
            // Fallback
            setAvailableSports([
                { name: 'Pickleball', color: '#39E079', bgColor: 'rgba(57, 224, 121, 0.1)' },
                { name: 'Badminton', color: '#00D1FF', bgColor: 'rgba(0, 209, 255, 0.1)' },
            ]);
        }
    };

    const renderHostGameContent = () => (
        <View style={styles.listContainer}>
            <Text style={[styles.sectionHeader, { marginTop: 10 }]}>Your Hostable Bookings</Text>
            {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
                    <Text style={styles.emptyText}>No upcoming bookings to host.</Text>
                    <Button
                        title="Book a Venue"
                        onPress={() => navigation.navigate('MainTabs', { screen: 'BookTab' })}
                        style={{ marginTop: 20, width: 200 }}
                    />
                </View>
            ) : (
                bookings.map((booking, index) => (
                    <View key={index} style={styles.card}>
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTag}>{booking.venue_name}</Text>
                                <Text style={styles.cardPrice}>{booking.start_time}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{booking.date ? booking.date : booking.booking_date}</Text>
                            <Text style={styles.cardMeta}>{booking.venue_location}</Text>

                            <Button
                                title="Host This Game"
                                onPress={() => navigation.navigate('HostGame', { bookingData: booking })}
                                style={{ marginTop: 12, backgroundColor: colors.primary }}
                                textStyle={{ color: '#000' }}
                            />
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    // Render Components
    const renderTournamentsContent = () => (
        <View style={styles.tournamentsContainer}>
            {/* Header / Config Row */}
            <View style={styles.tournamentsHeader}>
                {/* Type Selection */}
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowTournamentTypeDropdown(!showTournamentTypeDropdown)}
                >
                    <Text style={styles.dropdownText}>{tournamentType} Tournaments</Text>
                    <Ionicons name="chevron-down" size={moderateScale(14)} color={colors.text.secondary} />
                </TouchableOpacity>

                {/* Create Button */}
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateTournament')}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.createButtonGradient}
                    >
                        <Ionicons name="add" size={moderateScale(18)} color="#000" />
                        <Text style={styles.createButtonText}>Create</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Type Dropdown (Absolute) */}
            {showTournamentTypeDropdown && (
                <View style={styles.dropdownListContainer}>
                    {['Public', 'Private'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={styles.dropdownItem}
                            onPress={() => { setTournamentType(type); setShowTournamentTypeDropdown(false); }}
                        >
                            <Text style={[styles.dropdownItemText, tournamentType === type && { color: colors.primary }]}>{type}</Text>
                            {tournamentType === type && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Filters Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {['Sport', 'Status', 'Date'].map((filter) => (
                    <TouchableOpacity key={filter} style={styles.filterChip} onPress={() => setShowFilterModal(true)}>
                        <Text style={styles.filterChipText}>{filter}</Text>
                        <Ionicons name="chevron-down" size={12} color={colors.text.secondary} />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Tournament List */}
            <View style={styles.listContainer}>
                {/* Demo Card 1 */}
                <View style={styles.card}>
                    <View style={styles.cardImagePlaceholder}>
                        <LinearGradient colors={['#1A1A1A', '#2C2C2E']} style={StyleSheet.absoluteFill} />
                        <Ionicons name="trophy-outline" size={40} color={colors.primary} />
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Open</Text>
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTag}>Padel</Text>
                            <Text style={styles.cardPrice}>$1000 Prize</Text>
                        </View>
                        <Text style={styles.cardTitle}>Padel Championship Series</Text>
                        <Text style={styles.cardMeta}>5/16 Teams • 15-20 Oct</Text>

                        <Button
                            title="Join Now"
                            onPress={() => navigation.navigate('JoinGame', {
                                gameData: {
                                    title: 'Padel Championship Series',
                                    sport: 'Padel',
                                    date: '15-20 Oct',
                                    type: 'TOURNAMENT'
                                }
                            })}
                            style={{ mt: 12 }}
                        />
                    </View>
                </View>

                {/* Demo Card 2 */}
                <View style={styles.card}>
                    <View style={styles.cardImagePlaceholder}>
                        <LinearGradient colors={['#102a19', '#1A1A1A']} style={StyleSheet.absoluteFill} />
                        <View style={styles.featuredBadge}>
                            <Text style={styles.featuredText}>Featured</Text>
                        </View>
                        <Ionicons name="tennisball-outline" size={40} color={colors.white} />
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTag}>Tennis</Text>
                            <Text style={styles.cardPrice}>Trophy</Text>
                        </View>
                        <Text style={styles.cardTitle}>Summer Grand Slam</Text>
                        <Text style={styles.cardMeta}>8/8 Teams • 10-14 Oct</Text>

                        <Button
                            title="Full"
                            onPress={() => { }}
                            disabled
                            style={{ marginTop: 12, backgroundColor: '#333' }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderAllContent = () => (
        <View style={styles.allContentContainer}>
            <Text style={styles.sectionHeader}>Happening Near You</Text>

            {/* Game Card Demo 1 */}
            <View style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                    <View style={styles.gameConfig}>
                        <Ionicons name="people" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.gameType}>Doubles - Regular</Text>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="bookmark-outline" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.gameCardBody}>
                    <View style={styles.playerAvatarContainer}>
                        <View style={[styles.avatarCircle, { backgroundColor: 'rgba(255, 159, 67, 0.2)' }]}>
                            <Text style={{ color: '#FF9F43', fontWeight: 'bold' }}>GT</Text>
                        </View>
                        <Text style={styles.playerCount}>2/4</Text>
                    </View>

                    <View style={styles.gameDetails}>
                        <Text style={styles.gameTitle}>PicklePlex - Court 1</Text>
                        <Text style={styles.gameTime}>Sun 16 Nov • 7:00 PM</Text>
                        <Text style={styles.gameLocation}>Madhapur, Hyderabad (~2.5km)</Text>

                        <View style={styles.gameFooter}>
                            <Button
                                title="Join • ₹119"
                                onPress={() => navigation.navigate('JoinGame', {
                                    gameData: {
                                        title: 'PicklePlex - Court 1',
                                        sport: 'Pickleball',
                                        date: 'Sun 16 Nov',
                                        time: '7:00 PM',
                                        location: 'Madhapur, Hyderabad',
                                        price: '₹119',
                                        host: 'GameTime'
                                    }
                                })}
                                size="small"
                                style={styles.actionButtonSmall}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* Game Card Demo 2 */}
            <View style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                    <View style={styles.gameConfig}>
                        <Ionicons name="tennisball" size={16} color="#00D1FF" style={{ marginRight: 6 }} />
                        <Text style={styles.gameType}>Badminton - Casual</Text>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="bookmark-outline" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.gameCardBody}>
                    <View style={styles.playerAvatarContainer}>
                        <View style={[styles.avatarCircle, { backgroundColor: 'rgba(0, 209, 255, 0.2)' }]}>
                            <Text style={{ color: '#00D1FF', fontWeight: 'bold' }}>JD</Text>
                        </View>
                        <Text style={styles.playerCount}>4/4</Text>
                    </View>

                    <View style={styles.gameDetails}>
                        <Text style={styles.gameTitle}>Baseline Arena</Text>
                        <Text style={styles.gameTime}>Tomorrow • 6:00 AM</Text>
                        <Text style={styles.gameLocation}>Gachibowli, Hyderabad (~5km)</Text>

                        <View style={styles.gameFooter}>
                            <View style={styles.bookedBadge}>
                                <Text style={styles.bookedText}>Booked</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerLabel}>Playing in</Text>
                    <TouchableOpacity
                        style={styles.locationSelector}
                        onPress={() => setShowCityModal(true)}
                    >
                        <Ionicons name="location-sharp" size={16} color={colors.primary} />
                        <Text style={styles.locationText}>{displayCity}</Text>
                        <Ionicons name="chevron-down" size={12} color={colors.text.secondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="search" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('PlayerProfile')}
                    >
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileInitials}>
                                {user?.firstName?.[0] || 'U'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, selectedTab === tab && styles.activeTab]}
                            onPress={() => setSelectedTab(tab)}
                        >
                            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Sports Pills (Only on All or Join) */}
            {(selectedTab === 'All' || selectedTab === 'Join Game') && (
                <View style={styles.sportPillsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp(4) }}>
                        {availableSports.map(sport => {
                            const isSelected = selectedSport === sport.name;
                            return (
                                <TouchableOpacity
                                    key={sport.name}
                                    style={[
                                        styles.sportPill,
                                        isSelected ? { backgroundColor: sport.color, borderColor: sport.color } : { borderColor: '#333' }
                                    ]}
                                    onPress={() => setSelectedSport(sport.name)}
                                >
                                    <Text style={[styles.sportPillText, isSelected ? { color: '#000', fontWeight: 'bold' } : { color: '#FFF' }]}>
                                        {sport.name}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>
            )}

            <ScrollView
                style={styles.mainScrollView}
                contentContainerStyle={{ paddingBottom: hp(12) }}
            >
                {selectedTab === 'Tournaments' || selectedTab === 'All' ? renderTournamentsContent() : null}
                {selectedTab === 'All' && <View style={styles.divider} />}
                {selectedTab === 'All' || selectedTab === 'Join Game' ? renderAllContent() : null}
                {selectedTab === 'Host Game' ? renderHostGameContent() : null}
            </ScrollView>

            {/* City Modal (Placeholder logic) */}
            <Modal visible={showCityModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select City</Text>
                        <ScrollView>
                            {availableCities.map(city => (
                                <TouchableOpacity
                                    key={city.id}
                                    style={styles.modalCityItem}
                                    onPress={() => {
                                        setSelectedCity(city.name);
                                        setShowCityModal(false);
                                    }}
                                >
                                    <Text style={styles.modalCityText}>{city.name}</Text>
                                    {displayCity === city.name && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowCityModal(false)}>
                            <Text style={styles.modalCloseText}>Close</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        // borderBottomWidth: 1,
        // borderBottomColor: '#1A1A1A',
    },
    headerLabel: {
        color: '#888',
        fontSize: fontScale(12),
        marginBottom: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: hp(5),
    },
    emptyText: {
        color: colors.text.secondary,
        fontSize: fontScale(16),
        marginTop: 10,
    },
    locationSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        color: '#FFF',
        fontSize: fontScale(16),
        fontWeight: '700',
        marginLeft: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    profileButton: {
        width: 40,
        height: 40,
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitials: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: fontScale(16),
    },
    tabContainer: {
        paddingVertical: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },
    tabContent: {
        paddingHorizontal: wp(5),
        gap: wp(4),
    },
    tab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#333',
    },
    tabText: {
        color: '#888',
        fontSize: fontScale(14),
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.primary,
    },
    sportPillsContainer: {
        paddingVertical: hp(2),
    },
    sportPill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: '#1C1C1E',
        marginRight: wp(2),
    },
    sportPillText: {
        fontSize: fontScale(13),
        fontWeight: '600',
    },
    mainScrollView: {
        flex: 1,
    },
    sectionHeader: {
        color: '#FFF',
        fontSize: fontScale(18),
        fontWeight: 'bold',
        marginBottom: hp(2),
        paddingHorizontal: wp(5),
    },
    tournamentsContainer: {
        paddingTop: hp(2),
    },
    tournamentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        marginBottom: hp(2),
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        gap: 8,
    },
    dropdownText: {
        color: '#FFF',
        fontSize: fontScale(14),
        fontWeight: '600',
    },
    createButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    createButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: fontScale(14),
    },
    dropdownListContainer: {
        position: 'absolute',
        top: hp(7),
        left: wp(5),
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 8,
        zIndex: 999,
        width: 150,
        borderWidth: 1,
        borderColor: '#444',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dropdownItemText: {
        color: '#FFF',
        fontSize: fontScale(14),
    },
    filterScroll: {
        paddingHorizontal: wp(5),
        marginBottom: hp(2),
        gap: wp(2),
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        gap: 6,
    },
    filterChipText: {
        color: '#DDD',
        fontSize: fontScale(12),
    },
    listContainer: {
        paddingHorizontal: wp(5),
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: hp(2),
    },
    cardImagePlaceholder: {
        height: hp(14),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    featuredBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    featuredText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 10,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardTag: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardPrice: {
        color: '#FF9F43',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardMeta: {
        color: '#888',
        fontSize: 12,
    },
    joinButton: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    joinButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#1A1A1A',
        marginVertical: hp(2),
        marginHorizontal: wp(5),
    },
    allContentContainer: {
        paddingBottom: hp(2),
    },
    gameCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: hp(2),
        marginHorizontal: wp(5),
    },
    gameCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    gameConfig: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gameType: {
        color: '#EEE',
        fontSize: 14,
        fontWeight: '600',
    },
    gameCardBody: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    playerAvatarContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 50,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    playerCount: {
        color: '#888',
        fontSize: 10,
        fontWeight: '600',
    },
    gameDetails: {
        flex: 1,
    },
    gameTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    gameTime: {
        color: colors.primary,
        fontSize: 12,
        marginBottom: 2,
    },
    gameLocation: {
        color: '#888',
        fontSize: 12,
        marginBottom: 8,
    },
    gameFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    actionButtonSmall: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#444',
    },
    actionButtonTextSmall: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    bookedBadge: {
        backgroundColor: '#143019',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e4823',
    },
    bookedText: {
        color: '#39E079',
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: wp(80),
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
        maxHeight: hp(60),
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalCityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalCityText: {
        color: '#DDD',
        fontSize: 16,
    },
    modalClose: {
        marginTop: 16,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#333',
        borderRadius: 10,
    },
    modalCloseText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default PlayScreen;
