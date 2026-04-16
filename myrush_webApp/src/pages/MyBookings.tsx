import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingsApi } from '../api/bookings';
import { TopNav } from '../components/TopNav';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaStar, FaDownload } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import { config } from '../config';
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
    original_amount: number;
    discount_amount: number;
    coupon_code?: string;
    total_amount: number;
    status: string;
    created_at: string;
    subtotal_amount?: number;
    gst_amount?: number;
    court_id?: string;
    court_name?: string;
    team_name?: string;
    number_of_players: number;
    logic_type?: string;
    slice_mask?: number;
    total_zones?: number;
    zones?: Array<{ index: number; name: string }>;
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
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const { showAlert, showConfirm } = useNotification();

    useEffect(() => {
        loadBookings();
    }, [activeTab]);

    const loadBookings = async () => {
        setLoading(true);
        const res = await bookingsApi.getUserBookings();
        if (res.success && res.data) {
            let processedBookings = res.data
                .filter((b: any) => b.status.toLowerCase() !== 'payment_pending')
                .map((b: any) => {
                    let status = b.status.toLowerCase();
                    if (status !== 'cancelled') {
                        if (b.end_time) {
                            const bookingTime = new Date(`${b.booking_date}T${b.end_time}`);
                            if (bookingTime < new Date()) {
                                status = 'completed';
                            } else {
                                status = 'upcoming';
                            }
                        } else if (status === 'confirmed') {
                            status = 'upcoming';
                        }
                    }
                    return { ...b, status };
                }).filter((b: Booking | null): b is Booking => b !== null);

            if (activeTab !== 'all') {
                processedBookings = processedBookings.filter((b: Booking) => b.status === activeTab);
            }

            processedBookings.sort((a: Booking, b: Booking) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
            setBookings(processedBookings);

            // Check review status for completed bookings
            const completed = processedBookings.filter((b: Booking) => b.status === 'completed');
            for (const booking of completed) {
                if (!booking) continue;
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
            showAlert('Please select a rating', 'warning');
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
            showAlert('Review submitted successfully!', 'success');
        } else {
            showAlert('Failed to submit review. Please try again.', 'error');
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        showConfirm(
            'Are you sure you want to cancel this booking? This action cannot be undone.',
            async () => {
                const res = await bookingsApi.cancelBooking(bookingId);
                if (res.success) {
                    showAlert('Booking cancelled successfully.', 'success');
                    loadBookings(); // Refresh list
                } else {
                    showAlert(res.error || 'Failed to cancel booking.', 'error');
                }
            }
        );
    };

    const handleDownloadInvoice = (bookingId: string) => {
        const url = `${config.apiBaseUrl}/bookings/${bookingId}/invoice?print=true`;
        window.open(url, '_blank');
    };

    const isCancellable = (booking: Booking): boolean => {
        if (booking.status !== 'upcoming' && booking.status !== 'confirmed') return false;
        
        try {
            const startDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
            const now = new Date();
            // 1 hour in milliseconds
            const ONE_HOUR = 60 * 60 * 1000;
            return (startDateTime.getTime() - now.getTime()) >= ONE_HOUR;
        } catch (e) {
            return false;
        }
    };

    const getStatusBadge = (status: string) => {
        let className = 'status-badge-modern';
        switch (status) {
            case 'completed': className += ' completed'; break;
            case 'upcoming':
            case 'confirmed': className += ' upcoming'; break;
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
    const formatSelectedZones = (booking: Booking) => {
        if (booking.slice_mask === undefined || booking.slice_mask === null) return null;
        
        // If it's a "Full Court" booking (mask covers all zones), usually don't show "Zone"
        const totalZones = booking.total_zones || 1;
        const fullMask = (1 << totalZones) - 1;
        if (booking.slice_mask === fullMask && totalZones > 1) return "Full Court";
        if (totalZones <= 1) return null;

        // Try to get names from metadata
        let selectedZoneNames: string[] = [];
        
        if (booking.zones && booking.zones.length > 0) {
            selectedZoneNames = booking.zones
                .filter(z => (booking.slice_mask! & (1 << z.index)) !== 0)
                .map(z => z.name);
        }

        // Fallback to "Zone 1, Zone 2" if metadata is missing but mask tells us something
        if (selectedZoneNames.length === 0) {
            for (let i = 0; i < totalZones; i++) {
                if ((booking.slice_mask! & (1 << i)) !== 0) {
                    selectedZoneNames.push(`Zone ${i + 1}`);
                }
            }
        }
            
        if (selectedZoneNames.length === 0) return null;
        return selectedZoneNames.join(' + ');
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
                            <span className="empty-icon text-primary"><FaCalendarAlt /></span>
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
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(booking.status)}
                                    </div>
                                </div>

                                <div className="card-body-modern">
                                    <h3 className="venue-name">{booking.venue_name}</h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                            {booking.court_name}
                                        </span>
                                        {formatSelectedZones(booking) && (
                                            <span className="text-sm font-bold text-primary italic">
                                                Zone: {formatSelectedZones(booking)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {booking.team_name && <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">TEAM: {booking.team_name}</p>}
                                    <p className="location-text text-gray-500 flex items-center gap-1"><FaMapMarkerAlt className="text-primary" /> {booking.venue_location}</p>

                                    <div className="booking-details">
                                        <div className="detail-item">
                                            <span className="label">Time:</span>
                                            <span className="value flex items-center gap-1"><FaClock className="text-primary" /> {booking.start_time?.slice(0, 5) || 'N/A'} - {booking.end_time?.slice(0, 5) || 'N/A'}</span>
                                        </div>
                                        {(booking.logic_type?.toLowerCase().trim() === 'capacity' || 
                                          booking.venue_name?.toLowerCase().includes('swimming') || 
                                          booking.court_name?.toLowerCase().includes('swimming') || 
                                          booking.venue_name?.toLowerCase().includes('skating') ||
                                          booking.court_name?.toLowerCase().includes('skating')) && (
                                            <div className="detail-item">
                                                <span className="label">Players:</span>
                                                <span className="value">{booking.number_of_players || 1}</span>
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <span className="label">Amount:</span>
                                            <div className="flex flex-col items-end">
                                                <span className="value price">₹{booking.total_amount}</span>
                                                {booking.coupon_code && (
                                                    <span className="coupon-info-badge">
                                                        Coupon: {booking.coupon_code} (-₹{booking.discount_amount})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="booking-id-row">
                                        <span>Booking ID: {booking.booking_display_id || booking.id.slice(0, 8)}</span>
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            {isCancellable(booking) ? (
                                                <button 
                                                    className="cancel-booking-btn-card"
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    title="Cancel Booking (Allowed up to 1h before)"
                                                >
                                                    Cancel
                                                </button>
                                            ) : (booking.status === 'upcoming' || booking.status === 'confirmed') && (
                                                <span className="text-[10px] text-gray-400 italic self-center mr-1" title="Cancellations are only allowed up to 1 hour before the booked time">
                                                    Non-cancellable
                                                </span>
                                            )}
                                            {(booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'upcoming') && (
                                                <button
                                                    className="view-details-btn secondary"
                                                    onClick={() => handleDownloadInvoice(booking.id)}
                                                    title="Download Receipt"
                                                >
                                                    <FaDownload className="inline-block mr-1" /> Receipt
                                                </button>
                                            )}
                                            <button
                                                className="view-details-btn"
                                                onClick={() => setSelectedBooking(booking)}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>


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
                                                    <FaStar className="inline-block mr-1 text-yellow-400" /> Rate Your Experience
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

                {/* Booking Details Modal */}
                <AnimatePresence>
                    {selectedBooking && (
                        <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
                            <motion.div
                                className="booking-modal-content"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <h3>Booking Details</h3>
                                    <button className="close-modal-btn" onClick={() => setSelectedBooking(null)}>✕</button>
                                </div>

                                <div className="modal-body">
                                    <div className="detail-grid-modern">
                                        <div className="detail-group">
                                            <span className="detail-label">Venue</span>
                                            <span className="detail-value font-bold text-lg">{selectedBooking.venue_name}</span>
                                        </div>

                                        <div className="detail-group">
                                            <span className="detail-label">Sport / Court</span>
                                            <div className="flex items-center gap-2">
                                                <span className="detail-value">{selectedBooking.court_name}</span>
                                                {formatSelectedZones(selectedBooking) && (
                                                    <span className="text-sm font-bold text-primary italic">
                                                        (Zone: {formatSelectedZones(selectedBooking)})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="detail-group">
                                            <span className="detail-label">Location</span>
                                            <span className="detail-value flex items-center gap-1 text-gray-500"><FaMapMarkerAlt className="text-primary" /> {selectedBooking.venue_location}</span>
                                        </div>

                                        {selectedBooking.team_name && (
                                            <div className="detail-group">
                                                <span className="detail-label">Team Name</span>
                                                <span className="detail-value font-bold text-primary uppercase">{selectedBooking.team_name}</span>
                                            </div>
                                        )}

                                        <div className="modal-divider" />

                                        <div className="detail-row-modern">
                                            <div className="detail-group">
                                                <span className="detail-label">Date</span>
                                                <span className="detail-value">
                                                    {new Date(selectedBooking.booking_date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="detail-group">
                                                <span className="detail-label">Status</span>
                                                <div className="flex flex-col items-start gap-1">
                                                    {getStatusBadge(selectedBooking.status)}
                                                    {isCancellable(selectedBooking) && (
                                                        <button 
                                                            className="cancel-booking-btn-modal"
                                                            onClick={() => handleCancelBooking(selectedBooking.id)}
                                                        >
                                                            Cancel Booking
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="detail-row-modern">
                                            <div className="detail-group">
                                                <span className="detail-label">Start Time</span>
                                                <span className="detail-value flex items-center gap-1"><FaClock className="text-primary" /> {selectedBooking.start_time?.slice(0, 5) || 'N/A'}</span>
                                            </div>
                                            {(selectedBooking.logic_type?.toLowerCase().trim() === 'capacity' || 
                                              selectedBooking.venue_name?.toLowerCase().includes('swimming') || 
                                              selectedBooking.court_name?.toLowerCase().includes('swimming') || 
                                              selectedBooking.venue_name?.toLowerCase().includes('skating') ||
                                              selectedBooking.court_name?.toLowerCase().includes('skating')) && (
                                                <div className="detail-group">
                                                    <span className="detail-label">Players</span>
                                                    <span className="detail-value font-bold">{selectedBooking.number_of_players || 1} Members</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="detail-row-modern">
                                            <div className="detail-group">
                                                <span className="detail-label">End Time</span>
                                                <span className="detail-value flex items-center gap-1"><FaClock className="text-primary" /> {selectedBooking.end_time?.slice(0, 5) || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="modal-divider" />

                                        <div className="detail-group">
                                            <span className="detail-label">Payment Breakdown</span>
                                            <div className="payment-breakdown-box">
                                                <div className="breakdown-row">
                                                    <span>Original Price</span>
                                                    <span>₹{selectedBooking.original_amount}</span>
                                                </div>
                                                {selectedBooking.coupon_code && (
                                                    <div className="breakdown-row discount">
                                                        <span>Coupon Applied ({selectedBooking.coupon_code})</span>
                                                        <span>-₹{selectedBooking.discount_amount}</span>
                                                    </div>
                                                )}
                                                {selectedBooking.gst_amount !== undefined && selectedBooking.gst_amount > 0 && (
                                                    <div className="breakdown-row">
                                                        <span>GST (18%)</span>
                                                        <span>₹{selectedBooking.gst_amount}</span>
                                                    </div>
                                                )}
                                                <div className="modal-divider mini" />
                                                <div className="breakdown-row total">
                                                    <span>Total Paid</span>
                                                    <span>₹{selectedBooking.total_amount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-divider" />

                                        <div className="detail-group">
                                            <span className="detail-label">Booking ID</span>
                                            <span className="detail-value text-xs opacity-70">{selectedBooking.booking_display_id || selectedBooking.id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <div className="flex gap-3 w-full">
                                        {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed' || selectedBooking.status === 'upcoming') && (
                                            <button 
                                                className="view-details-btn secondary flex-1"
                                                onClick={() => handleDownloadInvoice(selectedBooking.id)}
                                            >
                                                <FaDownload className="inline-block mr-2" /> Download Invoice
                                            </button>
                                        )}
                                        <button className="done-btn flex-1" onClick={() => setSelectedBooking(null)}>Close</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
