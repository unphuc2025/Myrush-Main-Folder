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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={moderateScale(24)} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <Ionicons name="settings-outline" size={moderateScale(24)} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={moderateScale(40)} color="#999" />
                        </View>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={moderateScale(12)} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.userName}>{profileData?.full_name || 'User Name'}</Text>
                    <Text style={styles.userLocation}>{profileData?.city || 'New York, USA'}</Text>

                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => navigation.navigate('PlayerProfile')}
                    >
                        <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>1,200</Text>
                        <Text style={styles.statLabel}>Karma Points</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>88</Text>
                        <Text style={styles.statLabel}>Games Played</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>150</Text>
                        <Text style={styles.statLabel}>Hours Trained</Text>
                    </View>
                </View>

                {/* User Type Badge */}
                <View style={styles.userTypeBadge}>
                    <Text style={styles.userTypeTitle}>GOLD MEMBER</Text>
                    <Text style={styles.userTypeSubtitle}>Elite Perks</Text>
                </View>

                {/* Track Progress */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Track Your Progress</Text>
                    <TouchableOpacity style={styles.progressRow}>
                        <View style={styles.progressInfo}>
                            <Text style={styles.progressTitle}>Level 5 Achieved!</Text>
                            <Text style={styles.progressSubtitle}>You're 50% away from Level 6</Text>
                        </View>
                        <View style={styles.progressIndicatorWrapper}>
                            <View style={styles.progressCircle}>
                                <Text style={styles.progressPercentageText}>65%</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* My Sports */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>My Sports</Text>
                    <View style={styles.sportsGrid}>
                        {profileData?.sports?.map((sport, index) => (
                            <View key={index} style={styles.sportRow}>
                                <Text style={styles.sportName}>{sport}</Text>
                                <Text style={styles.sportLevel}>
                                    {profileData?.skill_level || 'Intermediate'}
                                </Text>
                            </View>
                        )) || (
                                <>
                                    <View style={styles.sportRow}>
                                        <Text style={styles.sportName}>Padel</Text>
                                        <Text style={styles.sportLevel}>Intermediate</Text>
                                    </View>
                                    <View style={styles.sportRow}>
                                        <Text style={styles.sportName}>Running</Text>
                                        <Text style={styles.sportLevel}>Advanced</Text>
                                    </View>
                                </>
                            )}
                    </View>
                </View>

                {/* My Achievements */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>My Achievements</Text>
                    <View style={styles.achievementsRow}>
                        <View style={styles.achievementBadge}>
                            <View style={[styles.achievementIcon, { backgroundColor: '#C8F7DC' }]}>
                                <Ionicons name="trophy" size={moderateScale(24)} color={colors.primary} />
                            </View>
                            <Text style={styles.achievementText}>First Match{'\n'}Win</Text>
                        </View>
                        <View style={styles.achievementBadge}>
                            <View style={[styles.achievementIcon, { backgroundColor: '#C8F7DC' }]}>
                                <Ionicons name="timer" size={moderateScale(24)} color={colors.primary} />
                            </View>
                            <Text style={styles.achievementText}>10 Hours{'\n'}Trained</Text>
                        </View>
                        <View style={styles.achievementBadge}>
                            <View style={[styles.achievementIcon, { backgroundColor: '#C8F7DC' }]}>
                                <Ionicons name="medal" size={moderateScale(24)} color={colors.primary} />
                            </View>
                            <Text style={styles.achievementText}>Top 10{'\n'}Player</Text>
                        </View>
                    </View>
                </View>

                {/* My Teams */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>My Teams</Text>
                    <TouchableOpacity style={styles.teamRow}>
                        <View style={styles.teamIconContainer}>
                            <View style={[styles.teamIcon, { backgroundColor: '#FFE4E4' }]}>
                                <Text style={styles.teamIconText}>PP</Text>
                            </View>
                        </View>
                        <Text style={styles.teamName}>Padel Pros</Text>
                        <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.teamRow}>
                        <View style={styles.teamIconContainer}>
                            <View style={[styles.teamIcon, { backgroundColor: '#006D5B' }]}>
                                <Ionicons name="water" size={moderateScale(16)} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.teamName}>City Runners</Text>
                        <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Community */}
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="people-outline" size={moderateScale(22)} color="#333" />
                    <Text style={styles.menuItemText}>Community</Text>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
                </TouchableOpacity>

                {/* Offers */}
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="pricetag-outline" size={moderateScale(22)} color="#333" />
                    <Text style={styles.menuItemText}>Offers</Text>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
                </TouchableOpacity>

                {/* Reviews & Ratings */}
                <TouchableOpacity
                    style={[styles.menuItem, { marginBottom: hp(3) }]}
                    onPress={() => navigation.navigate('Reviews')}
                >
                    <Ionicons name="star-outline" size={moderateScale(22)} color="#333" />
                    <Text style={styles.menuItemText}>Reviews & Ratings</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>4</Text>
                        <Ionicons name="star" size={moderateScale(10)} color="#FFA000" />
                    </View>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color="#999" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingTop: Platform.OS === 'ios' ? hp(6) : hp(4),
        paddingBottom: hp(2),
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: '#000',
    },
    scrollContent: {
        paddingBottom: hp(3),
    },
    profileSection: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: hp(3),
        paddingHorizontal: wp(5),
        marginBottom: hp(2),
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: hp(1.5),
    },
    avatar: {
        width: wp(22),
        height: wp(22),
        borderRadius: wp(11),
        backgroundColor: '#F0D5D5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: wp(6),
        height: wp(6),
        borderRadius: wp(3),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: fontScale(20),
        fontWeight: 'bold',
        color: '#000',
        marginBottom: hp(0.5),
    },
    userLocation: {
        fontSize: fontScale(13),
        color: '#999',
        marginBottom: hp(2),
    },
    editProfileButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: wp(20),
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(25),
    },
    editProfileButtonText: {
        color: '#fff',
        fontSize: fontScale(14),
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        marginBottom: hp(2),
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: wp(3),
        marginHorizontal: wp(1),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statValue: {
        fontSize: fontScale(20),
        fontWeight: 'bold',
        color: '#000',
        marginBottom: hp(0.5),
    },
    statLabel: {
        fontSize: fontScale(11),
        color: '#666',
        textAlign: 'center',
    },
    userTypeBadge: {
        backgroundColor: '#D4AF37',
        marginHorizontal: wp(5),
        marginBottom: hp(2),
        padding: hp(2),
        borderRadius: moderateScale(15),
        alignItems: 'center',
    },
    userTypeTitle: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: hp(0.3),
    },
    userTypeSubtitle: {
        fontSize: fontScale(12),
        color: '#fff',
        opacity: 0.9,
    },
    sectionCard: {
        backgroundColor: '#fff',
        marginHorizontal: wp(5),
        marginBottom: hp(2),
        padding: wp(4),
        borderRadius: moderateScale(15),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#000',
        marginBottom: hp(1.5),
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressInfo: {
        flex: 1,
    },
    progressTitle: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#000',
        marginBottom: hp(0.3),
    },
    progressSubtitle: {
        fontSize: fontScale(11),
        color: '#999',
    },
    progressIndicatorWrapper: {
        marginRight: wp(2),
    },
    progressCircle: {
        width: wp(12),
        height: wp(12),
        borderRadius: wp(6),
        borderWidth: 4,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E8F5F1',
    },
    progressPercentageText: {
        fontSize: fontScale(11),
        fontWeight: '600',
        color: colors.primary,
    },
    sportsGrid: {
        gap: hp(1),
    },
    sportRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: hp(0.8),
    },
    sportName: {
        fontSize: fontScale(14),
        color: '#000',
    },
    sportLevel: {
        fontSize: fontScale(13),
        color: '#666',
    },
    achievementsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    achievementBadge: {
        alignItems: 'center',
        flex: 1,
    },
    achievementIcon: {
        width: wp(15),
        height: wp(15),
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(0.8),
    },
    achievementText: {
        fontSize: fontScale(10),
        color: '#666',
        textAlign: 'center',
        lineHeight: fontScale(13),
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1),
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    teamIconContainer: {
        marginRight: wp(3),
    },
    teamIcon: {
        width: wp(10),
        height: wp(10),
        borderRadius: moderateScale(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    teamIconText: {
        fontSize: fontScale(12),
        fontWeight: '600',
        color: '#FF6B6B',
    },
    teamName: {
        flex: 1,
        fontSize: fontScale(14),
        color: '#000',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: wp(5),
        marginBottom: hp(1),
        padding: wp(4),
        borderRadius: moderateScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    menuItemText: {
        flex: 1,
        fontSize: fontScale(14),
        color: '#333',
        marginLeft: wp(3),
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.3),
        borderRadius: moderateScale(12),
        marginRight: wp(2),
    },
    ratingText: {
        fontSize: fontScale(12),
        fontWeight: '600',
        color: '#FFA000',
        marginRight: wp(0.5),
    },
    progressCircleContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressPercentage: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.primary,
    },
});

export default ProfileOverviewScreen;
