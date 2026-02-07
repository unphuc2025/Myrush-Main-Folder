import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';

const REWARDS = [
    { id: '1', title: '50% Off Court Booking', cost: 500, type: 'Coupon', icon: 'ticket-outline' },
    { id: '2', title: 'Free Energy Drink', cost: 150, type: 'Food & Drink', icon: 'cup-outline' },
    { id: '3', title: 'MyRush Pro Jersey', cost: 2000, type: 'Gear', icon: 'shirt-outline' },
    { id: '4', title: '1 Hour Coach Session', cost: 1500, type: 'Training', icon: 'school-outline' },
    { id: '5', title: 'Platinum for 1 Month', cost: 3000, type: 'Membership', icon: 'crown-outline' },
];

const RedemptionStoreScreen = () => {
    const navigation = useNavigation();

    const renderRewardCard = (item: any) => (
        <TouchableOpacity key={item.id} style={styles.rewardCard}>
            <View style={styles.rewardIconContainer}>
                <Ionicons name={item.icon} size={30} color="#000" />
            </View>
            <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{item.title}</Text>
                <Text style={styles.rewardType}>{item.type}</Text>
            </View>
            <TouchableOpacity style={styles.redeemButton}>
                <Text style={styles.redeemCost}>{item.cost} pts</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rewards Store</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Balance Card */}
                <LinearGradient
                    colors={['#FFD700', '#FFA000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View>
                        <Text style={styles.balanceLabel}>AVAILABLE POINTS</Text>
                        <Text style={styles.balanceValue}>1,250</Text>
                    </View>
                    <MaterialCommunityIcons name="star-four-points-circle" size={50} color="#FFF" style={{ opacity: 0.8 }} />
                </LinearGradient>

                <Text style={styles.sectionTitle}>Redeem Your Points</Text>

                <View style={styles.rewardsList}>
                    {REWARDS.map(renderRewardCard)}
                </View>
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(5),
    },
    balanceCard: {
        borderRadius: moderateScale(20),
        padding: wp(6),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(3),
    },
    balanceLabel: {
        fontSize: fontScale(12),
        fontWeight: '700',
        color: 'rgba(0,0,0,0.6)',
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: fontScale(32),
        fontWeight: '900',
        color: '#000',
    },
    sectionTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: hp(2),
    },
    rewardsList: {
        gap: hp(2),
    },
    rewardCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: wp(4),
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    rewardIconContainer: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    rewardInfo: {
        flex: 1,
    },
    rewardTitle: {
        fontSize: fontScale(14),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    rewardType: {
        fontSize: fontScale(12),
        color: '#888',
    },
    redeemButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    redeemCost: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: fontScale(12),
    },
});

export default RedemptionStoreScreen;
