import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bookingsApi } from '../api/bookings';
import { TopNav } from '../components/TopNav';
import './MyBookings.css';

interface Booking {
    id: string;
    booking_display_id?: string;
    venue_name: string;
    venue_location: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    price_per_hour: number;
    total_amount: number;
    status: string;
    created_at: string;
    time_slots?: any[];
    court_id?: string;
}

interface ReviewData {
    has_reviewed: boolean;
    review?: {
        rating: number;
        review_text: string;
    };
}

export const MyBookings: React.FC = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
    const [loading, setLoading] = useState(true);
    const [reviewStates, setReviewStates] = useState<Record<string, ReviewData>>({});
    const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadBookings();
    }, [activeTab]);

    const loadBookings = async () => {
        setLoading(true);
        const res = await bookingsApi.getUserBookings();
        if (res.success && res.data) {
            let processedBookings = res.data.map((b: Booking) => {
                let status = b.status.toLowerCase();
                if (status !== 'cancelled') {
                    const bookingTime = new Date(`${b.booking_date}T${b.end_time}`);
                    if (bookingTime < new Date()) {
                        status = 'completed';
                    } else {
                        status = 'upcoming';
                    }
                }
                return { ...b, status };
            });

            if (activeTab !== 'all') {
                processedBookings = processedBookings.filter((b: Booking) => b.status === activeTab);
            }

            processedBookings.sort((a: Booking, b: Booking) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
            setBookings(processedBookings);

            // Check review status for completed bookings
            const completed = processedBookings.filter((b: Booking) => b.status === 'completed');
            for (const booking of completed) {
                const reviewRes = await bookingsApi.checkBookingReviewed(booking.id);
                if (reviewRes.success) {
                    setReviewStates(prev => ({
                        ...prev,
                        [booking.id]: reviewRes.data
                    }));
                }
            }
        }
        setLoading(false);
    };

    const handleSubmitReview = async (bookingId: string, courtId: string) => {
        if (selectedRating === 0) {
            alert('Please select a rating');
            return;
        }

        const res = await bookingsApi.submitReview(bookingId, courtId, selectedRating, reviewText);
        if (res.success) {
            setReviewStates(prev => ({
                ...prev,
                [bookingId]: {
                    has_reviewed: true,
                    review: { rating: selectedRating, review_text: reviewText }
                }
            }));
            setShowRatingModal(null);
            setSelectedRating(0);
            setReviewText('');
            alert('Review submitted successfully!');
        } else {
            alert('Failed to submit review. Please try again.');
        }
    };

    const getStatusBadge = (status: string) => {
        let className = 'status-badge-modern';
        switch (status) {
            case 'completed': className += ' completed'; break;
            case 'upcoming': className += ' upcoming'; break;
            case 'cancelled': className += ' cancelled'; break;
            default: className += ' default';
        }
        return <span className={className}>{status}</span>;
    };

    const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
        return (
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                        onClick={() => interactive && onRate && onRate(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const toggleCardExpansion = (bookingId: string) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookingId)) {
                newSet.delete(bookingId);
            } else {
                newSet.add(bookingId);
            }
            return newSet;
        });
    };

    return (
        <div className="my-bookings-page-modern">
            <TopNav />

            <div className="bookings-container">
                <header className="bookings-header">
                    <h1>My Bookings</h1>
                    <p>View and manage your court bookings</p>
                </header>

                <div className="tabs-modern">
                    {['all', 'upcoming', 'completed', 'cancelled'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn-modern ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab as any)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <main className="bookings-grid">
                    {loading ? (
                        <div className="loading-modern">Loading your bookings...</div>
                    ) : bookings.length === 0 ? (
                        <div className="empty-state-modern">
                            <span className="empty-icon">📅</span>
                            <h3>No {activeTab !== 'all' ? activeTab : ''} bookings found</h3>
                            <p>Book a venue to get started!</p>
                            <button className="cta-btn" onClick={() => navigate('/venues')}>Browse Venues</button>
                        </div>
                    ) : (
                        bookings.map(booking => (
                            <motion.div
                                key={booking.id}
                                className="booking-card-modern"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="card-header-modern">
                                    <div className="date-badge">
                                        <span className="day">{new Date(booking.booking_date).getDate()}</span>
                                        <span className="month">{new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                                    {getStatusBadge(booking.status)}
                                </div>

                                <div className="card-body-modern">
                                    <h3 className="venue-name">{booking.venue_name}</h3>
                                    <p className="location-text">📍 {booking.venue_location}</p>

                                    <div className="booking-details">
                                        <div className="detail-item">
                                            <span className="label">Time</span>
                                            <span className="value">🕒 {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Amount</span>
                                            <span className="value price">₹{booking.total_amount}</span>
                                        </div>
                                    </div>

                                    <div className="booking-id-row">
                                        <span>Booking ID: {booking.booking_display_id || booking.id.slice(0, 8)}</span>
                                        <button
                                            className="view-details-btn"
                                            onClick={() => toggleCardExpansion(booking.id)}
                                        >
                                            {expandedCards.has(booking.id) ? '▲ Hide Details' : '▼ View Details'}
                                        </button>
                                    </div>

                                    {/* Expanded Details Section */}
                                    {expandedCards.has(booking.id) && (
                                        <div className="expanded-details">
                                            <h4>Complete Booking Information</h4>

                                            <div className="detail-grid">
                                                <div className="detail-row">
                                                    <span className="detail-label">🏟️ Court Name:</span>
                                                    <span className="detail-value">{booking.venue_name}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">📍 Location:</span>
                                                    <span className="detail-value">{booking.venue_location}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">📅 Booking Date:</span>
                                                    <span className="detail-value">
                                                        {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">🕒 Start Time:</span>
                                                    <span className="detail-value">{booking.start_time.slice(0, 5)}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">🕐 End Time:</span>
                                                    <span className="detail-value">{booking.end_time.slice(0, 5)}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">⏱️ Duration:</span>
                                                    <span className="detail-value">
                                                        {(() => {
                                                            const start = new Date(`2000-01-01T${booking.start_time}`);
                                                            const end = new Date(`2000-01-01T${booking.end_time}`);
                                                            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                                                            return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                                                        })()}
                                                    </span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">💰 Price per Hour:</span>
                                                    <span className="detail-value">₹{booking.price_per_hour}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">💵 Total Amount:</span>
                                                    <span className="detail-value highlight">₹{booking.total_amount}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">🆔 Booking ID:</span>
                                                    <span className="detail-value">{booking.booking_display_id || booking.id}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">📊 Status:</span>
                                                    <span className="detail-value">{getStatusBadge(booking.status)}</span>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">📝 Created On:</span>
                                                    <span className="detail-value">
                                                        {new Date(booking.created_at).toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rating Section for Completed Bookings */}
                                    {booking.status === 'completed' && (
                                        <div className="rating-section">
                                            {reviewStates[booking.id]?.has_reviewed ? (
                                                <div className="existing-review">
                                                    <p className="review-label">Your Rating:</p>
                                                    {renderStars(reviewStates[booking.id].review?.rating || 0)}
                                                    {reviewStates[booking.id].review?.review_text && (
                                                        <p className="review-text">"{reviewStates[booking.id].review?.review_text}"</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    className="rate-btn"
                                                    onClick={() => setShowRatingModal(booking.id)}
                                                >
                                                    ⭐ Rate Your Experience
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Rating Modal */}
                                {showRatingModal === booking.id && (
                                    <div className="rating-modal-overlay" onClick={() => setShowRatingModal(null)}>
                                        <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
                                            <h3>Rate Your Experience</h3>
                                            <p className="modal-subtitle">{booking.venue_name}</p>

                                            <div className="rating-input">
                                                <p>How was your experience?</p>
                                                {renderStars(selectedRating, true, setSelectedRating)}
                                            </div>

                                            <textarea
                                                className="review-textarea"
                                                placeholder="Share your experience (optional)..."
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                rows={4}
                                            />

                                            <div className="modal-actions">
                                                <button className="cancel-btn" onClick={() => {
                                                    setShowRatingModal(null);
                                                    setSelectedRating(0);
                                                    setReviewText('');
                                                }}>
                                                    Cancel
                                                </button>
                                                <button
                                                    className="submit-btn"
                                                    onClick={() => handleSubmitReview(booking.id, booking.court_id || '')}
                                                    disabled={selectedRating === 0}
                                                >
                                                    Submit Review
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </main>
            </div>
        </div>
    );
};
