import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { reviewsApi } from '../api/venues';

interface UnreviewedBooking {
    id: string;
    court_id: string;
    court_name: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    venue_name?: string;
}

interface ReviewReminderModalProps {
    visible: boolean;
    booking: UnreviewedBooking | null;
    onGiveRating: (booking: UnreviewedBooking) => void;
    onSkip: () => void;
    onClose: () => void;
    loading?: boolean;
}

const ReviewReminderModal: React.FC<ReviewReminderModalProps> = ({
    visible,
    booking,
    onGiveRating,
    onSkip,
    onClose,
    loading = false,
}) => {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!booking) return null;

    const handleGiveRating = () => {
        setShowReviewForm(true);
    };

    const handleSubmitReview = async () => {
        if (rating === 0) return; // Require at least a rating

        setSubmitting(true);
        try {
            const result = await reviewsApi.createReview({
                bookingId: booking.id,
                courtId: booking.court_id,
                rating: rating,
                reviewText: reviewText.trim() || undefined,
            });

            if (result.success) {
                // Successfully submitted review, show success message
                setShowReviewForm(false);
                setShowSuccess(true);

                // Auto-close after 3 seconds
                setTimeout(() => {
                    setShowSuccess(false);
                    onClose();
                }, 3000);
            } else {
                console.error('Failed to submit review:', result.error);
                // Could show error message here
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToReminder = () => {
        setShowReviewForm(false);
        setRating(0);
        setReviewText('');
    };

    const renderStarRating = () => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={star <= rating ? "star" : "star-outline"}
                            size={moderateScale(32)}
                            color={star <= rating ? "#FFB800" : colors.gray[300]}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? hp(5) : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.modalContainer, showReviewForm && styles.modalContainerExpanded]}>
                        {/* Close button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={moderateScale(24)} color={colors.text.secondary} />
                        </TouchableOpacity>

                        {/* Back button for review form */}
                        {showReviewForm && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBackToReminder}
                            >
                                <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.text.secondary} />
                            </TouchableOpacity>
                        )}

                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={showSuccess ? "checkmark-circle" : showReviewForm ? "create-outline" : "star-outline"}
                                size={moderateScale(48)}
                                color={showSuccess ? "#4CAF50" : colors.primary}
                            />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>
                            {showSuccess ? "Thank You!" : showReviewForm ? "Rate & Review" : "Game Completed!"}
                        </Text>

                        {/* Court Info */}
                        <View style={styles.courtInfo}>
                            <Text style={styles.courtLabel}>Court:</Text>
                            <Text style={styles.courtName}>{booking.court_name}</Text>
                        </View>

                        {/* Booking Time */}
                        <View style={styles.timeInfo}>
                            <Text style={styles.timeText}>
                                {new Date(booking.booking_date).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                })} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                            </Text>
                        </View>

                        {showSuccess ? (
                            // Success View
                            <>
                                <Text style={styles.successMessage}>
                                    Thank you for your review! Your feedback helps improve our courts.
                                </Text>

                            </>
                        ) : showReviewForm ? (
                            // Review Form
                            <>
                                {/* Star Rating */}
                                <Text style={styles.ratingLabel}>How was your experience?</Text>
                                {renderStarRating()}

                                {/* Review Text Input */}
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Share your experience (optional)"
                                    placeholderTextColor={colors.gray[400]}
                                    value={reviewText}
                                    onChangeText={setReviewText}
                                    multiline
                                    maxLength={500}
                                    textAlignVertical="top"
                                />

                                {/* Submit Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        (rating === 0 || submitting) && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleSubmitReview}
                                    disabled={rating === 0 || submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Submit Review</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            // Reminder View
                            <>
                                {/* Message */}
                                <Text style={styles.message}>
                                    Your game is completed. Would you like to rate and review your court?
                                </Text>

                                {/* Buttons */}
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.skipButton]}
                                        onPress={onSkip}
                                        disabled={loading}
                                    >
                                        <Text style={styles.skipButtonText}>Later</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.button, styles.ratingButton]}
                                        onPress={handleGiveRating}
                                        disabled={loading}
                                    >
                                        <Ionicons name="star" size={moderateScale(16)} color={colors.white} />
                                        <Text style={styles.ratingButtonText}>Give Rating</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Footer note */}
                                <Text style={styles.footerText}>
                                    You can always review later from My Bookings
                                </Text>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(5),
    },
    modalContainer: {
        backgroundColor: colors.background.primary,
        borderRadius: moderateScale(20),
        padding: wp(6),
        width: '90%',
        maxWidth: wp(85),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    modalContainerExpanded: {
        maxHeight: hp(80), // Allow more height for review form
    },
    closeButton: {
        position: 'absolute',
        top: wp(4),
        right: wp(4),
        padding: wp(1),
    },
    iconContainer: {
        marginBottom: hp(2),
        padding: wp(4),
        backgroundColor: colors.background.secondary,
        borderRadius: moderateScale(50),
    },
    title: {
        fontSize: fontScale(22),
        fontWeight: '700',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: hp(1.5),
    },
    message: {
        fontSize: fontScale(16),
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: fontScale(22),
        marginBottom: hp(2),
    },
    courtInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: moderateScale(25),
        marginBottom: hp(1.5),
    },
    courtLabel: {
        fontSize: fontScale(14),
        color: colors.white,
        marginRight: wp(2),
    },
    courtName: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.white,
    },
    timeInfo: {
        marginBottom: hp(3),
    },
    timeText: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: wp(3),
        marginBottom: hp(2),
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(12),
        gap: wp(2),
    },
    skipButton: {
        backgroundColor: colors.gray[100],
        borderWidth: 1,
        borderColor: colors.gray[300],
    },
    skipButtonText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.text.secondary,
    },
    ratingButton: {
        backgroundColor: colors.primary,
    },
    ratingButtonText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.white,
    },
    backButton: {
        position: 'absolute',
        top: wp(4),
        left: wp(4),
        padding: wp(1),
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: hp(2),
        gap: wp(2),
    },
    starButton: {
        padding: wp(1),
    },
    ratingLabel: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: hp(1.5),
    },
    reviewInput: {
        width: '100%',
        height: hp(12),
        borderWidth: 1,
        borderColor: colors.gray[300],
        borderRadius: moderateScale(12),
        padding: wp(4),
        fontSize: fontScale(14),
        color: colors.text.primary,
        backgroundColor: colors.background.secondary,
        marginBottom: hp(2),
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(8),
        borderRadius: moderateScale(12),
        minWidth: wp(40),
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: colors.gray[300],
    },
    submitButtonText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: colors.white,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(5),
    },
    successMessage: {
        fontSize: fontScale(16),
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: fontScale(22),
        marginBottom: hp(1.5),
    },
    successSubMessage: {
        fontSize: fontScale(14),
        color: colors.gray[500],
        textAlign: 'center',
        fontStyle: 'italic',
    },
    footerText: {
        fontSize: fontScale(12),
        color: colors.text.secondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default ReviewReminderModal;
