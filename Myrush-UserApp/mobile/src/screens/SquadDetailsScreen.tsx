import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const SquadDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { squadId } = route.params || {};

    const handleJoin = () => {
        Alert.alert('Success', 'Request sent to join squad!');
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Banner */}
            <View style={styles.bannerContainer}>
                <LinearGradient
                    colors={['#1C1C1E', colors.background.primary]}
                    style={styles.banner}
                >
                    <View style={styles.squadLogo}>
                        <Text style={styles.logoText}>RB</Text>
                    </View>
                </LinearGradient>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerInfo}>
                    <Text style={styles.squadName}>Raging Bulls</Text>
                    <View style={styles.tagsRow}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>Cricket</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>Intermediate</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>24 Members</Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>42</Text>
                        <Text style={styles.statLabel}>Matches</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>68%</Text>
                        <Text style={styles.statLabel}>Win Rate</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>Mumbai</Text>
                        <Text style={styles.statLabel}>Location</Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>
                        We are a passionate group of amateur cricket players based in South Mumbai. We play every weekend and participate in local tournaments. Join us if you love the game!
                    </Text>
                </View>

                {/* Members */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <View key={i} style={styles.memberAvatar}>
                                <Ionicons name="person" size={moderateScale(24)} color="#FFF" />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
                    <Text style={styles.joinButtonText}>Request to Join</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    bannerContainer: {
        height: hp(25),
        position: 'relative',
    },
    banner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: hp(6),
        left: wp(5),
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    squadLogo: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(20),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    logoText: {
        fontSize: fontScale(32),
        fontWeight: 'bold',
        color: colors.primary,
    },
    content: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(12),
    },
    headerInfo: {
        alignItems: 'center',
        marginTop: hp(2),
        marginBottom: hp(3),
    },
    squadName: {
        fontSize: fontScale(24),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: hp(1),
    },
    tagsRow: {
        flexDirection: 'row',
        gap: wp(2),
    },
    tag: {
        backgroundColor: '#1C1C1E',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.5),
        borderRadius: moderateScale(8),
        borderWidth: 1,
        borderColor: '#333',
    },
    tagText: {
        fontSize: fontScale(12),
        color: '#CCC',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: wp(4),
        marginBottom: hp(3),
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: fontScale(12),
        color: '#666',
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#333',
    },
    section: {
        marginBottom: hp(3),
    },
    sectionTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: hp(1.5),
    },
    description: {
        fontSize: fontScale(14),
        color: '#AAA',
        lineHeight: fontScale(22),
    },
    membersScroll: {
        flexDirection: 'row',
    },
    memberAvatar: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: wp(5),
        paddingBottom: hp(4),
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: '#1C1C1E',
    },
    joinButton: {
        backgroundColor: colors.primary,
        paddingVertical: hp(2),
        borderRadius: moderateScale(12),
        alignItems: 'center',
    },
    joinButtonText: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#000',
    },
});

export default SquadDetailsScreen;
