import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    ImageBackground,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { bookingsApi, reviewsApi } from '../api/venues';
import { useAuthStore } from '../store/authStore';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Booking {
    id: string;
    court_id: string;
    venue_name: string;
    venue_location: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    number_of_players: number;
    team_name: string | null;
    special_requests: string | null;
    price_per_hour: number;
    original_price_per_hour?: number;
    total_amount: number;
    status: string;
    created_at: string;
    payment_id?: string;
    payment_status?: string;
}

const MyBookingsScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled'
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

    const loadBookings = async (statusFilter?: string) => {
        try {
            if (!user?.id) {
                console.error('User not authenticated');
                setBookings([]);
                return;
            }

            // Get all bookings first, then filter client-side based on tab
            const result = await bookingsApi.getUserBookings(user.id);
            if (result.success) {
                // Update booking statuses based on dates
                const bookingsWithUpdatedStatus = (result.data || []).map(booking => {
                    const bookingDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
                    const now = new Date();

                    let updatedStatus = booking.status;
                    if (booking.status.toLowerCase() === 'cancelled') {
                        // Keep cancelled status as is
                        updatedStatus = 'cancelled';
                    } else if (bookingDateTime < now) {
                        // Past date or today after slot time ends
                        updatedStatus = 'completed';
                    } else {
                        // Future date
                        updatedStatus = 'upcoming';
                    }

                    return { ...booking, status: updatedStatus };
                });

                // Filter bookings based on active tab
                let filteredBookings = bookingsWithUpdatedStatus;
                const now = new Date();

                switch (activeTab) {
                    case 'upcoming':
                        // Future bookings (booking end time is after now)
                        filteredBookings = bookingsWithUpdatedStatus.filter(booking => {
                            const bookingDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
                            return bookingDateTime > now;
                        });
                        break;
                    case 'completed':
                        // Past bookings (booking end time is before now)
                        filteredBookings = bookingsWithUpdatedStatus.filter(booking => {
                            const bookingDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
                            return bookingDateTime < now;
                        });
                        break;
                    case 'cancelled':
                        // Cancelled bookings
                        filteredBookings = bookingsWithUpdatedStatus.filter(booking =>
                            booking.status.toLowerCase() === 'cancelled'
                        );
                        break;
                    default:
                        // All bookings
                        filteredBookings = bookingsWithUpdatedStatus;
                        break;
                }

                // Sort bookings by booking date (upcoming first - descending order)
                const sortedBookings = filteredBookings.sort((a, b) => {
                    const dateA = new Date(a.booking_date);
                    const dateB = new Date(b.booking_date);
                    return dateB.getTime() - dateA.getTime(); // descending (newest/upcoming first)
                });
                setBookings(sortedBookings);
            } else {
                console.error('Error loading bookings:', result.error);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return colors.success;
            case 'upcoming':
                return colors.accent; // Orange/blue color for upcoming
            case 'pending':
                return colors.accent;
            case 'completed':
                return colors.primary;
            case 'cancelled':
            case 'refunded':
                return colors.error;
            default:
                return colors.gray[500];
        }
    };

    const getStatusBadgeText = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            });
        }
    };

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'completed', label: 'Completed' },
        { key: 'cancelled', label: 'Cancelled' },
    ];

    const BookingCard: React.FC<{ booking: Booking; onReviewSubmitted: (bookingId: string) => void }> = React.memo(({ booking, onReviewSubmitted }) => {
        const [reviewRating, setReviewRating] = useState(0);
        const [reviewText, setReviewText] = useState('');
        const [isSubmittingReview, setIsSubmittingReview] = useState(false);
        const [existingReview, setExistingReview] = useState<{
            id: string;
            rating: number;
            review_text: string | null;
            created_at: string;
        } | null>(null);
        const [isEditingReview, setIsEditingReview] = useState(false);

        const isCompleted = booking.status.toLowerCase() === 'completed';
        const showReviewSection = isCompleted; // Show for all completed bookings
        const hasReview = !!existingReview;

        // Check for existing review on component mount
        useEffect(() => {
            const checkExistingReview = async () => {
                if (isCompleted) {
                    const result = await reviewsApi.hasUserReviewedBooking(booking.id);
                    if (result.success && result.data?.has_reviewed && result.data.review) {
                        setExistingReview(result.data.review);
                        // Pre-fill edit form if editing
                        if (isEditingReview) {
                            setReviewRating(result.data.review.rating);
                            setReviewText(result.data.review.review_text || '');
                        }
                    }
                }
            };
            checkExistingReview();
        }, [booking.id, isCompleted, isEditingReview]);

        const handleSubmitReview = async () => {
            if (reviewRating === 0) {
                alert('Please select a rating');
                return;
            }

            setIsSubmittingReview(true);
            try {
                const result = await reviewsApi.createReview({
                    bookingId: booking.id,
                    courtId: booking.court_id || '',
                    rating: reviewRating,
                    reviewText: reviewText.trim() || undefined
                });

                if (result.success) {
                    // Mark booking as reviewed
                    onReviewSubmitted(booking.id);
                    alert('Thank you for your review!');
                } else {
                    alert('Failed to submit review. Please try again.');
                }
            } catch (error) {
                alert('Failed to submit review. Please try again.');
            } finally {
                setIsSubmittingReview(false);
            }
        };

        return (
            <View style={styles.bookingCard}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        // Could navigate to booking details
                        console.log('Booking pressed:', booking.id);
                    }}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                            <Text style={styles.statusText}>{getStatusBadgeText(booking.status)}</Text>
                        </View>
                        <Text style={styles.bookingDate}>{formatDate(booking.booking_date)}</Text>
                    </View>

                    <Text style={styles.venueName}>{booking.venue_name}</Text>
                    <Text style={styles.venueLocation}>{booking.venue_location}</Text>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={moderateScale(16)} color={colors.text.secondary} />
                            <Text style={styles.detailText}>
                                {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="people-outline" size={moderateScale(16)} color={colors.text.secondary} />
                            <Text style={styles.detailText}>{booking.number_of_players} players</Text>
                        </View>
                    </View>

                    {booking.team_name && (
                        <View style={styles.detailItem}>
                            <Ionicons name="shield-outline" size={moderateScale(16)} color={colors.text.secondary} />
                            <Text style={styles.detailText}>{booking.team_name}</Text>
                        </View>
                    )}

                    {booking.special_requests && (
                        <View style={styles.detailItem}>
                            <Ionicons name="chatbox-outline" size={moderateScale(16)} color={colors.text.secondary} />
                            <Text style={styles.detailText}>{booking.special_requests}</Text>
                        </View>
                    )}

                    <View style={styles.cardFooter}>
                        <Text style={styles.amountText}>₹{booking.total_amount}</Text>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                setSelectedBooking(booking);
                                setShowDetailsModal(true);
                            }}
                        >
                            <Ionicons name="ellipsis-horizontal" size={moderateScale(20)} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Review Section - Show input form or existing review */}
                {showReviewSection && (
                    <View style={styles.reviewSection}>
                        {!hasReview ? (
                            // Input form for new reviews
                            <>
                                <Text style={styles.reviewTitle}>Rate Your Experience</Text>

                                {/* Star Rating */}
                                <View style={styles.ratingContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setReviewRating(star)}
                                            style={styles.starButton}
                                        >
                                            <Ionicons
                                                name={star <= reviewRating ? "star" : "star-outline"}
                                                size={moderateScale(24)}
                                                color={star <= reviewRating ? colors.warning : colors.gray[400]}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Review Text Input */}
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Share your experience (optional)"
                                    value={reviewText}
                                    onChangeText={setReviewText}
                                    multiline
                                    numberOfLines={3}
                                    maxLength={500}
                                />

                                {/* Submit Button */}
                                <TouchableOpacity
                                    style={[styles.submitReviewButton, (!reviewRating || isSubmittingReview) && styles.submitReviewButtonDisabled]}
                                    onPress={handleSubmitReview}
                                    disabled={!reviewRating || isSubmittingReview}
                                >
                                    {isSubmittingReview ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                    ) : (
                                        <Text style={styles.submitReviewButtonText}>Submit Review</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            // Display existing review
                            existingReview && (
                                <>
                                    <Text style={styles.reviewTitle}>Your Review</Text>

                                    {/* Existing Star Rating (read-only) */}
                                    <View style={styles.ratingContainer}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <View key={star} style={styles.starButton}>
                                                <Ionicons
                                                    name={star <= existingReview.rating ? "star" : "star-outline"}
                                                    size={moderateScale(24)}
                                                    color={star <= existingReview.rating ? colors.warning : colors.gray[400]}
                                                />
                                            </View>
                                        ))}
                                    </View>

                                    {/* Existing Review Text (read-only) */}
                                    {existingReview.review_text && (
                                        <View style={styles.existingReviewContainer}>
                                            <Text style={styles.existingReviewText}>
                                                {existingReview.review_text}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Review Date */}
                                    <Text style={styles.reviewDate}>
                                        Reviewed on {new Date(existingReview.created_at).toLocaleDateString('en-IN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                </>
                            )
                        )}
                    </View>
                )}
            </View>
        );
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading your bookings...</Text>
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
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={{ width: wp(10) }} />
            </View>

            {/* Tab Filters */}
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            activeTab === tab.key && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.activeTabText,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bookings List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {bookings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={moderateScale(64)} color={colors.gray[300]} />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'all' ? 'No bookings found' :
                                activeTab === 'upcoming' ? 'No upcoming bookings' :
                                    activeTab === 'completed' ? 'No completed bookings' : 'No cancelled bookings'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'all' ? 'Your bookings will appear here once you make them' : 'Try changing the filter'}
                        </Text>
                    </View>
                ) : (
                    bookings.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onReviewSubmitted={(bookingId) => setReviewedBookings(prev => new Set([...prev, bookingId]))}
                        />
                    ))
                )}

                {/* Spacer for bottom */}
                <View style={{ height: hp(10) }} />
            </ScrollView>

            {/* Booking Details Modal */}
            <Modal
                visible={showDetailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Booking Details</Text>
                            <TouchableOpacity
                                onPress={() => setShowDetailsModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={moderateScale(24)} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {selectedBooking && (
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                {/* Action Buttons for Completed Bookings */}
                                {selectedBooking.status.toLowerCase() === 'completed' && (
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.modalActionButton}
                                            onPress={async () => {
                                                // Check if review exists for this booking
                                                const result = await reviewsApi.hasUserReviewedBooking(selectedBooking.id);
                                                if (result.success && result.data?.has_reviewed) {
                                                    // Edit existing review - close modal and trigger edit in card
                                                    setShowDetailsModal(false);
                                                    // Find the booking card and trigger edit mode
                                                    // This is a bit complex, so for now we'll show an alert
                                                    alert('Edit review functionality will be available soon!');
                                                } else {
                                                    // No review exists - close modal and scroll to review section
                                                    setShowDetailsModal(false);
                                                    alert('Scroll down in your booking card to add a review!');
                                                }
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={moderateScale(16)} color={colors.primary} />
                                            <Text style={styles.modalActionText}>
                                                {(() => {
                                                    // Async check for review existence
                                                    reviewsApi.hasUserReviewedBooking(selectedBooking.id).then(result => {
                                                        // This is not ideal - we should check synchronously or use state
                                                    });
                                                    return 'Add/Edit Review';
                                                })()}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Court Name */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Court Name</Text>
                                    <Text style={styles.detailValue}>{selectedBooking.venue_name}</Text>
                                </View>

                                {/* Date & Time */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Date & Time</Text>
                                    <Text style={styles.detailValue}>
                                        {new Date(selectedBooking.booking_date).toLocaleDateString('en-IN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {selectedBooking.start_time.slice(0, 5)} - {selectedBooking.end_time.slice(0, 5)}
                                    </Text>
                                </View>

                                {/* Number of Players */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Number of Players</Text>
                                    <Text style={styles.detailValue}>{selectedBooking.number_of_players}</Text>
                                </View>

                                {/* Booking ID */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Booking ID</Text>
                                    <Text style={styles.detailValue}>{selectedBooking.id}</Text>
                                </View>

                                {/* Payment Details */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Payment Details</Text>
                                    {selectedBooking.original_price_per_hour && selectedBooking.original_price_per_hour > selectedBooking.price_per_hour ? (
                                        <>
                                            <Text style={styles.detailValue}>Original Price: ₹{selectedBooking.original_price_per_hour}</Text>
                                            <Text style={styles.detailValue}>Discount: ₹{(selectedBooking.original_price_per_hour - selectedBooking.price_per_hour).toFixed(2)}</Text>
                                            <Text style={styles.detailValue}>Final Paid Price: ₹{selectedBooking.total_amount}</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.detailValue}>Total Amount: ₹{selectedBooking.total_amount}</Text>
                                    )}
                                    <Text style={styles.detailValue}>Status: {getStatusBadgeText(selectedBooking.payment_status || 'pending')}</Text>
                                    {selectedBooking.payment_id && (
                                        <Text style={styles.detailValue}>Payment ID: {selectedBooking.payment_id}</Text>
                                    )}
                                </View>

                                {/* Team Name */}
                                {selectedBooking.team_name && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Team Name</Text>
                                        <Text style={styles.detailValue}>{selectedBooking.team_name}</Text>
                                    </View>
                                )}

                                {/* Special Requests */}
                                {selectedBooking.special_requests && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Special Requests</Text>
                                        <Text style={styles.detailValue}>{selectedBooking.special_requests}</Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    tabButton: {
        flex: 1,
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        borderRadius: moderateScale(20),
        alignItems: 'center',
        marginHorizontal: wp(1),
    },
    activeTabButton: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: fontScale(12),
        fontWeight: '600',
        color: colors.text.secondary,
    },
    activeTabText: {
        color: colors.white,
    },
    scrollContent: {
        padding: wp(5),
        paddingTop: hp(2),
    },
    bookingCard: {
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
    bookingCardImage: {
        borderRadius: moderateScale(16),
    },
    bookingCardOverlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    statusBadge: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.5),
        borderRadius: moderateScale(12),
    },
    statusText: {
        fontSize: fontScale(11),
        fontWeight: '700',
        color: colors.white,
    },
    bookingDate: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.secondary,
    },
    venueName: {
        fontSize: fontScale(16),
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 4,
    },
    venueLocation: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        marginBottom: hp(1.5),
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: hp(1),
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: wp(4),
        marginBottom: hp(0.5),
    },
    detailText: {
        fontSize: fontScale(13),
        color: colors.text.secondary,
        marginLeft: wp(1),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(1),
        paddingTop: hp(1),
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    amountText: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: colors.primary,
    },
    actionButton: {
        padding: wp(1),
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
        maxWidth: wp(60),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        maxHeight: hp(80),
        minHeight: hp(40),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(5),
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    modalTitle: {
        fontSize: fontScale(18),
        fontWeight: '700',
        color: colors.text.primary,
    },
    closeButton: {
        padding: wp(1),
    },
    modalBody: {
        padding: wp(5),
    },
    detailSection: {
        marginBottom: hp(2),
    },
    detailLabel: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: hp(0.5),
    },
    detailValue: {
        fontSize: fontScale(16),
        color: colors.text.primary,
        marginBottom: hp(0.5),
    },
    reviewSection: {
        marginTop: hp(2),
        paddingTop: hp(2),
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    reviewTitle: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: hp(1.5),
        textAlign: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: hp(1.5),
    },
    starButton: {
        padding: wp(1),
        marginHorizontal: wp(0.5),
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: colors.border.light,
        borderRadius: moderateScale(8),
        padding: wp(3),
        fontSize: fontScale(14),
        color: colors.text.primary,
        backgroundColor: colors.background.secondary,
        minHeight: hp(8),
        textAlignVertical: 'top',
        marginBottom: hp(1.5),
    },
    submitReviewButton: {
        backgroundColor: colors.primary,
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(8),
        alignItems: 'center',
    },
    submitReviewButtonDisabled: {
        backgroundColor: colors.gray[400],
    },
    submitReviewButtonText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.white,
    },
    existingReviewContainer: {
        backgroundColor: colors.background.secondary,
        borderRadius: moderateScale(8),
        padding: wp(3),
        marginBottom: hp(1),
    },
    existingReviewText: {
        fontSize: fontScale(14),
        color: colors.text.primary,
        lineHeight: fontScale(20),
    },
    reviewDate: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    modalActions: {
        marginBottom: hp(2),
        padding: wp(3),
        backgroundColor: colors.background.secondary,
        borderRadius: moderateScale(8),
    },
    modalActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(2),
        backgroundColor: colors.primary,
        borderRadius: moderateScale(6),
    },
    modalActionText: {
        fontSize: fontScale(14),
        fontWeight: '600',
        color: colors.white,
        marginLeft: wp(2),
    },
});

export default MyBookingsScreen;
