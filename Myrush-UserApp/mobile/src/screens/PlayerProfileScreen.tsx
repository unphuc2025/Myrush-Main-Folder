import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Dimensions,
    Alert,
    SafeAreaView,
    Platform,
    Image,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { profileApi, City, GameType } from '../api/profile';
import { otpApi } from '../api/otp';
import { apiClient } from '../api/apiClient';

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
    const insets = useSafeAreaInsets();
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

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'city' | 'sports' | null>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [pendingAvatarAsset, setPendingAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

    const detectLocation = async () => {
        setIsLocating(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                setIsLocating(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            let address = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (address && address.length > 0) {
                const detectedCity = address[0].city || address[0].subregion;
                if (detectedCity) {
                    setCity(detectedCity);

                    // Try to match with existing city list to set ID if possible
                    const matchedCity = cities.find(c => c.name.toLowerCase() === detectedCity.toLowerCase());
                    if (matchedCity) {
                        setCityId(matchedCity.id);
                    } else {
                        setCityId(null); // Custom city
                    }
                    Alert.alert('Location Detected', `Set city to ${detectedCity}`);
                } else {
                    Alert.alert('Error', 'Could not detect city name from location.');
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to get current location.');
        } finally {
            setIsLocating(false);
        }
    };

    const openModal = (type: 'city' | 'sports') => {
        setModalType(type);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setModalType(null);
    };

    const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    const handednessOptions = ['Right-handed', 'Left-handed', 'Ambidextrous'];
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
    const playingStyles = ['Dinker', 'Banger', 'All-court', 'Net Player', 'Baseline'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if new user (has tempOTP)
                const tempOTP = (useAuthStore.getState() as any).tempOTP;

                // Prepare promises array
                const distinctPromises = [
                    profileApi.getCities().catch(err => ({ success: false, data: [], error: err })),
                    profileApi.getGameTypes().catch(err => ({ success: false, data: [], error: err }))
                ];

                // Only fetch profile if NOT a new user
                if (!tempOTP) {
                    distinctPromises.push(
                        profileApi.getProfile(user?.phoneNumber || '').catch(err => ({ success: false, data: null, error: err }))
                    );
                }

                const results = await Promise.all(distinctPromises);

                const citiesRes = results[0];
                const gameTypesRes = results[1];
                const profileRes = !tempOTP ? results[2] : { success: false, data: null };

                if (citiesRes?.success) setCities(citiesRes.data || []);
                if (gameTypesRes?.success) setGameTypes(gameTypesRes.data || []);

                // Populate profile data if it exists (Existing User)
                if (profileRes?.success && profileRes?.data) {
                    const data = profileRes.data;
                    setPhoneNumber(data.phone_number || user?.phoneNumber || '');
                    setFullName(data.full_name || '');
                    setAge(data.age ? data.age.toString() : '');
                    setCity(data.city || '');
                    setCityId(data.city_id || null);
                    setGender(data.gender || '');
                    setHandedness(data.handedness || 'Right-handed');
                    setSkillLevel(data.skill_level || '');
                    setSelectedSports(data.sports || []);
                    setPlayingStyle(data.playing_style || 'All-court');
                    setAvatarUrl(data.avatar_url || user?.avatarUrl || null);
                } else {
                    // New User or Profile Fetch Failed -> Pre-fill defaults
                    setPhoneNumber(user?.phoneNumber || '');
                    setAvatarUrl(user?.avatarUrl || null);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
                setPhoneNumber(user?.phoneNumber || '');
            }
        };

        fetchData();
    }, [user?.phoneNumber]);


    const handleImagePick = async () => {
        console.log('[PlayerProfile] handleImagePick called');
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('[PlayerProfile] permission status:', permissionResult.status);

            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "You need to allow access to your photos to upload a profile picture.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            console.log('[PlayerProfile] Picker result:', result.canceled ? 'Canceled' : 'Asset selected');

            if (!result.canceled) {
                const asset = result.assets[0];

                // Check if user is NEW (has tempOTP). If so, defer upload.
                const tempOTP = (useAuthStore.getState() as any).tempOTP;
                console.log('[PlayerProfile] User is new?', !!tempOTP);

                if (tempOTP) {
                    // Determine URI for preview
                    const uri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
                    setAvatarUrl(uri); // Show preview
                    setPendingAvatarAsset(asset); // Save for later upload
                    console.log('[PlayerProfile] Deferred upload for new user');
                } else {
                    // Existing user - upload immediately
                    await uploadImage(asset);
                }
            }
        } catch (error: any) {
            console.error('[PlayerProfile] Error parsing image picker:', error);
            Alert.alert("Error", "Could not open gallery. Please check your permissions.");
        }
    };

    const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
        // If pending upload, likely part of larger save, so don't double toggle loading if already loading
        const wasSaving = isSaving;
        if (!wasSaving) setIsSaving(true);

        try {
            const formData = new FormData();
            const uri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
            const filename = asset.uri.split('/').pop() || 'avatar.jpg';

            // Robust MIME type detection
            let type = 'image/jpeg';
            if (filename.endsWith('.png')) type = 'image/png';
            else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) type = 'image/jpeg';

            console.log(`[PlayerProfile] preparing upload: ${uri} (${type})`);

            formData.append('file', {
                uri,
                name: filename,
                type,
            } as any);

            // profileApi is statically imported — dynamic require() fails under Hermes (APK)
            const response = await profileApi.uploadAvatar(formData);

            if (response.success) {
                setAvatarUrl(response.data.avatar_url);
                // REFRESH AUTH STORE silently so Dashboard gets the new image without navigation reset
                await useAuthStore.getState().checkAuth(true);
                Alert.alert("Success", "Profile picture updated!");
            } else {
                Alert.alert("Upload Failed", "Could not upload image.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to upload image.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

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

        // 1. Name Validation
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (fullName.trim().length < 3) {
            Alert.alert('Invalid Name', 'Full name must be at least 3 characters long.');
            return;
        }
        if (!nameRegex.test(fullName.trim())) {
            Alert.alert('Invalid Name', 'Name should only contain letters and spaces.');
            return;
        }

        // 2. Age Validation
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
            Alert.alert('Invalid Age', 'You must be between 13 and 100 years old.');
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
                // otpApi is statically imported — dynamic require() fails under Hermes (APK)

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
                if (response.access_token) {
                    // Manually set token first to allow avatar upload
                    // apiClient is statically imported — dynamic require() fails under Hermes (APK)
                    await apiClient.setToken(response.access_token);

                    // NOW if we have a pending avatar, upload it BEFORE setting auth success (which triggers nav)
                    if (pendingAvatarAsset) {
                        try {
                            console.log('[PlayerProfile] Uploading pending avatar...');
                            await uploadImage(pendingAvatarAsset);
                        } catch (e) {
                            console.error("Failed to upload pending avatar", e);
                        }
                    }

                    // FINALLY, update the store to trigger navigation.
                    // NOTE: Do NOT call Alert.alert() after this line — setAuthSuccess triggers
                    // isAuthenticated=true which causes AppNavigator to unmount this screen immediately.
                    // Showing an Alert on an unmounted screen causes the app to crash/close.
                    // The user lands on HomeScreen directly — no alert needed.
                    const { setAuthSuccess } = useAuthStore.getState();
                    await setAuthSuccess(response.access_token);
                } else {
                    throw new Error('No access token received');
                }
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

                // REFRESH AUTH STORE to update Dashboard with new Name/City/Avatar immediately
                await useAuthStore.getState().checkAuth();

                // On success, navigate back to the main tab navigator.
                (navigation as any).navigate('MainTabs');
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

            {/* FIXED TOP BAR */}
            <LinearGradient
                colors={['#1F1F1F', '#000000']}
                style={styles.fixedHeader}
            >
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                        if (user) {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                (navigation as any).navigate('MainTabs');
                            }
                        } else {
                            (navigation as any).replace('OTPLogin');
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.fixedHeaderTitle}>Player Profile</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Spacer for Fixed Header */}
                <View style={{ height: Platform.OS === 'android' ? 90 : 60 }} />

                <Text style={styles.pageSubtitle}>Personalize your MyRush experience</Text>

                {/* Profile Core Info (Avatar + Name) */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarWrapper} onPress={handleImagePick}>
                        <View style={styles.avatarPlaceholder}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarInitials}>
                                    {fullName ? fullName.charAt(0).toUpperCase() : 'P'}
                                </Text>
                            )}
                        </View>
                        <View style={styles.cameraBadge}>
                            <Ionicons name="camera" size={14} color="#000" />
                        </View>
                    </TouchableOpacity>
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
                    <View style={[styles.row, isCityDropdownOpen && { zIndex: 2000, elevation: 2000 }]}>
                        <View style={[styles.inputGroup, { flex: 0.3 }]}>
                            <Text style={styles.label}>Age</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.textInput, { textAlign: 'center' }]}
                                    placeholder="00"
                                    placeholderTextColor={THEME.textSecondary}
                                    keyboardType="number-pad"
                                    value={age}
                                    onChangeText={setAge}
                                    maxLength={2}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 0.65 }]}>
                            <Text style={styles.label}>City/Town</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="location-outline" size={20} color={THEME.textSecondary} />
                                <TouchableOpacity
                                    style={{ flex: 1, paddingLeft: 10, justifyContent: 'center' }}
                                    onPress={() => openModal('city')}
                                >
                                    <Text style={[styles.inputText, !city && { color: THEME.textSecondary }]}>
                                        {city || 'Select City'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={detectLocation} disabled={isLocating} style={{ padding: 4 }}>
                                    {isLocating ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Ionicons name="locate" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
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
                        onPress={() => openModal('sports')}
                    >
                        <Text style={[styles.inputText, selectedSports.length === 0 && { color: THEME.textSecondary }]}>
                            {selectedSports.length > 0 ? selectedSports.join(', ') : 'Select Sports'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={THEME.textSecondary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 20 : Math.max(20, insets.bottom + 10) }]}>
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

            {/* SELECTION MODAL */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {modalType === 'city' ? 'Select City' : 'Select Sports'}
                            </Text>
                            <FlatList
                                data={modalType === 'city' ? cities : gameTypes}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            if (modalType === 'city') {
                                                setCity(item.name);
                                                setCityId(item.id);
                                                closeModal();
                                            } else {
                                                // Sports - toggle
                                                toggleSelection(item.name, selectedSports, setSelectedSports);
                                            }
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        {modalType === 'sports' && selectedSports.includes(item.name) && (
                                            <Ionicons name="checkmark-circle" size={20} color={THEME.primary} />
                                        )}
                                        {modalType === 'city' && city === item.name && (
                                            <Ionicons name="checkmark-circle" size={20} color={THEME.primary} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                <Text style={styles.closeButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    safeAreaTop: {
        height: 0, // Header covers it
        backgroundColor: '#1F1F1F',
    },
    scrollContent: {
        paddingBottom: 100, // Space for footer
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: Platform.OS === 'android' ? 40 : 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        zIndex: 100,
        elevation: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    fixedHeaderTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    pageSubtitle: {
        color: THEME.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
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
        marginTop: 10, // Adjusted from -50
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
        overflow: 'hidden', // Ensure image clips
    },
    avatarImage: {
        width: '100%',
        height: '100%',
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
        zIndex: 3000, // Higher than parent
        elevation: 3000, // Higher than parent
        borderWidth: 1,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        width: '100%',
        maxHeight: '60%',
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalItemText: {
        color: '#FFF',
        fontSize: 16,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: THEME.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default PlayerProfileScreen;
