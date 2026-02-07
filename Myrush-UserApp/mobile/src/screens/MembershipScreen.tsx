import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';

const PLANS = [
    {
        id: 'silver',
        name: 'Silver',
        price: 'Free',
        color: ['#E0E0E0', '#BDBDBD'],
        features: ['Basic Profile', 'Book Courts', 'Join Public Games'],
        current: true,
    },
    {
        id: 'gold',
        name: 'Gold',
        price: '$9.99/mo',
        color: ['#FFD700', '#FFA000'],
        features: ['All Silver Features', '5% Booking Discount', 'Priority Support', 'Access to Leagues'],
        current: false,
    },
    {
        id: 'platinum',
        name: 'Platinum',
        price: '$19.99/mo',
        color: ['#4F46E5', '#000000'],
        features: ['All Gold Features', '15% Booking Discount', 'Free Data Analytics', 'Premium Badge', 'Event Invites'],
        current: false,
    },
];

const MembershipScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Membership Plans</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.heroTitle}>Upgrade Your Game</Text>
                <Text style={styles.heroSubtitle}>Unlock exclusive benefits and elevate your sports experience.</Text>

                <View style={styles.plansContainer}>
                    {PLANS.map((plan) => (
                        <TouchableOpacity key={plan.id} activeOpacity={0.9} style={styles.planCard}>
                            <LinearGradient
                                colors={plan.color}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.planGradient}
                            >
                                <View style={styles.planHeader}>
                                    <Text style={[styles.planName, plan.id === 'platinum' && { color: '#FFF' }]}>{plan.name}</Text>
                                    <Text style={[styles.planPrice, plan.id === 'platinum' && { color: '#FFF' }]}>{plan.price}</Text>
                                </View>

                                <View style={styles.separator} />

                                {plan.features.map((feature, index) => (
                                    <View key={index} style={styles.featureRow}>
                                        <Ionicons name="checkmark-circle" size={16} color={plan.id === 'platinum' ? '#FFF' : '#000'} />
                                        <Text style={[styles.featureText, plan.id === 'platinum' && { color: '#FFF' }]}>{feature}</Text>
                                    </View>
                                ))}

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        plan.current ? styles.currentButton : styles.upgradeButton,
                                        plan.id === 'platinum' && { borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.2)' }
                                    ]}
                                    disabled={plan.current}
                                >
                                    <Text style={[
                                        styles.actionButtonText,
                                        plan.id === 'platinum' && { color: '#FFF' }
                                    ]}>
                                        {plan.current ? 'Current Plan' : 'Upgrade'}
                                    </Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
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
        backgroundColor: '#333',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(5),
    },
    heroTitle: {
        fontSize: fontScale(28),
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginTop: hp(2),
        marginBottom: hp(1),
    },
    heroSubtitle: {
        fontSize: fontScale(14),
        color: '#888',
        textAlign: 'center',
        marginBottom: hp(4),
        paddingHorizontal: wp(5),
    },
    plansContainer: {
        gap: hp(3),
    },
    planCard: {
        borderRadius: moderateScale(20),
        overflow: 'hidden',
    },
    planGradient: {
        padding: wp(6),
    },
    planHeader: {
        marginBottom: hp(2),
    },
    planName: {
        fontSize: fontScale(24),
        fontWeight: '900',
        color: '#000',
        textTransform: 'uppercase',
    },
    planPrice: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#000',
        opacity: 0.8,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: hp(2),
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    featureText: {
        fontSize: fontScale(14),
        color: '#000',
        fontWeight: '500',
    },
    actionButton: {
        marginTop: hp(3),
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
    },
    currentButton: {
        backgroundColor: 'transparent',
    },
    upgradeButton: {
        backgroundColor: '#000',
    },
    actionButtonText: {
        fontWeight: 'bold',
        fontSize: fontScale(14),
        color: '#FFF', // Default for upgrade button
    },
});

export default MembershipScreen;
