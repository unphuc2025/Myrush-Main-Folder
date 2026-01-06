import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { profileApi } from '../api/profile';
import { useAuthStore } from '../store/authStore';

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

    const SPORT_COLORS = [
        { color: '#00C853', bgColor: '#E8F5E9' }, // Green
        { color: '#00BCD4', bgColor: '#E0F7FA' }, // Cyan
        { color: '#FF9800', bgColor: '#FFF3E0' }, // Orange
        { color: '#E91E63', bgColor: '#FCE4EC' }, // Pink
        { color: '#9C27B0', bgColor: '#F3E5F5' }, // Purple
        { color: '#3F51B5', bgColor: '#E8EAF6' }, // Indigo
        { color: '#757575', bgColor: '#F5F5F5' }, // Grey
    ];

    // Map cities to their states
    const cityStateMap: { [key: string]: string } = {
        'Hyderabad': 'Telangana',
        'Bangalore': 'Karnataka',
        'Bengaluru': 'Karnataka',
        'Mumbai': 'Maharashtra',
        'Delhi': 'Delhi',
        'New Delhi': 'Delhi',
        'Chennai': 'Tamil Nadu',
        'Kolkata': 'West Bengal',
        'Pune': 'Maharashtra',
        'Ahmedabad': 'Gujarat',
        'Jaipur': 'Rajasthan',
        'Surat': 'Gujarat',
        'Lucknow': 'Uttar Pradesh',
        'Kanpur': 'Uttar Pradesh',
        'Nagpur': 'Maharashtra',
        'Indore': 'Madhya Pradesh',
        'Thane': 'Maharashtra',
        'Bhopal': 'Madhya Pradesh',
        'Visakhapatnam': 'Andhra Pradesh',
        'Pimpri-Chinchwad': 'Maharashtra',
        'Patna': 'Bihar',
        'Vadodara': 'Gujarat',
        'Ghaziabad': 'Uttar Pradesh',
        'Ludhiana': 'Punjab',
        'Agra': 'Uttar Pradesh',
        'Nashik': 'Maharashtra',
        'Faridabad': 'Haryana',
        'Meerut': 'Uttar Pradesh',
        'Rajkot': 'Gujarat',
        'Kalyan-Dombivli': 'Maharashtra',
        'Vasai-Virar': 'Maharashtra',
        'Varanasi': 'Uttar Pradesh',
        'Srinagar': 'Jammu and Kashmir',
        'Aurangabad': 'Maharashtra',
        'Dhanbad': 'Jharkhand',
        'Amritsar': 'Punjab',
        'Navi Mumbai': 'Maharashtra',
        'Allahabad': 'Uttar Pradesh',
        'Prayagraj': 'Uttar Pradesh',
        'Ranchi': 'Jharkhand',
        'Howrah': 'West Bengal',
        'Coimbatore': 'Tamil Nadu',
        'Jabalpur': 'Madhya Pradesh',
        'Gwalior': 'Madhya Pradesh',
        'Vijayawada': 'Andhra Pradesh',
        'Jodhpur': 'Rajasthan',
        'Madurai': 'Tamil Nadu',
        'Raipur': 'Chhattisgarh',
        'Kota': 'Rajasthan',
        'Guwahati': 'Assam',
        'Chandigarh': 'Chandigarh',
        'Solapur': 'Maharashtra',
        'Hubballi-Dharwad': 'Karnataka',
        'Tiruchirappalli': 'Tamil Nadu',
        'Bareilly': 'Uttar Pradesh',
        'Moradabad': 'Uttar Pradesh',
        'Mysore': 'Karnataka',
        'Gurgaon': 'Haryana',
        'Gurugram': 'Haryana',
        'Aligarh': 'Uttar Pradesh',
        'Jalandhar': 'Punjab',
        'Bhubaneswar': 'Odisha',
        'Salem': 'Tamil Nadu',
        'Mira-Bhayandar': 'Maharashtra',
        'Warangal': 'Telangana',
        'Thiruvananthapuram': 'Kerala',
        'Guntur': 'Andhra Pradesh',
        'Bhiwandi': 'Maharashtra',
        'Saharanpur': 'Uttar Pradesh',
        'Gorakhpur': 'Uttar Pradesh',
        'Bikaner': 'Rajasthan',
        'Amravati': 'Maharashtra',
        'Noida': 'Uttar Pradesh',
        'Jamshedpur': 'Jharkhand',
        'Bhilai': 'Chhattisgarh',
        'Cuttack': 'Odisha',
        'Firozabad': 'Uttar Pradesh',
        'Kochi': 'Kerala',
        'Nellore': 'Andhra Pradesh',
        'Bhavnagar': 'Gujarat',
        'Dehradun': 'Uttarakhand',
        'Durgapur': 'West Bengal',
        'Asansol': 'West Bengal',
        'Rourkela': 'Odisha',
        'Nanded': 'Maharashtra',
        'Kolhapur': 'Maharashtra',
        'Ajmer': 'Rajasthan',
        'Akola': 'Maharashtra',
        'Gulbarga': 'Karnataka',
        'Jamnagar': 'Gujarat',
        'Ujjain': 'Madhya Pradesh',
        'Loni': 'Uttar Pradesh',
        'Siliguri': 'West Bengal',
        'Jhansi': 'Uttar Pradesh',
        'Ulhasnagar': 'Maharashtra',
        'Jammu': 'Jammu and Kashmir',
        'Sangli-Miraj & Kupwad': 'Maharashtra',
        'Mangalore': 'Karnataka',
        'Erode': 'Tamil Nadu',
        'Belgaum': 'Karnataka',
        'Ambattur': 'Tamil Nadu',
        'Tirunelveli': 'Tamil Nadu',
        'Malegaon': 'Maharashtra',
        'Gaya': 'Bihar',
        'Jalgaon': 'Maharashtra',
        'Udaipur': 'Rajasthan',
        'Maheshtala': 'West Bengal',
        'Tirupur': 'Tamil Nadu',
        'Davanagere': 'Karnataka',
        'Kozhikode': 'Kerala',
        'Akbarpur': 'Uttar Pradesh',
        'Kurnool': 'Andhra Pradesh',
        'Rajpur Sonarpur': 'West Bengal',
        'Rajahmundry': 'Andhra Pradesh',
        'Bokaro': 'Jharkhand',
        'South Dumdum': 'West Bengal',
        'Bellary': 'Karnataka',
        'Patiala': 'Punjab',
        'Gopalpur': 'West Bengal',
        'Agartala': 'Tripura',
        'Bhagalpur': 'Bihar',
        'Muzaffarnagar': 'Uttar Pradesh',
        'Bhatpara': 'West Bengal',
        'Panihati': 'West Bengal',
        'Latur': 'Maharashtra',
        'Dhule': 'Maharashtra',
        'Rohtak': 'Haryana',
        'Korba': 'Chhattisgarh',
        'Bhilwara': 'Rajasthan',
        'Berhampur': 'Odisha',
        'Muzaffarpur': 'Bihar',
        'Ahmednagar': 'Maharashtra',
        'Mathura': 'Uttar Pradesh',
        'Kollam': 'Kerala',
        'Avadi': 'Tamil Nadu',
        'Kadapa': 'Andhra Pradesh',
        'Kamarhati': 'West Bengal',
        'Sambalpur': 'Odisha',
        'Bilaspur': 'Chhattisgarh',
        'Shahjahanpur': 'Uttar Pradesh',
        'Satara': 'Maharashtra',
        'Bijapur': 'Karnataka',
        'Rampur': 'Uttar Pradesh',
        'Shivamogga': 'Karnataka',
        'Chandrapur': 'Maharashtra',
        'Junagadh': 'Gujarat',
        'Thrissur': 'Kerala',
        'Alwar': 'Rajasthan',
        'Bardhaman': 'West Bengal',
        'Kulti': 'West Bengal',
        'Kakinada': 'Andhra Pradesh',
        'Nizamabad': 'Telangana',
        'Parbhani': 'Maharashtra',
        'Tumkur': 'Karnataka',
        'Khammam': 'Telangana',
        'Ozhukarai': 'Puducherry',
        'Bihar Sharif': 'Bihar',
        'Panipat': 'Haryana',
        'Darbhanga': 'Bihar',
        'Bally': 'West Bengal',
        'Aizawl': 'Mizoram',
        'Dewas': 'Madhya Pradesh',
        'Ichalkaranji': 'Maharashtra',
        'Karnal': 'Haryana',
        'Bathinda': 'Punjab',
        'Jalna': 'Maharashtra',
        'Eluru': 'Andhra Pradesh',
        'Kirari Suleman Nagar': 'Delhi',
        'Barasat': 'West Bengal',
        'Purnia': 'Bihar',
        'Satna': 'Madhya Pradesh',
        'Mau': 'Uttar Pradesh',
        'Sonipat': 'Haryana',
        'Farrukhabad': 'Uttar Pradesh',
        'Sagar': 'Madhya Pradesh',
        'Durg': 'Chhattisgarh',
        'Imphal': 'Manipur',
        'Ratlam': 'Madhya Pradesh',
        'Hapur': 'Uttar Pradesh',
        'Arrah': 'Bihar',
        'Karimnagar': 'Telangana',
        'Anantapur': 'Andhra Pradesh',
        'Etawah': 'Uttar Pradesh',
        'Ambernath': 'Maharashtra',
        'North Dumdum': 'West Bengal',
        'Bharatpur': 'Rajasthan',
        'Begusarai': 'Bihar',
        'Gandhidham': 'Gujarat',
        'Baranagar': 'West Bengal',
        'Tirupati': 'Andhra Pradesh',
        'Puducherry': 'Puducherry',
        'Sikar': 'Rajasthan',
        'Thoothukudi': 'Tamil Nadu',
        'Rewa': 'Madhya Pradesh',
        'Mirzapur': 'Uttar Pradesh',
        'Raichur': 'Karnataka',
        'Pali': 'Rajasthan',
        'Ramagundam': 'Telangana',
        'Haridwar': 'Uttarakhand',
        'Vijayanagaram': 'Andhra Pradesh',
        'Katihar': 'Bihar',
        'Nagercoil': 'Tamil Nadu',
        'Sri Ganganagar': 'Rajasthan',
        'Karawal Nagar': 'Delhi',
        'Mango': 'Jharkhand',
        'Thanjavur': 'Tamil Nadu',
        'Bulandshahr': 'Uttar Pradesh',
        'Uluberia': 'West Bengal',
        'Murwara': 'Madhya Pradesh',
        'Sambhal': 'Uttar Pradesh',
        'Singrauli': 'Madhya Pradesh',
        'Nadiad': 'Gujarat',
        'Secunderabad': 'Telangana',
        'Naihati': 'West Bengal',
        'Yamunanagar': 'Haryana',
        'Bidhan Nagar': 'West Bengal',
        'Pallavaram': 'Tamil Nadu',
        'Bidar': 'Karnataka',
        'Munger': 'Bihar',
        'Panchkula': 'Haryana',
        'Burhanpur': 'Madhya Pradesh',
        'Raurkela Industrial Township': 'Odisha',
        'Kharagpur': 'West Bengal',
        'Dindigul': 'Tamil Nadu',
        'Gandhinagar': 'Gujarat',
        'Hospet': 'Karnataka',
        'Nangloi Jat': 'Delhi',
        'Malda': 'West Bengal',
        'Ongole': 'Andhra Pradesh',
        'Deoghar': 'Jharkhand',
        'Chapra': 'Bihar',
        'Haldia': 'West Bengal',
        'Khandwa': 'Madhya Pradesh',
        'Nandyal': 'Andhra Pradesh',
        'Chittoor': 'Andhra Pradesh',
        'Morena': 'Madhya Pradesh',
        'Amroha': 'Uttar Pradesh',
        'Anand': 'Gujarat',
        'Bhind': 'Madhya Pradesh',
        'Bhalswa Jahangir Pur': 'Delhi',
        'Madhyamgram': 'West Bengal',
        'Bhiwani': 'Haryana',
        'Navi Mumbai Panvel Raigad': 'Maharashtra',
        'Bahraich': 'Uttar Pradesh',
        'Sultan Pur Majra': 'Delhi',
        'Morbi': 'Gujarat',
        'Fatehpur': 'Uttar Pradesh',
        'Rae Bareli': 'Uttar Pradesh',
        'Khora': 'Uttar Pradesh',
        'Bhusawal': 'Maharashtra',
        'Orai': 'Uttar Pradesh',
        'Bahadurgarh': 'Haryana',
        'Vellore': 'Tamil Nadu',
        'Mahesana': 'Gujarat',
        'Sirsa': 'Haryana',
        'Danapur': 'Bihar',
        'Serampore': 'West Bengal',
        'Sultanpur': 'Uttar Pradesh',
        'Guna': 'Madhya Pradesh',
        'Jaunpur': 'Uttar Pradesh',
        'Panvel': 'Maharashtra',
        'Shivpuri': 'Madhya Pradesh',
        'Surendranagar Dudhrej': 'Gujarat',
        'Unnao': 'Uttar Pradesh',
        'Hugli and Chinsurah': 'West Bengal',
        'Alappuzha': 'Kerala',
        'Kottayam': 'Kerala',
        'Machilipatnam': 'Andhra Pradesh',
        'Shimla': 'Himachal Pradesh',
        'Adoni': 'Andhra Pradesh',
        'Udupi': 'Karnataka',
        'Proddatur': 'Andhra Pradesh',
        'Budaun': 'Uttar Pradesh',
        'Mahbubnagar': 'Telangana',
        'Saharsa': 'Bihar',
        'Dibrugarh': 'Assam',
        'Jorhat': 'Assam',
        'Hazaribagh': 'Jharkhand',
        'Hindupur': 'Andhra Pradesh',
        'Nagaon': 'Assam',
        'Hajipur': 'Bihar',
        'Sasaram': 'Bihar',
        'Giridih': 'Jharkhand',
        'Bhimavaram': 'Andhra Pradesh',
        'Kumbakonam': 'Tamil Nadu',
        'Bongaigaon': 'Assam',
        'Dehri': 'Bihar',
        'Madanapalle': 'Andhra Pradesh',
        'Siwan': 'Bihar',
        'Bettiah': 'Bihar',
        'Ramgarh': 'Jharkhand',
        'Tinsukia': 'Assam',
        'Guntakal': 'Andhra Pradesh',
        'Srikakulam': 'Andhra Pradesh',
        'Motihari': 'Bihar',
        'Dharmavaram': 'Andhra Pradesh',
        'Gudivada': 'Andhra Pradesh',
        'Phagwara': 'Punjab',
        'Pudukkottai': 'Tamil Nadu',
        'Hosur': 'Tamil Nadu',
        'Narasaraopet': 'Andhra Pradesh',
        'Suryapet': 'Telangana',
        'Miryalaguda': 'Telangana',
        'Tadipatri': 'Andhra Pradesh',
        'Karaikudi': 'Tamil Nadu',
        'Kishanganj': 'Bihar',
        'Jamalpur': 'Bihar',
        'Ballia': 'Uttar Pradesh',
        'Kavali': 'Andhra Pradesh',
        'Tadepalligudem': 'Andhra Pradesh',
        'Amaravati': 'Andhra Pradesh',
        'Buxar': 'Bihar',
        'Tezpur': 'Assam',
        'Jehanabad': 'Bihar',
        'Gangtok': 'Sikkim',
        'Vasco Da Gama': 'Goa',
        'Silchar': 'Assam',
        'Naharlagun': 'Arunachal Pradesh',
        'Panaji': 'Goa',
    };

    // Get display city - use selected city if available, otherwise use user's profile city
    const displayCity = selectedCity || userProfile?.city || (user as any)?.city || 'Hyderabad';

    // Determine state based on city
    const displayState = cityStateMap[displayCity] || (displayCity === 'Hyderabad' ? 'Telangana' : 'India');

    const tabs = ['All', 'Tournaments', 'Host Game', 'Join Game'];

    // Fetch user profile and available cities on mount
    useEffect(() => {
        fetchUserProfile();
        loadCities();
        loadGameTypes();
    }, []);

    const fetchUserProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const response = await profileApi.getProfile('');
            if (response.success && response.data) {
                console.log('[PLAY SCREEN] User profile:', response.data);
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
                // Map APIs game types to including colors
                const mappedSports = response.data.map((game, index) => {
                    const colorSet = SPORT_COLORS[index % SPORT_COLORS.length];
                    return {
                        name: game.name,
                        color: colorSet.color,
                        bgColor: colorSet.bgColor
                    };
                });

                setAvailableSports(mappedSports);

                // Set default selected sport if available
                if (mappedSports.length > 0 && !selectedSport) {
                    setSelectedSport(mappedSports[0].name);
                }
            }
        } catch (error) {
            console.error('[PLAY SCREEN] Error loading game types:', error);
            // Fallback to default if API fails
            setAvailableSports([
                { name: 'Pickleball', color: '#00C853', bgColor: '#E8F5E9' },
                { name: 'Badminton', color: '#00BCD4', bgColor: '#E0F7FA' },
            ]);
        }
    };

    const handleCitySelect = (cityName: string) => {
        setSelectedCity(cityName);
        setShowCityModal(false);
    };

    // Updated Tournaments Content
    const renderTournamentsContent = () => (
        <View style={styles.tournamentsContainer}>
            {/* Tournament Header: Dropdown & Create Button */}
            <View style={styles.tournamentsHeader}>
                {/* Public/Private Dropdown */}
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowTournamentTypeDropdown(!showTournamentTypeDropdown)}
                >
                    <Text style={styles.dropdownText}>{tournamentType} Tournaments</Text>
                    <Ionicons name="chevron-down" size={moderateScale(16)} color="#1A1A1A" />
                </TouchableOpacity>

                {/* Create Tournament Button */}
                <TouchableOpacity
                    style={styles.createTournamentHeaderButton}
                    onPress={() => navigation.navigate('CreateTournament')}
                >
                    <Ionicons name="add" size={moderateScale(18)} color="#FFFFFF" />
                    <Text style={styles.createTournamentHeaderText}>Create</Text>
                </TouchableOpacity>
            </View>

            {/* Dropdown Selection View (Visible when toggled) */}
            {showTournamentTypeDropdown && (
                <View style={styles.dropdownListContainer}>
                    <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setTournamentType('Public'); setShowTournamentTypeDropdown(false); }}
                    >
                        <Text style={[styles.dropdownItemText, tournamentType === 'Public' && styles.dropdownItemTextActive]}>Public</Text>
                        {tournamentType === 'Public' && <Ionicons name="checkmark" size={moderateScale(18)} color="#00C853" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setTournamentType('Private'); setShowTournamentTypeDropdown(false); }}
                    >
                        <Text style={[styles.dropdownItemText, tournamentType === 'Private' && styles.dropdownItemTextActive]}>Private</Text>
                        {tournamentType === 'Private' && <Ionicons name="checkmark" size={moderateScale(18)} color="#00C853" />}
                    </TouchableOpacity>
                </View>
            )}

            {/* Filters Row */}
            <View style={styles.filtersRow}>
                <TouchableOpacity
                    style={styles.filterChip}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="search-outline" size={moderateScale(16)} color="#666" />
                    <Text style={styles.filterChipText}>Sport</Text>
                    <Ionicons name="chevron-down" size={moderateScale(12)} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.filterChip}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="trophy-outline" size={moderateScale(16)} color="#666" />
                    <Text style={styles.filterChipText}>Status</Text>
                    <Ionicons name="chevron-down" size={moderateScale(12)} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.filterChip}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="calendar-outline" size={moderateScale(16)} color="#666" />
                    <Text style={styles.filterChipText}>Date</Text>
                </TouchableOpacity>
            </View>

            {/* Tournament Cards */}
            <View style={styles.tournamentsList}>
                {/* Card 1 */}
                <View style={styles.tournamentCard}>
                    <View style={styles.tournamentImagePlaceholder}>
                        <Ionicons name="tennisball" size={moderateScale(40)} color="#ccc" />
                    </View>
                    <View style={styles.tournamentContent}>
                        <Text style={styles.tournamentTag}>Padel • Registration Open</Text>
                        <Text style={styles.tournamentTitle}>Padel Championship Series</Text>
                        <Text style={styles.tournamentDetails}>5/16 Teams • 15-20 Oct • Prize: $1000</Text>

                        <TouchableOpacity style={styles.joinNowButton}>
                            <Text style={styles.joinNowText}>Join Now</Text>
                            <Ionicons name="arrow-forward" size={moderateScale(16)} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Card 2 - Featured */}
                <View style={styles.tournamentCard}>
                    <View style={[styles.tournamentImagePlaceholder, { backgroundColor: '#E8F5E9' }]}>
                        <View style={styles.featuredBadge}>
                            <Text style={styles.featuredText}>Featured</Text>
                        </View>
                        <Ionicons name="tennisball-outline" size={moderateScale(40)} color="#00C853" />
                    </View>
                    <View style={styles.tournamentContent}>
                        <Text style={styles.tournamentTag}>Tennis • In Progress</Text>
                        <Text style={styles.tournamentTitle}>Summer Grand Slam</Text>
                        <Text style={styles.tournamentDetails}>8/8 Teams • 10-14 Oct • Prize: Trophy</Text>

                        <TouchableOpacity style={styles.joinNowButton}>
                            <Text style={styles.joinNowText}>Join Now</Text>
                            <Ionicons name="arrow-forward" size={moderateScale(16)} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Card 3 */}
                <View style={styles.tournamentCard}>
                    <View style={[styles.tournamentImagePlaceholder, { backgroundColor: '#F1F8E9' }]}>
                        <Ionicons name="football-outline" size={moderateScale(40)} color="#00C853" />
                    </View>
                    <View style={styles.tournamentContent}>
                        <Text style={styles.tournamentTag}>Football • Registration Open</Text>
                        <Text style={styles.tournamentTitle}>5-a-Side City League</Text>
                        <Text style={styles.tournamentDetails}>2/12 Teams • 22-29 Nov • Prize: Medals</Text>

                        <TouchableOpacity style={styles.joinNowButton}>
                            <Text style={styles.joinNowText}>Join Now</Text>
                            <Ionicons name="arrow-forward" size={moderateScale(16)} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View style={{ height: hp(12) }} />
        </View>
    );

    const renderAllContent = () => (
        <>
            <Text style={styles.sectionTitle}>Happening Near You</Text>

            {/* Game Card 1 - BOOKED */}
            <View style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                    <Text style={styles.gameType}>Doubles - Regular</Text>
                    <TouchableOpacity>
                        <Ionicons name="bookmark-outline" size={moderateScale(22)} color="#757575" />
                    </TouchableOpacity>
                </View>

                <View style={styles.gameCardBody}>
                    <View style={styles.playerIconContainer}>
                        <View style={[styles.playerIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="person" size={moderateScale(24)} color="#FF9800" />
                        </View>
                        <Text style={styles.playersGoing}>2 Going</Text>
                    </View>

                    <View style={styles.gameInfo}>
                        <Text style={styles.gameHost}>GameTime By Playo | 396.33K Karma</Text>
                        <Text style={styles.gameDateTime}>Sun 16 Nov, 7:00 PM</Text>

                        <View style={styles.locationRowContainer}>
                            <Ionicons name="location-outline" size={moderateScale(16)} color="#757575" />
                            <Text style={styles.locationDetails} numberOfLines={1}>
                                PicklePlex - Pickleball Madhapur, ...
                            </Text>
                            <Text style={styles.distance}>~11.18{'\n'}kms</Text>
                        </View>

                        <View style={styles.gameFooter}>
                            <View style={styles.skillLevelContainer}>
                                <Ionicons name="person-outline" size={moderateScale(16)} color="#757575" />
                                <Text style={styles.skillLevel}>Beginner - Professional</Text>
                            </View>

                            <View style={styles.bookedButton}>
                                <Text style={styles.bookedButtonText}>BOOKED</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Game Card 2 - BOOK */}
            <View style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                    <Text style={styles.gameType}>Doubles - Regular</Text>
                    <TouchableOpacity>
                        <Ionicons name="bookmark-outline" size={moderateScale(22)} color="#757575" />
                    </TouchableOpacity>
                </View>

                <View style={styles.gameCardBody}>
                    <View style={styles.playerIconContainer}>
                        <View style={[styles.playerIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="people" size={moderateScale(24)} color="#FF9800" />
                        </View>
                        <Text style={styles.playersGoing}>1/7 Going</Text>
                    </View>

                    <View style={styles.gameInfo}>
                        <Text style={styles.gameHost}>GameTime By Playo | 396.33K Karma</Text>
                        <Text style={styles.gameDateTime}>Sun 16 Nov, 7:00 PM</Text>

                        <View style={styles.locationRowContainer}>
                            <Ionicons name="location-outline" size={moderateScale(16)} color="#757575" />
                            <Text style={styles.locationDetails} numberOfLines={1}>
                                Tightend Arena, KPHB Road No. 1,...
                            </Text>
                            <Text style={styles.distance}>~12.08{'\n'}kms</Text>
                        </View>

                        <View style={styles.gameFooter}>
                            <View style={styles.priceContainer}>
                                <Ionicons name="cash-outline" size={moderateScale(16)} color="#757575" />
                                <Text style={styles.price}>₹ 119 <Text style={styles.priceOld}>₹ 59.5</Text></Text>
                            </View>

                            <TouchableOpacity style={styles.bookButton}>
                                <Text style={styles.bookButtonText}>BOOK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom spacing for tab bar */}
            <View style={{ height: hp(12) }} />
        </>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.locationContainer}
                    onPress={() => setShowCityModal(true)}
                >
                    <Text style={styles.locationMain}>{displayCity}, {displayState},</Text>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationSub}>India</Text>
                        <Ionicons name="chevron-down" size={moderateScale(16)} color="#333" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="menu-outline" size={moderateScale(24)} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={moderateScale(24)} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        onPress={() => navigation.navigate('PlayerProfile')}
                    >
                        <Ionicons name="person-circle-outline" size={moderateScale(36)} color="#DDD" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={styles.tab}
                            onPress={() => setSelectedTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                selectedTab === tab && styles.tabTextActive
                            ]}>
                                {tab}
                            </Text>
                            {selectedTab === tab && <View style={styles.tabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content Switcher */}
            {selectedTab === 'All' ? (
                <>
                    {/* Sports Pills - Only show on 'All' tab */}
                    <View style={styles.sportsWrapper}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.sportsContent}
                        >
                            {availableSports.map((sport) => {
                                const isActive = selectedSport === sport.name;
                                return (
                                    <TouchableOpacity
                                        key={sport.name}
                                        style={[
                                            styles.sportPill,
                                            { backgroundColor: isActive ? sport.color : sport.bgColor }
                                        ]}
                                        onPress={() => setSelectedSport(sport.name)}
                                    >
                                        <Ionicons
                                            name="people-outline"
                                            size={moderateScale(18)}
                                            color={isActive ? '#fff' : sport.color}
                                        />
                                        <Text style={[
                                            styles.sportPillText,
                                            { color: isActive ? '#fff' : sport.color }
                                        ]}>
                                            {sport.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Filter Buttons - Only show on 'All' tab */}
                    <View style={styles.filterContainer}>
                        <TouchableOpacity style={styles.filterButton}>
                            <Ionicons name="options-outline" size={moderateScale(20)} color="#333" />
                            <Text style={styles.filterButtonText}>Filter</Text>
                            <Ionicons name="chevron-down" size={moderateScale(14)} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.filterButton}>
                            <Ionicons name="time-outline" size={moderateScale(20)} color="#333" />
                            <Text style={styles.filterButtonText}>Time</Text>
                            <Ionicons name="chevron-down" size={moderateScale(14)} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.filterButton}>
                            <Ionicons name="bar-chart-outline" size={moderateScale(20)} color="#333" />
                            <View>
                                <Text style={styles.filterButtonText}>Skill</Text>
                                <Text style={styles.filterButtonText}>Level</Text>
                            </View>
                            <Ionicons name="chevron-down" size={moderateScale(14)} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.contentContainer}
                    >
                        {renderAllContent()}
                    </ScrollView>
                </>
            ) : selectedTab === 'Tournaments' ? (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.contentContainer}
                >
                    {renderTournamentsContent()}
                </ScrollView>
            ) : (
                <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#999', fontSize: 16 }}>Coming Soon</Text>
                </View>
            )}

            {/* City Selection Modal */}
            <Modal
                visible={showCityModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCityModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCityModal(false)}
                >
                    <View style={styles.cityModal}>
                        <View style={styles.cityModalHeader}>
                            <Text style={styles.cityModalTitle}>Select City</Text>
                            <TouchableOpacity onPress={() => setShowCityModal(false)}>
                                <Ionicons name="close" size={moderateScale(24)} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.cityList} showsVerticalScrollIndicator={false}>
                            {availableCities.map((city) => (
                                <TouchableOpacity
                                    key={city.id}
                                    style={[
                                        styles.cityItem,
                                        displayCity === city.name && styles.cityItemActive
                                    ]}
                                    onPress={() => handleCitySelect(city.name)}
                                >
                                    <Text style={[
                                        styles.cityItemText,
                                        displayCity === city.name && styles.cityItemTextActive
                                    ]}>
                                        {city.name}
                                    </Text>
                                    {displayCity === city.name && (
                                        <Ionicons name="checkmark" size={moderateScale(20)} color="#00C853" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Mock Full Screen Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: wp(5), borderBottomWidth: 1, borderColor: '#eee' }}>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Ionicons name="close" size={30} color="#000" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginLeft: 15 }}>Filters</Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#666', fontSize: 16 }}>Full Screen Filters Implementation</Text>
                    </View>
                    <TouchableOpacity
                        style={{ margin: wp(5), backgroundColor: '#00C853', padding: 15, borderRadius: 10, alignItems: 'center' }}
                        onPress={() => setShowFilterModal(false)}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Apply Filters</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        backgroundColor: '#FFFFFF',
    },
    locationContainer: {
        flex: 1,
    },
    locationMain: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationSub: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#1A1A1A',
        marginRight: wp(1),
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    iconButton: {
        padding: wp(1),
    },
    avatarButton: {
        marginLeft: wp(1),
    },
    tabsWrapper: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tabsContent: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        gap: wp(8),
    },
    tab: {
        paddingBottom: hp(0.8),
        position: 'relative',
    },
    tabText: {
        fontSize: fontScale(15),
        color: '#757575',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#00C853',
        fontWeight: '600',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#00C853',
        borderRadius: 2,
    },
    sportsWrapper: {
        backgroundColor: '#FFFFFF',
        paddingVertical: hp(2),
    },
    sportsContent: {
        paddingHorizontal: wp(5),
        gap: wp(2.5),
    },
    sportPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4.5),
        paddingVertical: hp(1.2),
        borderRadius: moderateScale(25),
        gap: wp(2),
    },
    sportPillText: {
        fontSize: fontScale(15),
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        gap: wp(2.5),
        backgroundColor: '#FFFFFF',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(3.5),
        paddingVertical: hp(1.2),
        borderRadius: moderateScale(10),
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        gap: wp(1.5),
    },
    filterButtonText: {
        fontSize: fontScale(14),
        color: '#424242',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: wp(5),
    },
    sectionTitle: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: hp(2.5),
        marginBottom: hp(2),
    },
    gameCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(16),
        padding: wp(4.5),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    gameCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    gameType: {
        fontSize: fontScale(13),
        color: '#757575',
        fontWeight: '500',
    },
    gameCardBody: {
        flexDirection: 'row',
        gap: wp(4),
    },
    playerIconContainer: {
        alignItems: 'center',
        gap: hp(1),
    },
    playerIcon: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        justifyContent: 'center',
        alignItems: 'center',
    },
    playersGoing: {
        fontSize: fontScale(13),
        fontWeight: '700',
        color: '#1A1A1A',
    },
    gameInfo: {
        flex: 1,
    },
    gameHost: {
        fontSize: fontScale(13),
        color: '#757575',
        marginBottom: hp(0.8),
    },
    gameDateTime: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: hp(1.2),
    },
    locationRowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(1.5),
        marginBottom: hp(1.5),
    },
    locationDetails: {
        flex: 1,
        fontSize: fontScale(13),
        color: '#616161',
    },
    distance: {
        fontSize: fontScale(11),
        color: '#9E9E9E',
        textAlign: 'right',
        lineHeight: fontScale(14),
    },
    gameFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skillLevelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5),
    },
    skillLevel: {
        fontSize: fontScale(13),
        color: '#616161',
        fontWeight: '500',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5),
    },
    price: {
        fontSize: fontScale(14),
        fontWeight: '700',
        color: '#1A1A1A',
    },
    priceOld: {
        fontSize: fontScale(12),
        textDecorationLine: 'line-through',
        color: '#9E9E9E',
        fontWeight: '400',
    },
    bookedButton: {
        paddingHorizontal: wp(7),
        paddingVertical: hp(1),
        borderRadius: moderateScale(8),
        backgroundColor: '#E8E8E8',
    },
    bookedButtonText: {
        fontSize: fontScale(13),
        fontWeight: '700',
        color: '#757575',
        letterSpacing: 0.5,
    },
    bookButton: {
        paddingHorizontal: wp(7),
        paddingVertical: hp(1),
        borderRadius: moderateScale(8),
        backgroundColor: '#00C853',
    },
    bookButtonText: {
        fontSize: fontScale(13),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    // City Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    cityModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        maxHeight: hp(70),
        paddingBottom: hp(2),
    },
    cityModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    cityModalTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: '#1A1A1A',
    },
    cityList: {
        paddingHorizontal: wp(5),
    },
    cityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    cityItemActive: {
        backgroundColor: '#F0FFF4',
    },
    cityItemText: {
        fontSize: fontScale(16),
        color: '#424242',
        fontWeight: '500',
    },
    cityItemTextActive: {
        color: '#00C853',
        fontWeight: '600',
    },
    // Tournaments Styles
    tournamentsContainer: {
        paddingTop: hp(2),
    },
    tournamentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        marginBottom: hp(2),
        zIndex: 10,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    dropdownText: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#1A1A1A',
    },
    dropdownListContainer: {
        position: 'absolute',
        top: hp(6),
        left: wp(5),
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100,
        paddingVertical: hp(1),
        width: wp(40),
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(4),
    },
    dropdownItemText: {
        fontSize: fontScale(15),
        color: '#424242',
    },
    dropdownItemTextActive: {
        color: '#00C853',
        fontWeight: '600',
    },
    createTournamentHeaderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00C853', // Green brand color
        paddingHorizontal: wp(3.5),
        paddingVertical: hp(0.8),
        borderRadius: moderateScale(20),
        gap: wp(1),
    },
    createTournamentHeaderText: {
        fontSize: fontScale(14),
        color: '#FFFFFF',
        fontWeight: '600',
    },
    filtersRow: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        gap: wp(3),
        marginBottom: hp(2.5),
        zIndex: 1,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: moderateScale(8),
        gap: wp(1),
    },
    filterChipText: {
        fontSize: fontScale(13),
        color: '#1A1A1A',
        fontWeight: '500',
    },
    tournamentsList: {
        width: '100%',
    },
    tournamentCard: {
        backgroundColor: '#FFFFFF',
        marginBottom: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        marginHorizontal: 0,
        borderRadius: 0,
        width: '100%',
    },
    tournamentImagePlaceholder: {
        height: hp(22),
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
    },
    featuredBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#FFC107',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    featuredText: {
        fontSize: fontScale(10),
        fontWeight: '700',
        color: '#1A1A1A',
    },
    tournamentContent: {
        padding: wp(4),
    },
    tournamentTag: {
        fontSize: fontScale(12),
        color: '#757575',
        marginBottom: 4,
    },
    tournamentTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    tournamentDetails: {
        fontSize: fontScale(13),
        color: '#757575',
    },
    joinNowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00C853',
        marginTop: hp(2),
        paddingVertical: hp(1.2),
        borderRadius: moderateScale(8),
        gap: wp(2),
    },
    joinNowText: {
        color: '#FFFFFF',
        fontSize: fontScale(14),
        fontWeight: '700',
    },
});

export default PlayScreen;
