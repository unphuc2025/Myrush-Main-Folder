import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Dimensions,
    Platform,
    Image,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { profileApi, City, GameType } from '../api/profile';

const { width } = Dimensions.get('window');

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

const PlayerProfileScreen = () => {
    const navigation = useNavigation<RootNavigation>();
    const { user, logout } = useAuthStore();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [city, setCity] = useState('');
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [gender, setGender] = useState('');
    const [handedness, setHandedness] = useState('Right-handed');
    const [skillLevel, setSkillLevel] = useState('');
    const [selectedSports, setSelectedSports] = useState<string[]>([]);
    const [playingStyle, setPlayingStyle] = useState('All-court');
    const [isSaving, setIsSaving] = useState(false);

    const [cities, setCities] = useState<City[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [cityId, setCityId] = useState<string | null>(null);
    const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);

    const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    const handednessOptions = ['Right-handed', 'Left-handed', 'Ambidextrous'];
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
    const playingStyles = ['Dinker', 'Banger', 'All-court', 'Net Player', 'Baseline'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [citiesRes, gameTypesRes, profileRes] = await Promise.all([
                    profileApi.getCities(),
                    profileApi.getGameTypes(),
                    profileApi.getProfile(user?.phoneNumber || ''),
                ]);

                if (citiesRes.success) setCities(citiesRes.data);
                if (gameTypesRes.success) setGameTypes(gameTypesRes.data);

                // Populate profile data if it exists
                if (profileRes.success && profileRes.data) {
                    const data = profileRes.data;
                    setPhoneNumber(data.phone_number || user?.phoneNumber || '');
                    setFullName(data.full_name || '');
                    setAge(data.age ? data.age.toString() : '');
                    setCity(data.city || '');
                    setGender(data.gender || '');
                    setHandedness(data.handedness || 'Right-handed');
                    setSkillLevel(data.skill_level || '');
                    setSelectedSports(data.sports || []);
                    setPlayingStyle(data.playing_style || 'All-court');
                } else {
                    // If no profile data, set phone number from user store
                    setPhoneNumber(user?.phoneNumber || '');
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchData();
    }, [user?.phoneNumber]);

    const toggleSelection = (item: string, currentSelection: string[], setSelection: (val: string[]) => void) => {
        if (currentSelection.includes(item)) {
            setSelection(currentSelection.filter(i => i !== item));
        } else {
            setSelection([...currentSelection, item]);
        }
    };

    const renderChip = (label: string, isSelected: boolean, onPress: () => void) => (
        <TouchableOpacity
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={onPress}
            key={label}
        >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );

    const handleContinue = async () => {
        if (!fullName.trim() || !age.trim() || !city.trim()) {
            Alert.alert('Incomplete profile', 'Please enter your full name, age, and city/town.');
            return;
        }

        // Get phone number from state or user store
        const finalPhoneNumber = phoneNumber || user?.phoneNumber;
        if (!finalPhoneNumber) {
            Alert.alert(
                'Missing phone number',
                'We could not find your phone number. Please log in again to continue.'
            );
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        try {
            const ageNumber = parseInt(age, 10);

            // Check if this is a new user (has tempOTP)
            const tempOTP = (useAuthStore.getState() as any).tempOTP;

            if (tempOTP) {
                // New user - call verify-otp WITH profile data to create user
                console.log('[PlayerProfile] New user - calling verify-otp with profile data');
                const { otpApi } = require('../api/otp');

                const profileData = {
                    full_name: fullName.trim(),
                    age: Number.isNaN(ageNumber) ? undefined : ageNumber,
                    city,
                    city_id: cityId,
                    gender: gender || undefined,
                    handedness,
                    skill_level: skillLevel || undefined,
                    sports: selectedSports,
                    playing_style: playingStyle,
                };

                // Call verify-otp with profile data
                const response = await otpApi.verifyOTPWithProfile(finalPhoneNumber, tempOTP, profileData);

                if (!response?.success || !response?.access_token) {
                    Alert.alert('Error', response?.message || 'Failed to create account. Please try again.');
                    setIsSaving(false);
                    return;
                }

                // Clear temp OTP
                useAuthStore.setState({ tempOTP: undefined });

                // Login with the received token
                const { setAuthSuccess } = useAuthStore.getState();
                if (response.access_token) {
                    await setAuthSuccess(response.access_token);
                } else {
                    throw new Error('No access token received');
                }

                Alert.alert('Success', 'Welcome to MyRush!');
                // Navigation will be handled by AppNavigator based on auth state
            } else {
                // Existing user - update profile
                const payload = {
                    phoneNumber: finalPhoneNumber,
                    fullName: fullName.trim(),
                    age: Number.isNaN(ageNumber) ? undefined : ageNumber,
                    city,
                    city_id: cityId,
                    gender: gender || undefined,
                    handedness,
                    skillLevel: skillLevel || undefined,
                    sports: selectedSports,
                    playingStyle,
                };

                const response = await profileApi.saveProfile(payload);
                if (!response?.success) {
                    Alert.alert('Error', response?.message || 'Failed to save profile. Please try again.');
                    setIsSaving(false);
                    return;
                }

                // On success, navigate back to the main tab navigator.
                // The initial tab in MainTabs is "Home", so this effectively
                // takes the user to the Home dashboard.
                navigation.navigate('MainTabs');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Something went wrong while saving your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <ImageBackground
                        source={require('../../assets/login-image.png')} // Using existing image as placeholder
                        style={styles.headerImage}
                        resizeMode="cover"
                    >
                        <LinearGradient
                            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                            style={styles.headerGradient}
                        />
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={moderateScale(24)} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={async () => {
                                Alert.alert(
                                    'Logout',
                                    'Are you sure you want to logout?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Logout',
                                            style: 'destructive',
                                            onPress: async () => {
                                                await logout();
                                                navigation.reset({
                                                    index: 0,
                                                    routes: [{ name: 'OTPLogin' }],
                                                });
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="log-out-outline" size={moderateScale(24)} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Let's build your player profile</Text>
                            <Text style={styles.headerSubtitle}>Personalize training, games, and tournaments for you!</Text>
                        </View>
                    </ImageBackground>
                </View>

                {/* Profile Info Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person-outline" size={moderateScale(30)} color={colors.primary} />
                            </View>
                            <TouchableOpacity style={styles.cameraButton}>
                                <Ionicons name="camera" size={moderateScale(14)} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.mainInputs}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={moderateScale(18)} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.inputReadOnly]}
                                    placeholder="Phone number"
                                    placeholderTextColor="#999"
                                    value={phoneNumber}
                                    editable={false}
                                />
                                <Ionicons name="lock-closed-outline" size={moderateScale(14)} color="#999" />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={moderateScale(18)} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full name"
                                    placeholderTextColor="#999"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                            <View style={styles.rowInputs}>
                                <View style={[styles.inputWrapper, { flex: 0.4, marginRight: wp(2) }]}>
                                    <TextInput
                                        style={[styles.input, { textAlign: 'center' }]}
                                        placeholder="Age"
                                        placeholderTextColor="#999"
                                        keyboardType="number-pad"
                                        value={age}
                                        onChangeText={setAge}
                                    />
                                </View>
                                <View style={[styles.inputWrapper, { flex: 0.6 }]}>
                                    <TouchableOpacity
                                        style={styles.cityDropdown}
                                        onPress={() => setIsCityDropdownOpen(prev => !prev)}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.cityDropdownText,
                                                !city && styles.cityDropdownPlaceholder,
                                            ]}
                                        >
                                            {city || 'Select City / Town'}
                                        </Text>
                                        <Ionicons
                                            name={isCityDropdownOpen ? 'chevron-up' : 'chevron-down'}
                                            size={moderateScale(18)}
                                            color="#999"
                                        />
                                    </TouchableOpacity>
                                    {isCityDropdownOpen && (
                                        <View style={styles.cityDropdownOptions}>
                                            {cities.map(c => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    style={styles.cityOption}
                                                    onPress={() => {
                                                        setCity(c.name);
                                                        setCityId(c.id);
                                                        setIsCityDropdownOpen(false);
                                                    }}
                                                >
                                                    <Text style={styles.cityOptionText}>{c.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Gender Section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Gender</Text>
                    <View style={styles.chipContainer}>
                        {genders.map(g => renderChip(g, gender === g, () => setGender(g)))}
                    </View>
                </View>

                {/* Handedness Section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Handedness</Text>
                    <View style={styles.chipContainer}>
                        {handednessOptions.map(h => renderChip(h, handedness === h, () => setHandedness(h)))}
                    </View>
                </View>

                {/* Skill Level Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.titleRow}>
                        <Ionicons name="star-outline" size={moderateScale(18)} color="#FFA000" style={{ marginRight: 5 }} />
                        <Text style={styles.sectionTitle}>Skill level</Text>
                    </View>
                    <View style={styles.chipContainer}>
                        {skillLevels.map(s => renderChip(s, skillLevel === s, () => setSkillLevel(s)))}
                    </View>
                </View>

                {/* Favorite Sports Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.titleRow}>
                        <Ionicons name="heart-outline" size={moderateScale(18)} color="#FF4081" style={{ marginRight: 5 }} />
                        <Text style={styles.sectionTitle}>Favorite sports</Text>
                    </View>
                    <View style={styles.sportsDropdown}>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                        >
                            <Text style={selectedSports.length > 0 ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                                {selectedSports.length > 0 ? selectedSports.join(', ') : 'Select sports'}
                            </Text>
                            <Ionicons name={isSportsDropdownOpen ? 'chevron-up' : 'chevron-down'} size={moderateScale(18)} color="#999" />
                        </TouchableOpacity>
                        {isSportsDropdownOpen && (
                            <View style={styles.sportsDropdownOptions}>
                                {gameTypes.map(g => (
                                    <TouchableOpacity
                                        key={g.id}
                                        style={styles.sportsOption}
                                        onPress={() => toggleSelection(g.name, selectedSports, setSelectedSports)}
                                    >
                                        <Text style={styles.sportsOptionText}>{g.name}</Text>
                                        <View style={styles.checkbox}>
                                            {selectedSports.includes(g.name) && <Ionicons name="checkmark" size={moderateScale(16)} color={colors.primary} />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Playing Style Section */}
                <View style={[styles.sectionCard, { marginBottom: hp(10) }]}>
                    <View style={styles.titleRow}>
                        <Ionicons name="flash-outline" size={moderateScale(18)} color={colors.primary} style={{ marginRight: 5 }} />
                        <Text style={styles.sectionTitle}>Playing style</Text>
                    </View>
                    <View style={styles.chipContainer}>
                        {playingStyles.map(p => renderChip(p, playingStyle === p, () => setPlayingStyle(p)))}
                    </View>
                </View>

            </ScrollView>

            {/* Continue Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={isSaving}
                >
                    <Text style={styles.continueButtonText}>
                        {isSaving ? 'Saving...' : 'Continue'}
                    </Text>
                    {!isSaving && (
                        <Ionicons name="chevron-forward" size={moderateScale(20)} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        paddingBottom: hp(5),
    },
    headerContainer: {
        height: hp(25),
        width: width,
        marginBottom: hp(2),
    },
    headerImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    headerContent: {
        padding: wp(5),
        paddingBottom: hp(4),
    },
    headerTitle: {
        color: '#fff',
        fontSize: fontScale(18),
        fontWeight: 'bold',
        marginBottom: hp(0.5),
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: fontScale(12),
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? hp(6) : hp(4),
        left: wp(5),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    logoutButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? hp(6) : hp(4),
        right: wp(5),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    sectionContainer: {
        paddingHorizontal: wp(4),
        marginTop: -hp(5),
    },
    profileHeader: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(20),
        padding: wp(4),
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: hp(2),
    },
    avatarContainer: {
        position: 'relative',
        marginRight: wp(4),
    },
    avatarPlaceholder: {
        width: wp(18),
        height: wp(18),
        borderRadius: wp(9),
        backgroundColor: colors.brand.light,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: wp(7),
        height: wp(7),
        borderRadius: wp(3.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    mainInputs: {
        flex: 1,
    },
    inputWrapper: {
        backgroundColor: '#F5F7FA',
        borderRadius: moderateScale(10),
        paddingHorizontal: wp(3),
        height: hp(5.5),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    rowInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputIcon: {
        marginRight: wp(2),
    },
    input: {
        flex: 1,
        fontSize: fontScale(14),
        color: '#333',
    },
    inputReadOnly: {
        color: '#999',
    },
    cityDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    cityDropdownText: {
        fontSize: fontScale(14),
        color: '#333',
    },
    cityDropdownPlaceholder: {
        color: '#999',
    },
    cityDropdownOptions: {
        marginTop: hp(0.5),
        backgroundColor: '#fff',
        borderRadius: moderateScale(10),
        paddingVertical: hp(0.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    cityOption: {
        paddingVertical: hp(0.8),
        paddingHorizontal: wp(3),
    },
    cityOptionText: {
        fontSize: fontScale(13),
        color: '#333',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(20),
        padding: wp(5),
        marginHorizontal: wp(4),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#333',
        marginBottom: hp(2),
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },
    chip: {
        backgroundColor: '#F5F7FA',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: moderateScale(20),
        marginBottom: hp(1),
    },
    chipSelected: {
        backgroundColor: colors.primary,
    },
    chipText: {
        fontSize: fontScale(12),
        color: '#666',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: wp(5),
        paddingBottom: Platform.OS === 'ios' ? hp(4) : wp(5),
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    continueButton: {
        backgroundColor: colors.primary,
        height: hp(6.5),
        borderRadius: moderateScale(30),
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: fontScale(16),
        fontWeight: '600',
        marginRight: wp(1),
    },
    sportsDropdown: {
    },
    dropdownButton: {
        backgroundColor: '#F5F7FA',
        borderRadius: moderateScale(10),
        paddingHorizontal: wp(3),
        height: hp(5.5),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownSelectedText: {
        fontSize: fontScale(14),
        color: '#333',
    },
    dropdownPlaceholderText: {
        fontSize: fontScale(14),
        color: '#999',
    },
    sportsDropdownOptions: {
        marginTop: hp(0.5),
        backgroundColor: '#fff',
        borderRadius: moderateScale(10),
        paddingVertical: hp(0.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    sportsOption: {
        paddingVertical: hp(0.8),
        paddingHorizontal: wp(3),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sportsOptionText: {
        fontSize: fontScale(13),
        color: '#333',
    },
    checkbox: {
        width: moderateScale(20),
        height: moderateScale(20),
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: moderateScale(4),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

export default PlayerProfileScreen;
