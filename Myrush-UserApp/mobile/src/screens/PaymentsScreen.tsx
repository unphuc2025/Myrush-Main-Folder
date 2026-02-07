import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PaymentsScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payments</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Ionicons name="card-outline" size={80} color={colors.primary} />
                <Text style={styles.title}>Payment History</Text>
                <Text style={styles.subtitle}>View your transactions and billing details here.</Text>
                <View style={styles.placeholderBox}>
                    <Text style={styles.placeholderText}>Coming Soon</Text>
                </View>
            </View>
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
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: fontScale(20),
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(10),
    },
    title: {
        fontSize: fontScale(24),
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 20,
    },
    subtitle: {
        fontSize: fontScale(16),
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
    },
    placeholderBox: {
        marginTop: 40,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    placeholderText: {
        color: colors.primary,
        fontWeight: '600',
    },
});

export default PaymentsScreen;
