import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MOCK_SQUADS = [
    { id: '1', name: 'Raging Bulls', members: 24, sport: 'Cricket', level: 'Intermediate' },
    { id: '2', name: 'Ace Strikers', members: 18, sport: 'Tennis', level: 'Advanced' },
    { id: '3', name: 'Net Masters', members: 12, sport: 'Badminton', level: 'Beginner' },
    { id: '4', name: 'Goal Getters', members: 30, sport: 'Football', level: 'All Levels' },
    { id: '5', name: 'Padel Pros', members: 15, sport: 'Padel', level: 'Advanced' },
];

const SquadListScreen = () => {
    const navigation = useNavigation<any>();

    const renderSquadItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.squadCard}
            onPress={() => navigation.navigate('SquadDetails', { squadId: item.id })}
        >
            <View style={styles.squadInfo}>
                <View style={styles.squadAvatar}>
                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View>
                    <Text style={styles.squadName}>{item.name}</Text>
                    <Text style={styles.squadDetails}>{item.sport} • {item.level}</Text>
                </View>
            </View>
            <View style={styles.memberBadge}>
                <Ionicons name="people" size={moderateScale(14)} color="#FFF" />
                <Text style={styles.memberCount}>{item.members}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Find Squads</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreateSquad')}>
                    <Ionicons name="add-circle-outline" size={moderateScale(28)} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={moderateScale(20)} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for squads..."
                    placeholderTextColor="#666"
                />
            </View>

            {/* List */}
            <FlatList
                data={MOCK_SQUADS}
                keyExtractor={(item) => item.id}
                renderItem={renderSquadItem}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        marginHorizontal: wp(5),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(12),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#333',
    },
    searchIcon: {
        marginRight: wp(2),
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: fontScale(14),
    },
    listContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(5),
    },
    squadCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: wp(4),
        borderRadius: moderateScale(16),
        marginBottom: hp(1.5),
        borderWidth: 1,
        borderColor: '#333',
    },
    squadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    squadAvatar: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
        borderWidth: 1,
        borderColor: '#444',
    },
    avatarText: {
        fontSize: fontScale(20),
        fontWeight: 'bold',
        color: colors.primary,
    },
    squadName: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    squadDetails: {
        fontSize: fontScale(12),
        color: '#888',
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.5),
        borderRadius: moderateScale(12),
        gap: 4,
    },
    memberCount: {
        fontSize: fontScale(12),
        fontWeight: '600',
        color: '#FFF',
    },
});

export default SquadListScreen;
