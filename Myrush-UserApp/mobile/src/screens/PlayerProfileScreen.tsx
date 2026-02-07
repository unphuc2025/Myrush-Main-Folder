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
    SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

// Premium Dark Theme Colors
const THEME = {
    background: '#000000',
    surface: '#121212',
    surfaceHighlight: '#1C1C1E',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    primary: colors.primary, // #39E079 usually
    border: '#2C2C2E',
    inputBg: '#1C1C1E',
};

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
            <View style={styles.safeAreaTop} /> {/* Safe Area Background */}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Gradient & Back Button */}
                <LinearGradient
                    colors={['#1F1F1F', '#000000']}
                    style={styles.headerContainer}
                >
                    <View style={styles.headerNav}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
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
                            <Ionicons name="log-out-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>Player Profile</Text>
                        <Text style={styles.headerSubtitle}>Personalize your MyRush experience</Text>
                    </View>
                </LinearGradient>

                {/* Profile Core Info (Avatar + Name) */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitials}>
                                {fullName ? fullName.charAt(0).toUpperCase() : 'P'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.cameraBadge}>
                            <Ionicons name="camera" size={14} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Form Fields */}
                <View style={styles.formContainer}>

                    {/* Phone (Read Only) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={[styles.inputContainer, styles.readOnlyInput]}>
                            <Ionicons name="call-outline" size={20} color={THEME.textSecondary} />
                            <Text style={[styles.inputText, { color: THEME.textSecondary, marginLeft: 10 }]}>
                                {phoneNumber}
                            </Text>
                            <Ionicons name="lock-closed-outline" size={16} color={THEME.textSecondary} style={{ marginLeft: 'auto' }} />
                        </View>
                    </View>

                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={THEME.textSecondary} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter your full name"
                                placeholderTextColor={THEME.textSecondary}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                    </View>

                    {/* Age & City Row */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 0.4 }]}>
                            <Text style={styles.label}>Age</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.textInput, { textAlign: 'center' }]}
                                    placeholder="00"
                                    placeholderTextColor={THEME.textSecondary}
                                    keyboardType="number-pad"
                                    value={age}
                                    onChangeText={setAge}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 0.55 }]}>
                            <Text style={styles.label}>City</Text>
                            <TouchableOpacity
                                style={styles.inputContainer}
                                onPress={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                            >
                                <Text style={[styles.inputText, !city && { color: THEME.textSecondary }]}>
                                    {city || 'Select City'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={THEME.textSecondary} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>

                            {/* City Dropdown */}
                            {isCityDropdownOpen && (
                                <View style={styles.dropdownList}>
                                    {cities.map((c) => (
                                        <TouchableOpacity
                                            key={c.id}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setCity(c.name);
                                                setCityId(c.id);
                                                setIsCityDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Gender */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Gender</Text>
                        <View style={styles.chipRow}>
                            {genders.map(g => renderChip(g, gender === g, () => setGender(g)))}
                        </View>
                    </View>

                    {/* Handedness */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Handedness</Text>
                        <View style={styles.chipRow}>
                            {handednessOptions.map(h => renderChip(h, handedness === h, () => setHandedness(h)))}
                        </View>
                    </View>

                    {/* Skill Level */}
                    <View style={styles.section}>
                        <View style={styles.iconHeader}>
                            <Ionicons name="star" size={16} color={THEME.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.sectionHeader}>Skill Level</Text>
                        </View>
                        <View style={styles.chipRow}>
                            {skillLevels.map(s => renderChip(s, skillLevel === s, () => setSkillLevel(s)))}
                        </View>
                    </View>

                    {/* Playing Style */}
                    <View style={styles.section}>
                        <View style={styles.iconHeader}>
                            <Ionicons name="flash" size={16} color={THEME.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.sectionHeader}>Playing Style</Text>
                        </View>
                        <View style={styles.chipRow}>
                            {playingStyles.map(p => renderChip(p, playingStyle === p, () => setPlayingStyle(p)))}
                        </View>
                    </View>

                    {/* Favorite Sports */}
                    <View style={styles.section}>
                        <View style={styles.iconHeader}>
                            <Ionicons name="heart" size={16} color="#FF4081" style={{ marginRight: 6 }} />
                            <Text style={styles.sectionHeader}>Favorite Sports</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                        >
                            <Text style={[styles.inputText, selectedSports.length === 0 && { color: THEME.textSecondary }]}>
                                {selectedSports.length > 0 ? selectedSports.join(', ') : 'Select Sports'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={THEME.textSecondary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        {isSportsDropdownOpen && (
                            <View style={styles.dropdownList}>
                                {gameTypes.map((g) => (
                                    <TouchableOpacity
                                        key={g.id}
                                        style={styles.dropdownItem}
                                        onPress={() => toggleSelection(g.name, selectedSports, setSelectedSports)}
                                    >
                                        <Text style={styles.dropdownItemText}>{g.name}</Text>
                                        {selectedSports.includes(g.name) && (
                                            <Ionicons name="checkmark" size={18} color={THEME.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleContinue}
                    disabled={isSaving}
                >
                    <LinearGradient
                        colors={[THEME.primary, '#32C76A']}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.saveButtonText}>{isSaving ? 'SAVING...' : 'SAVE PROFILE'}</Text>
                        {!isSaving && <Ionicons name="arrow-forward" size={20} color="#000" />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    safeAreaTop: {
        height: Platform.OS === 'ios' ? 40 : 0, // Simplified safe area
        backgroundColor: '#1F1F1F',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitles: {
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: THEME.textSecondary,
    },
    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginTop: -50,
        marginBottom: 20,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1C1C1E',
        borderWidth: 3,
        borderColor: THEME.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'rgba(57, 224, 121, 0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    avatarInitials: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFF',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    // Form
    formContainer: {
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: THEME.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.inputBg,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    readOnlyInput: {
        opacity: 0.7,
        backgroundColor: '#111',
    },
    textInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        height: '100%',
        marginLeft: 10,
    },
    inputText: {
        color: '#FFF',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    // Dropdown
    dropdownList: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: '#252525',
        borderRadius: 12,
        padding: 5,
        zIndex: 100,
        borderWidth: 1,
        borderColor: '#444',
        shadowColor: '#000',
        elevation: 5,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    dropdownItemText: {
        color: '#FFF',
        fontSize: 14,
    },
    // Chips & Sections
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: THEME.surfaceHighlight,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    chipSelected: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    chipText: {
        color: THEME.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    chipTextSelected: {
        color: '#000',
        fontWeight: 'bold',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    saveButton: {
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

export default PlayerProfileScreen;
