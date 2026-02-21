import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, LayoutAnimation, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { profileApi } from '../api/profile';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.faqCard}>
            <TouchableOpacity style={styles.faqHeader} onPress={toggleExpand} activeOpacity={0.7}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={moderateScale(18)}
                    color={colors.primary}
                />
            </TouchableOpacity>
            {expanded && (
                <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{answer}</Text>
                </View>
            )}
        </View>
    );
};

const SupportScreen = () => {
    const navigation = useNavigation<any>();
    const [faqs, setFaqs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setIsLoading(true);
        const response = await profileApi.getFaqs();
        if (response.success && response.data) {
            setFaqs(response.data.items || []);
            setError(null);
        } else {
            setError(response.error || 'Failed to load FAQs');
        }
        setIsLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support</Text>
                <View style={{ width: moderateScale(24) }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Contact Section */}
                <View style={styles.contactSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="headset-outline" size={moderateScale(40)} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>How can we help?</Text>
                    <Text style={styles.subtitle}>Our team is here to support you 24/7</Text>

                    <View style={styles.contactOptions}>
                        <TouchableOpacity style={styles.contactCard}>
                            <Ionicons name="chatbubble-ellipses" size={moderateScale(24)} color={colors.primary} />
                            <Text style={styles.contactLabel}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard}>
                            <Ionicons name="mail" size={moderateScale(24)} color={colors.primary} />
                            <Text style={styles.contactLabel}>Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard}>
                            <Ionicons name="call" size={moderateScale(24)} color={colors.primary} />
                            <Text style={styles.contactLabel}>Call</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: hp(2) }} />
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={fetchFaqs}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : faqs.length > 0 ? (
                        faqs.map((item, index) => (
                            <FAQItem key={item.id || index} question={item.question} answer={item.answer} />
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No FAQs available at the moment.</Text>
                    )}
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
    },
    scrollContainer: {
        padding: wp(5),
    },
    contactSection: {
        alignItems: 'center',
        marginBottom: hp(4),
        paddingVertical: hp(2),
    },
    iconCircle: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(40),
        backgroundColor: 'rgba(212, 255, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    title: {
        fontSize: fontScale(22),
        fontWeight: 'bold',
        color: '#FFF',
    },
    subtitle: {
        fontSize: fontScale(14),
        color: '#888',
        textAlign: 'center',
        marginTop: 6,
    },
    contactOptions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: hp(3),
        gap: wp(4),
    },
    contactCard: {
        width: wp(22),
        backgroundColor: '#1C1C1E',
        paddingVertical: hp(2),
        borderRadius: moderateScale(16),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    contactLabel: {
        color: '#fff',
        fontSize: fontScale(12),
        fontWeight: '600',
        marginTop: 8,
    },
    faqSection: {
        marginTop: hp(2),
    },
    sectionTitle: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: '#fff',
        marginBottom: hp(2),
    },
    faqCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        marginBottom: hp(1.5),
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(4),
    },
    faqQuestion: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        marginRight: wp(2),
    },
    faqAnswerContainer: {
        paddingHorizontal: wp(4),
        paddingBottom: wp(4),
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: wp(3),
    },
    faqAnswer: {
        fontSize: fontScale(13),
        lineHeight: fontScale(18),
        color: '#aaa',
    },
    errorContainer: {
        alignItems: 'center',
        marginTop: hp(2),
    },
    errorText: {
        color: '#666',
        fontSize: fontScale(14),
    },
    retryText: {
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 8,
    },
    noDataText: {
        color: '#666',
        textAlign: 'center',
        marginTop: hp(2),
    },
    footerSpacer: {
        height: hp(10),
    }
});

export default SupportScreen;
