import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SupportScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Ionicons name="headset-outline" size={80} color={colors.primary} />
                <Text style={styles.title}>Help & Support</Text>
                <Text style={styles.subtitle}>Need help? Chat with us or view FAQs.</Text>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Contact Us</Text>
                </TouchableOpacity>
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
    actionButton: {
        marginTop: 40,
        backgroundColor: colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
    },
    actionButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: fontScale(16),
    },
});

export default SupportScreen;
