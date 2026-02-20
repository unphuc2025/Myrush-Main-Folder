import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Image,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { profileApi, ProfileData } from '../api/profile';

const { width } = Dimensions.get('window');

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

const ProfileOverviewScreen = () => {
    const navigation = useNavigation<RootNavigation>();
    const { user } = useAuthStore();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    // Start with false so store data renders immediately; API call will update if available
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await profileApi.getProfile(user?.phoneNumber || '');
                if (response.success && response.data) {
                    setProfileData(response.data);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [user?.phoneNumber]);

    const renderMenuItem = (icon: any, title: string, onPress?: () => void, badge?: string) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                <Ionicons name={icon} size={moderateScale(20)} color={colors.primary} />
            </View>
            <Text style={styles.menuItemText}>{title}</Text>
            {badge && (
                <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={moderateScale(18)} color="#666" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <Ionicons name="settings-outline" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header Section */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.profileCard}
                >
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            {(profileData?.avatar_url || user?.avatarUrl) ? (
                                <Image
                                    source={{ uri: profileData?.avatar_url || user?.avatarUrl || '' }}
                                    style={{ width: '100%', height: '100%', borderRadius: 100 }}
                                />
                            ) : (
                                <Ionicons name="person" size={moderateScale(35)} color="#FFF" />
                            )}
                        </View>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={moderateScale(10)} color="#fff" />
                        </View>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{profileData?.full_name || 'MyRush User'}</Text>
                        <Text style={styles.userHandle}>@{profileData?.full_name?.replace(/\s/g, '').toLowerCase() || 'player'}</Text>
                        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('PlayerProfile')}>
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Loyalty Program Section */}
                {/* Loyalty Program Section - Hidden for MVP */}
                {/* <TouchableOpacity
                    style={styles.loyaltyCard}
                    onPress={() => navigation.navigate('RedemptionStore')}
                >
                    <LinearGradient
                        colors={['#FFD700', '#FFA000']} // Gold Gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.loyaltyGradient}
                    >
                        <View style={styles.loyaltyHeader}>
                            <View>
                                <Text style={styles.loyaltyLabel}>MYRUSH LOYALTY</Text>
                                <Text style={styles.loyaltyTier}>Gold Member</Text>
                            </View>
                            <MaterialCommunityIcons name="crown" size={moderateScale(32)} color="#FFF" />
                        </View>

                        <View style={styles.pointsContainer}>
                            <Text style={styles.pointsValue}>1,250</Text>
                            <Text style={styles.pointsLabel}>Rush Points</Text>
                        </View>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: '60%' }]} />
                            </View>
                            <Text style={styles.progressText}>750 points to Platinum</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity> */}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Games</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>4.8</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>8</Text>
                        <Text style={styles.statLabel}>MVP</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>92%</Text>
                        <Text style={styles.statLabel}>Reliability</Text>
                    </View>
                </View>

                {/* Menu Options */}
                <View style={styles.menuContainer}>
                    <Text style={styles.sectionHeader}>Account</Text>

                    {/* <Text style={[styles.sectionHeader, { fontSize: 12, color: '#666', marginTop: 0, marginBottom: 10 }]}>(Coming Soon)</Text> */}

                    {/* {renderMenuItem('people-outline', 'Community', () => navigation.navigate('Community' as any))} */}
                    {renderMenuItem('calendar-outline', 'My Bookings', () => navigation.navigate('BookTab'))}
                    {/* {renderMenuItem('ribbon-outline', 'Memberships', () => navigation.navigate('Membership'))} */}
                    {/* {renderMenuItem('trophy-outline', 'Tournaments', () => { })} */}
                    {renderMenuItem('card-outline', 'Payment Methods', () => navigation.navigate('Payments'))}

                    <Text style={[styles.sectionHeader, { marginTop: hp(3) }]}>Support</Text>
                    {renderMenuItem('help-circle-outline', 'Help & Support', () => navigation.navigate('Support'))}
                    {renderMenuItem('shield-checkmark-outline', 'Privacy Policy', () => alert('Coming Soon'))}

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => {
                            Alert.alert('Logout', 'Are you sure you want to logout?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Logout',
                                    style: 'destructive',
                                    onPress: () => {
                                        useAuthStore.getState().logout();
                                    }
                                }
                            ]);
                        }}
                    >
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary, // Dark background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingTop: Platform.OS === 'ios' ? hp(7) : hp(5),
        paddingBottom: hp(2),
        backgroundColor: colors.background.primary,
    },
    headerButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        paddingBottom: hp(12),
        paddingHorizontal: wp(5),
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(4),
        borderRadius: moderateScale(16),
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: wp(4),
    },
    avatar: {
        width: wp(16),
        height: wp(16),
        borderRadius: wp(8),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    userHandle: {
        fontSize: fontScale(14),
        color: '#888',
        marginBottom: hp(1.5),
    },
    editButton: {
        backgroundColor: '#333',
        paddingVertical: hp(0.8),
        paddingHorizontal: wp(4),
        borderRadius: moderateScale(8),
        alignSelf: 'flex-start',
    },
    editButtonText: {
        color: '#fff',
        fontSize: fontScale(12),
        fontWeight: '600',
    },
    loyaltyCard: {
        marginBottom: hp(3),
        borderRadius: moderateScale(16),
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    loyaltyGradient: {
        padding: wp(5),
    },
    loyaltyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(2),
    },
    loyaltyLabel: {
        fontSize: fontScale(10),
        fontWeight: '700',
        color: 'rgba(0,0,0,0.6)',
        letterSpacing: 1,
        marginBottom: 4,
    },
    loyaltyTier: {
        fontSize: fontScale(22),
        fontWeight: 'bold',
        color: '#000',
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: hp(2),
    },
    pointsValue: {
        fontSize: fontScale(28),
        fontWeight: '800',
        color: '#000',
        marginRight: 6,
    },
    pointsLabel: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: 'rgba(0,0,0,0.7)',
    },
    progressContainer: {
        width: '100%',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#000',
        borderRadius: 3,
    },
    progressText: {
        fontSize: fontScale(11),
        color: 'rgba(0,0,0,0.6)',
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: wp(3),
        marginBottom: hp(3),
    },
    statBox: {
        width: (width - wp(10) - wp(9)) / 4, // 4 items with gap
        aspectRatio: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    statNumber: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: fontScale(10),
        color: '#888',
    },
    menuContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: wp(4),
        marginBottom: hp(3),
    },
    sectionHeader: {
        fontSize: fontScale(12),
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: hp(2),
        marginLeft: wp(1),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1.8),
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    menuIconContainer: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(8),
        backgroundColor: 'rgba(212, 255, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    menuItemText: {
        flex: 1,
        fontSize: fontScale(15),
        color: '#fff',
        fontWeight: '500',
    },
    menuBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
    },
    menuBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    logoutButton: {
        marginTop: hp(2),
        paddingVertical: hp(1.5),
        alignItems: 'center',
    },
    logoutText: {
        color: '#FF453A',
        fontSize: fontScale(15),
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: '#444',
        fontSize: fontScale(12),
        marginBottom: hp(2),
    },
});

export default ProfileOverviewScreen;
