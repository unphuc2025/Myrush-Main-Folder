import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Switch, ScrollView, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const CommunityScreen = () => {
    const navigation = useNavigation<any>();

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Community</Text>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="search" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('ChatList')}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.quickActionsContainer}>
            <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Leaderboard')}
            >
                <LinearGradient
                    colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                    style={styles.actionGradient}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#FFD700' }]}>
                        <Ionicons name="trophy" size={moderateScale(20)} color="#000" />
                    </View>
                    <Text style={styles.actionTitle}>Leaderboard</Text>
                    <Text style={styles.actionSubtitle}>See Top Players</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('SquadList')}
            >
                <LinearGradient
                    colors={['rgba(57, 224, 121, 0.2)', 'rgba(57, 224, 121, 0.05)']}
                    style={styles.actionGradient}
                >
                    <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                        <Ionicons name="people" size={moderateScale(20)} color="#000" />
                    </View>
                    <Text style={styles.actionTitle}>Find Squads</Text>
                    <Text style={styles.actionSubtitle}>Join a Team</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderFeedItem = ({ item }: { item: any }) => (
        <View style={styles.feedItem}>
            <View style={styles.feedHeader}>
                <View style={styles.feedAvatar}>
                    <Text style={styles.avatarText}>{item.user[0]}</Text>
                </View>
                <View style={styles.feedUserInfo}>
                    <Text style={styles.feedUserName}>{item.user}</Text>
                    <Text style={styles.feedTime}>{item.time}</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={moderateScale(20)} color="#666" />
                </TouchableOpacity>
            </View>
            <Text style={styles.feedContent}>{item.content}</Text>
            {item.image && (
                <View style={styles.feedImagePlaceholder}>
                    <Ionicons name="image-outline" size={moderateScale(40)} color="#666" />
                </View>
            )}
            <View style={styles.feedActions}>
                <TouchableOpacity style={styles.feedAction}>
                    <Ionicons name="heart-outline" size={moderateScale(20)} color="#888" />
                    <Text style={styles.feedActionText}>{item.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedAction}>
                    <Ionicons name="chatbubble-outline" size={moderateScale(20)} color="#888" />
                    <Text style={styles.feedActionText}>{item.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedAction}>
                    <Ionicons name="share-social-outline" size={moderateScale(20)} color="#888" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const mockFeed = [
        { id: '1', user: 'Alex Johnson', time: '2h ago', content: 'Just won my first Padel tournament! 🏆 What a game!', likes: 24, comments: 5 },
        { id: '2', user: 'Sarah Lee', time: '4h ago', content: 'Looking for a squad to play Badminton on weekends. Anyone interested?', likes: 12, comments: 8 },
        { id: '3', user: 'Mike Brown', time: 'Yesterday', content: 'New personal best: 10km run in 45 mins! 🏃‍♂️💨', likes: 45, comments: 12, image: true },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
            {renderHeader()}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {renderQuickActions()}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending Now</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Horizontal Featured Squads (Mock) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
                    {['Raging Bulls', 'Ace Strikers', 'Net Masters'].map((club, index) => (
                        <TouchableOpacity key={index} style={styles.featuredCard}>
                            <LinearGradient
                                colors={['#2C2C2E', '#1C1C1E']}
                                style={styles.featuredGradient}
                            >
                                <View style={styles.featuredIcon}>
                                    <Text style={styles.featuredIconText}>{club[0]}</Text>
                                </View>
                                <Text style={styles.featuredTitle}>{club}</Text>
                                <Text style={styles.featuredSubtitle}>24 Members</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Community Feed</Text>
                </View>

                {mockFeed.map((item) => (
                    <View key={item.id} style={{ marginBottom: 16 }}>
                        {renderFeedItem({ item })}
                    </View>
                ))}
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    headerTitle: {
        fontSize: fontScale(24),
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerActions: {
        flexDirection: 'row',
        gap: wp(4),
    },
    iconButton: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: hp(10),
    },
    quickActionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        gap: wp(4),
        marginBottom: hp(3),
    },
    actionCard: {
        flex: 1,
        height: hp(14),
        borderRadius: moderateScale(16),
        overflow: 'hidden',
    },
    actionGradient: {
        flex: 1,
        padding: wp(4),
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: moderateScale(16),
    },
    actionIcon: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    actionTitle: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: fontScale(12),
        color: '#AAA',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
    },
    seeAllText: {
        fontSize: fontScale(14),
        color: colors.primary,
        fontWeight: '600',
    },
    featuredScroll: {
        paddingLeft: wp(5),
        marginBottom: hp(3),
    },
    featuredCard: {
        width: wp(35),
        height: hp(16),
        marginRight: wp(3),
        borderRadius: moderateScale(16),
        overflow: 'hidden',
    },
    featuredGradient: {
        flex: 1,
        padding: wp(3),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: moderateScale(16),
    },
    featuredIcon: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    featuredIconText: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
    },
    featuredTitle: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 2,
    },
    featuredSubtitle: {
        fontSize: fontScale(10),
        color: '#888',
    },
    feedItem: {
        backgroundColor: '#1C1C1E',
        marginHorizontal: wp(5),
        borderRadius: moderateScale(16),
        padding: wp(4),
        borderWidth: 1,
        borderColor: '#333',
    },
    feedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    feedAvatar: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    avatarText: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#000',
    },
    feedUserInfo: {
        flex: 1,
    },
    feedUserName: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#FFF',
    },
    feedTime: {
        fontSize: fontScale(12),
        color: '#666',
    },
    feedContent: {
        fontSize: fontScale(14),
        color: '#DDD',
        lineHeight: fontScale(20),
        marginBottom: hp(1.5),
    },
    feedImagePlaceholder: {
        width: '100%',
        height: hp(20),
        backgroundColor: '#2C2C2E',
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    feedActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: hp(1.5),
        gap: wp(6),
    },
    feedAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    feedActionText: {
        fontSize: fontScale(12),
        color: '#888',
        fontWeight: '500',
    },
});

export default CommunityScreen;
