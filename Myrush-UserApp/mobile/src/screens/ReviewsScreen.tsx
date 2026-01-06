import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { reviewsApi } from '../api/venues';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Review {
    id: string;
    user_id: string;
    booking_id: string;
    court_id: string;
    court_name: string;
    rating: number;
    review_text: string | null;
    created_at: string;
    updated_at: string;
}

const ReviewsScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadReviews = async () => {
        try {
            const result = await reviewsApi.getUserReviews();
            if (result.success) {
                setReviews(result.data || []);
            } else {
                console.error('Error loading reviews:', result.error);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadReviews();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.courtInfo}>
                    <Text style={styles.courtName}>
                        Court: {review.court_name || 'Unknown Court'}
                    </Text>
                    <Text style={styles.bookingId}>
                        Booking: {review.booking_id.slice(-8)}
                    </Text>
                </View>
                <Text style={styles.reviewDate}>
                    {formatDate(review.created_at)}
                </Text>
            </View>

            {/* Star Rating */}
            <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <View key={star} style={styles.starContainer}>
                        <Ionicons
                            name={star <= review.rating ? "star" : "star-outline"}
                            size={moderateScale(20)}
                            color={star <= review.rating ? colors.warning : colors.gray[400]}
                        />
                    </View>
                ))}
                <Text style={styles.ratingText}>
                    {review.rating}/5
                </Text>
            </View>

            {/* Review Text */}
            {review.review_text && (
                <View style={styles.reviewTextContainer}>
                    <Text style={styles.reviewText}>
                        {review.review_text}
                    </Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading your reviews...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Reviews & Ratings</Text>
                <View style={{ width: wp(10) }} />
            </View>

            {/* Reviews List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {reviews.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="star-outline" size={moderateScale(64)} color={colors.gray[300]} />
                        <Text style={styles.emptyTitle}>No reviews yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Your submitted reviews will appear here once you rate your completed bookings.
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryText}>
                                You have submitted {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </>
                )}

                {/* Spacer for bottom */}
                <View style={{ height: hp(10) }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
    },
    loadingText: {
        marginTop: hp(2),
        fontSize: fontScale(16),
        color: colors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(6),
        paddingBottom: hp(2),
        backgroundColor: colors.background.primary,
    },
    backButton: {
        width: wp(10),
        height: wp(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: colors.text.primary,
    },
    scrollContent: {
        padding: wp(5),
        paddingTop: hp(2),
    },
    summaryContainer: {
        backgroundColor: colors.primary,
        padding: wp(4),
        borderRadius: moderateScale(12),
        marginBottom: hp(2),
    },
    summaryText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.white,
        textAlign: 'center',
    },
    reviewCard: {
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(16),
        padding: wp(4),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(1.5),
    },
    courtInfo: {
        flex: 1,
    },
    courtName: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: hp(0.5),
    },
    bookingId: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
    },
    reviewDate: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
        textAlign: 'right',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    starContainer: {
        marginRight: wp(1),
    },
    ratingText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.primary,
        marginLeft: wp(2),
    },
    reviewTextContainer: {
        backgroundColor: colors.background.secondary,
        borderRadius: moderateScale(8),
        padding: wp(3),
    },
    reviewText: {
        fontSize: fontScale(14),
        color: colors.text.primary,
        lineHeight: fontScale(20),
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: hp(10),
    },
    emptyTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: hp(2),
        marginBottom: hp(1),
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        textAlign: 'center',
        maxWidth: wp(70),
        lineHeight: fontScale(20),
    },
});

export default ReviewsScreen;
