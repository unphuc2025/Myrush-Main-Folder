import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_LEADERBOARD = [
    { id: '1', rank: 1, name: 'Alex Johnson', points: 12500, avatar: 'A' },
    { id: '2', rank: 2, name: 'Sarah Lee', points: 11200, avatar: 'S' },
    { id: '3', rank: 3, name: 'Mike Brown', points: 10800, avatar: 'M' },
    { id: '4', rank: 4, name: 'Emily Davis', points: 9500, avatar: 'E' },
    { id: '5', rank: 5, name: 'Chris Wilson', points: 8900, avatar: 'C' },
    { id: '6', rank: 6, name: 'You', points: 8200, avatar: 'Y', isMe: true }, // Current User
    { id: '7', rank: 7, name: 'Tom Clark', points: 7500, avatar: 'T' },
    { id: '8', rank: 8, name: 'Anna White', points: 6400, avatar: 'A' },
    { id: '9', rank: 9, name: 'David Miller', points: 5800, avatar: 'D' },
];

const LeaderboardScreen = () => {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'Global' | 'Friends'>('Global');

    const renderItem = ({ item }: { item: any }) => {
        const isTop3 = item.rank <= 3;
        const iconColor = item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32';

        return (
            <View style={[styles.rankRow, item.isMe && styles.myRankRow]}>
                <View style={styles.rankNumberContainer}>
                    {isTop3 ? (
                        <Ionicons name="trophy" size={moderateScale(20)} color={iconColor} />
                    ) : (
                        <Text style={styles.rankNumber}>{item.rank}</Text>
                    )}
                </View>
                <View style={styles.userContainer}>
                    <View style={[styles.avatar, { backgroundColor: isTop3 ? iconColor : '#444' }]}>
                        <Text style={[styles.avatarText, isTop3 && { color: '#000' }]}>{item.avatar}</Text>
                    </View>
                    <Text style={[styles.userName, item.isMe && styles.myUserName]}>
                        {item.name} {item.isMe && '(You)'}
                    </Text>
                </View>
                <Text style={styles.points}>{item.points.toLocaleString()}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Global' && styles.activeTab]}
                    onPress={() => setActiveTab('Global')}
                >
                    <Text style={[styles.tabText, activeTab === 'Global' && styles.activeTabText]}>Global</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Friends' && styles.activeTab]}
                    onPress={() => setActiveTab('Friends')}
                >
                    <Text style={[styles.tabText, activeTab === 'Friends' && styles.activeTabText]}>Friends</Text>
                </TouchableOpacity>
            </View>

            {/* Header Row */}
            <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>Rank</Text>
                <Text style={[styles.listHeaderText, { flex: 1, paddingLeft: wp(10) }]}>Player</Text>
                <Text style={styles.listHeaderText}>Points</Text>
            </View>

            {/* List */}
            <FlatList
                data={MOCK_LEADERBOARD}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: fontScale(20),
        fontWeight: 'bold',
        color: '#FFF',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        marginHorizontal: wp(5),
        borderRadius: moderateScale(12),
        padding: 4,
        marginBottom: hp(3),
    },
    tab: {
        flex: 1,
        paddingVertical: hp(1),
        alignItems: 'center',
        borderRadius: moderateScale(10),
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: fontScale(14),
        color: '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#000',
        fontWeight: 'bold',
    },
    listHeader: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        marginBottom: hp(1),
        paddingBottom: hp(1),
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    listHeaderText: {
        fontSize: fontScale(12),
        color: '#666',
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: hp(5),
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(5),
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        justifyContent: 'space-between'
    },
    myRankRow: {
        backgroundColor: 'rgba(57, 224, 121, 0.1)',
    },
    rankNumberContainer: {
        width: wp(10),
        alignItems: 'center',
    },
    rankNumber: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#FFF',
    },
    userContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: wp(2),
    },
    avatar: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    avatarText: {
        fontSize: fontScale(14),
        fontWeight: 'bold',
        color: '#FFF',
    },
    userName: {
        fontSize: fontScale(14),
        color: '#FFF',
        fontWeight: '500',
    },
    myUserName: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    points: {
        fontSize: fontScale(14),
        fontWeight: 'bold',
        color: colors.primary,
        width: wp(20),
        textAlign: 'right',
    },
});

export default LeaderboardScreen;
