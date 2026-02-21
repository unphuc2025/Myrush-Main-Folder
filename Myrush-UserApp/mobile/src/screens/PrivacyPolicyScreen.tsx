import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { profileApi } from '../api/profile';

const PrivacyPolicyScreen = () => {
    const navigation = useNavigation();
    const [policy, setPolicy] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPolicy();
    }, []);

    const fetchPolicy = async () => {
        setIsLoading(true);
        const response = await profileApi.getPrivacyPolicy();
        if (response.success) {
            setPolicy(response.data);
            setError(null);
        } else {
            setError(response.error || 'Failed to load privacy policy');
        }
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={moderateScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: moderateScale(24) }} />
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={moderateScale(48)} color="#444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchPolicy}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.policyTitle}>{policy?.name || 'Privacy Policy'}</Text>
                    {policy?.updated_at && (
                        <Text style={styles.updatedDate}>Last updated: {new Date(policy.updated_at).toLocaleDateString()}</Text>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.policyContent}>
                        {policy?.content || 'No content available.'}
                    </Text>

                    <View style={styles.footerSpacer} />
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingTop: Platform.OS === 'ios' ? hp(6) : hp(2),
        paddingBottom: hp(2),
        backgroundColor: '#1C1C1E',
    },
    backButton: {
        padding: wp(1),
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(10),
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: wp(5),
    },
    policyTitle: {
        fontSize: fontScale(22),
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: hp(1),
    },
    updatedDate: {
        fontSize: fontScale(12),
        color: '#888',
        marginBottom: hp(2),
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginBottom: hp(2),
    },
    policyContent: {
        fontSize: fontScale(14),
        lineHeight: fontScale(22),
        color: '#ccc',
    },
    errorText: {
        color: '#888',
        fontSize: fontScale(14),
        textAlign: 'center',
        marginTop: hp(2),
        marginBottom: hp(3),
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: wp(6),
        paddingVertical: hp(1.2),
        borderRadius: moderateScale(20),
    },
    retryText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: fontScale(14),
    },
    footerSpacer: {
        height: hp(5),
    }
});

export default PrivacyPolicyScreen;
