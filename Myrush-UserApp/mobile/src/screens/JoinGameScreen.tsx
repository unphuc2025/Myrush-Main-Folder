import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
    ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import Button from '../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

type JoinGameRouteProp = RouteProp<RootStackParamList, 'JoinGame'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const JoinGameScreen = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<JoinGameRouteProp>();

    // Default data if params are missing (for dev/testing)
    const { gameData } = route.params || {};

    const [isJoining, setIsJoining] = useState(false);

    const handleConfirmJoin = () => {
        setIsJoining(true);
        // Simulate API call
        setTimeout(() => {
            setIsJoining(false);
            // Navigate to Success or back
            navigation.navigate('BookingSuccess', {
                venue: gameData?.title || 'Game',
                date: 'Confirmed',
                timeSlot: gameData?.time || 'Upcoming',
                totalAmount: 119,
                bookingId: '#GAME-' + Math.floor(Math.random() * 10000)
            });
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header / Banner Area */}
            <View style={styles.bannerContainer}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', '#000000']}
                    style={styles.gradientOverlay}
                />

                {/* Header Actions */}
                <SafeAreaView style={styles.header} edges={['top']}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Join Game</Text>
                    <View style={{ width: 40 }} />
                </SafeAreaView>

                {/* Game Info Overlay */}
                <View style={styles.bannerContent}>
                    <View style={styles.sportBadge}>
                        <Text style={styles.sportBadgeText}>{gameData?.sport || 'Pickleball'}</Text>
                    </View>
                    <Text style={styles.gameTitle}>{gameData?.title || 'Advanced Doubles Match'}</Text>
                    <View style={styles.hostInfo}>
                        <View style={styles.hostAvatar}>
                            <Text style={styles.hostInitials}>JD</Text>
                        </View>
                        <Text style={styles.hostName}>Hosted by {gameData?.host || 'John Doe'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: hp(12) }}>

                {/* Key Details Grid */}
                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{gameData?.date || 'Sun, 16 Nov'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                        <Text style={styles.detailLabel}>Time</Text>
                        <Text style={styles.detailValue}>{gameData?.time || '7:00 PM'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                        <Text style={styles.detailLabel}>Price</Text>
                        <Text style={styles.detailValue}>{gameData?.price || '₹119'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="people-outline" size={20} color={colors.primary} />
                        <Text style={styles.detailLabel}>Players</Text>
                        <Text style={styles.detailValue}>2/4 Going</Text>
                    </View>
                </View>

                {/* Location Card */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <Ionicons name="location" size={24} color="#666" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.locationName}>{gameData?.location || 'PicklePlex Arena'}</Text>
                                <Text style={styles.locationAddress}>Madhapur, Hyderabad</Text>
                            </View>
                            <Ionicons name="navigate-circle-outline" size={32} color={colors.primary} />
                        </View>
                    </View>
                </View>

                {/* Players Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Players (2/4)</Text>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.playersList}>
                        <View style={styles.playerItem}>
                            <View style={[styles.playerAvatar, { backgroundColor: '#333' }]}>
                                <Text style={{ color: '#FFF' }}>JD</Text>
                            </View>
                            <Text style={styles.playerName}>John Doe (Host)</Text>
                            <View style={styles.skillBadge}><Text style={styles.skillText}>PRO</Text></View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.playerItem}>
                            <View style={[styles.playerAvatar, { backgroundColor: '#333' }]}>
                                <Text style={{ color: '#FFF' }}>AS</Text>
                            </View>
                            <Text style={styles.playerName}>Alex Smith</Text>
                            <View style={styles.skillBadge}><Text style={styles.skillText}>INT</Text></View>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.totalLabel}>Total to pay</Text>
                    <Text style={styles.totalAmount}>{gameData?.price || '₹119'}</Text>
                </View>
                <View style={{ flex: 1, paddingLeft: 20 }}>
                    <Button
                        title="Confirm & Join"
                        onPress={handleConfirmJoin}
                        loading={isJoining}
                        fullWidth
                    />
                </View>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    bannerContainer: {
        height: hp(35),
        backgroundColor: '#1C1C1E',
        position: 'relative',
        justifyContent: 'space-between',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 0, // Hidden initially, could animate
    },
    bannerContent: {
        padding: wp(5),
        paddingBottom: hp(4),
    },
    sportBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    sportBadgeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    gameTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hostAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hostInitials: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    hostName: {
        color: '#CCC',
        fontSize: 14,
    },
    content: {
        flex: 1,
        marginTop: -20,
        backgroundColor: '#000',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: wp(5),
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    detailItem: {
        width: '48%', // Approx 2 columns
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
        gap: 4,
    },
    detailLabel: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
    detailValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    locationAddress: {
        color: '#888',
        fontSize: 14,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    linkText: {
        color: colors.primary,
        fontSize: 14,
    },
    playersList: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    playerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerName: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
    },
    skillBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    skillText: {
        color: '#AAA',
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#2C2C2E',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C1C1E',
        borderTopWidth: 1,
        borderTopColor: '#333',
        padding: 20,
        paddingBottom: hp(4),
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerInfo: {
        justifyContent: 'center',
    },
    totalLabel: {
        color: '#888',
        fontSize: 12,
    },
    totalAmount: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    }

});

export default JoinGameScreen;
