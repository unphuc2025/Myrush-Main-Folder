import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { paymentsApi, PaymentMethod } from '../api/payments';

const PaymentsScreen = () => {
    const navigation = useNavigation<any>();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        setIsLoading(true);
        const response = await paymentsApi.getMethods();
        if (response.success) {
            setMethods(response.data);
        }
        setIsLoading(false);
    };

    const handleDeleteMethod = (id: string) => {
        Alert.alert(
            'Delete Payment Method',
            'Are you sure you want to remove this payment method?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const response = await paymentsApi.deleteMethod(id);
                        if (response.success) {
                            setMethods(prev => prev.filter(m => m.id !== id));
                        } else {
                            Alert.alert('Error', response.error || 'Failed to delete method');
                        }
                    }
                }
            ]
        );
    };

    const handleSetDefault = async (id: string) => {
        const response = await paymentsApi.setDefault(id);
        if (response.success) {
            setMethods(prev => prev.map(m => ({
                ...m,
                is_default: m.id === id
            })));
        }
    };

    const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
        <View style={styles.methodCard}>
            <View style={styles.methodIcon}>
                <Ionicons
                    name={item.type === 'card' ? "card" : "phone-portrait"}
                    size={moderateScale(24)}
                    color={colors.primary}
                />
            </View>
            <View style={styles.methodDetails}>
                <Text style={styles.methodTitle}>
                    {item.type === 'card' ? `**** ${item.details.last4 || '****'}` : item.details.upi_id}
                </Text>
                <Text style={styles.methodSubtitle}>
                    {item.type === 'card' ? item.provider || 'Credit/Debit Card' : 'UPI'}
                </Text>
            </View>
            {item.is_default && (
                <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                </View>
            )}
            <TouchableOpacity onPress={() => handleDeleteMethod(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF453A" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payments</Text>
                <View style={{ width: moderateScale(24) }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>MyRush Credits</Text>
                    <Text style={styles.balanceAmount}>₹0.00</Text>
                    <TouchableOpacity style={styles.addMoneyButton}>
                        <Text style={styles.addMoneyText}>+ Add Money</Text>
                    </TouchableOpacity>
                </View>

                {/* Saved Methods */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
                        <TouchableOpacity onPress={() => Alert.alert('Add Method', 'External payment gateway integration is coming soon.')}>
                            <Text style={styles.addText}>Add New</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: hp(2) }} />
                    ) : methods.length > 0 ? (
                        methods.map(item => (
                            <TouchableOpacity key={item.id} onPress={() => handleSetDefault(item.id)}>
                                {renderPaymentMethod({ item })}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>No saved payment methods</Text>
                        </View>
                    )}
                </View>

                {/* Transaction History Placeholder */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <View style={styles.historyPlaceholder}>
                        <Ionicons name="receipt-outline" size={moderateScale(40)} color="#333" />
                        <Text style={styles.emptyText}>No recent transactions</Text>
                    </View>
                </View>

                <View style={styles.footerSpacer} />
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
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: '#1C1C1E',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: wp(5),
    },
    balanceCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(16),
        padding: wp(6),
        marginTop: hp(2),
        marginBottom: hp(3),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    balanceLabel: {
        color: '#888',
        fontSize: fontScale(14),
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: fontScale(32),
        fontWeight: 'bold',
        marginBottom: 16,
    },
    addMoneyButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.2),
        borderRadius: moderateScale(20),
    },
    addMoneyText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: fontScale(14),
    },
    section: {
        marginBottom: hp(4),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#fff',
    },
    addText: {
        color: colors.primary,
        fontSize: fontScale(14),
        fontWeight: '600',
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: wp(4),
        borderRadius: moderateScale(12),
        marginBottom: hp(1.5),
        borderWidth: 1,
        borderColor: '#333',
    },
    methodIcon: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(8),
        backgroundColor: 'rgba(212, 255, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    methodDetails: {
        flex: 1,
    },
    methodTitle: {
        color: '#fff',
        fontSize: fontScale(15),
        fontWeight: '600',
        marginBottom: 2,
    },
    methodSubtitle: {
        color: '#888',
        fontSize: fontScale(12),
    },
    defaultBadge: {
        backgroundColor: 'rgba(57, 224, 121, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: wp(2),
    },
    defaultText: {
        color: '#39E079',
        fontSize: fontScale(10),
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: wp(2),
    },
    emptyBox: {
        paddingVertical: hp(4),
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#666',
        fontSize: fontScale(14),
        marginTop: 8,
    },
    historyPlaceholder: {
        paddingVertical: hp(6),
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#333',
    },
    footerSpacer: {
        height: hp(5),
    }
});

export default PaymentsScreen;
