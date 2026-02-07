import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const PRODUCTS = [
    { id: '1', name: 'Energy Drink - Blue', price: '$3.50', image: null, category: 'Drinks' },
    { id: '2', name: 'Protein Bar', price: '$2.50', image: null, category: 'Food' },
    { id: '3', name: 'Water Bottle', price: '$1.50', image: null, category: 'Drinks' },
    { id: '4', name: 'Sports Towel', price: '$12.00', image: null, category: 'Gear' },
    { id: '5', name: 'Wristbands', price: '$8.00', image: null, category: 'Gear' },
    { id: '6', name: 'Energy Gel', price: '$2.00', image: null, category: 'Food' },
];

const StoreScreen = () => {
    const navigation = useNavigation<any>();

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.productCard}>
            <View style={styles.imageContainer}>
                <Ionicons name="pricetag" size={40} color="#555" />
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{item.price}</Text>
                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons name="add" size={16} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Store</Text>
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart-outline" size={moderateScale(24)} color="#FFF" />
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>0</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Banner */}
                <View style={styles.bannerContainer}>
                    <LinearGradient
                        colors={[colors.primary, '#1A2F23']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.banner}
                    >
                        <View>
                            <Text style={styles.bannerTitle}>Fuel Up</Text>
                            <Text style={styles.bannerSubtitle}>Get 20% off Drinks</Text>
                        </View>
                        <Ionicons name="nutrition" size={60} color="rgba(255,255,255,0.2)" />
                    </LinearGradient>
                </View>

                {/* Popular Items */}
                <Text style={styles.sectionTitle}>Popular Items</Text>
                <View style={styles.grid}>
                    {PRODUCTS.map(item => (
                        <View key={item.id} style={styles.gridItemWrapper}>
                            {renderProduct({ item })}
                        </View>
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
    },
    headerTitle: {
        fontSize: fontScale(20),
        fontWeight: 'bold',
        color: '#FFF',
    },
    cartButton: {
        position: 'relative',
        padding: 4,
    },
    cartBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(5),
    },
    bannerContainer: {
        marginBottom: hp(3),
    },
    banner: {
        height: hp(15),
        borderRadius: moderateScale(16),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(5),
    },
    bannerTitle: {
        fontSize: fontScale(24),
        fontWeight: 'bold',
        color: '#FFF',
    },
    bannerSubtitle: {
        fontSize: fontScale(14),
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: hp(2),
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItemWrapper: {
        width: '48%',
        marginBottom: hp(2),
    },
    productCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: wp(3),
    },
    imageContainer: {
        height: hp(10),
        backgroundColor: '#333',
        borderRadius: moderateScale(12),
        marginBottom: hp(1),
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        gap: 4,
    },
    productCategory: {
        fontSize: fontScale(10),
        color: '#888',
        textTransform: 'uppercase',
    },
    productName: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#FFF',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    productPrice: {
        fontSize: fontScale(14),
        fontWeight: 'bold',
        color: colors.primary,
    },
    addButton: {
        backgroundColor: colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default StoreScreen;
