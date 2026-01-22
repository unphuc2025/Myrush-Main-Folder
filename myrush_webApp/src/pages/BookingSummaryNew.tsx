import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { bookingsApi } from '../api/bookings';
import { couponsApi } from '../api/coupons';
import type { AvailableCoupon } from '../api/coupons';
import './BookingSummaryNew.css';

interface BookingSummaryState {
    venueId: string;
    venueName: string;
    venueImage: string;
    venueLocation: string;
    city?: string;
    branchName?: string;
    selectedDate: Date;
    selectedSlots: Array<{ time: string; display_time: string; price: number }>;
    players: number;
    teamName?: string;
}

export const BookingSummaryNew: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const bookingData = location.state as BookingSummaryState;

    const [players, setPlayers] = useState(bookingData?.players || 2);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(true);

    if (!bookingData) {
        navigate(-1);
        return null;
    }

    const basePrice = bookingData.selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
    const taxesAndFees = basePrice * 0.05; // 5% taxes
    const discountAmount = (basePrice * discount) / 100;
    const total = basePrice + taxesAndFees - discountAmount;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            alert('Please enter a coupon code');
            return;
        }

        try {
            const response = await couponsApi.validateCoupon(couponCode, total);
            if (response.success && response.data.valid) {
                setAppliedCoupon(couponCode.toUpperCase());
                setDiscount(response.data.discount_percentage || 0);
                alert(response.data.message || 'Coupon applied successfully!');
                setCouponCode('');
            } else {
                alert(response.data.message || 'Invalid coupon code');
            }
        } catch (error) {
            console.error('Coupon validation error:', error);
            alert('Failed to validate coupon. Please try again.');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon('');
        setDiscount(0);
    };

    const handleConfirmBooking = async () => {
        setSubmitting(true);
        try {
            const sorted = [...bookingData.selectedSlots].sort((a, b) => a.time.localeCompare(b.time));
            const year = bookingData.selectedDate.getFullYear();
            const month = (bookingData.selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const day = bookingData.selectedDate.getDate().toString().padStart(2, '0');

            const res = await bookingsApi.createBooking({
                courtId: bookingData.venueId,
                bookingDate: `${year}-${month}-${day}`,
                startTime: sorted[0].time,
                durationMinutes: bookingData.selectedSlots.length * 60,
                numberOfPlayers: players,
                pricePerHour: sorted[0].price,
                teamName: bookingData.teamName,
                timeSlots: bookingData.selectedSlots,
                couponCode: appliedCoupon || undefined,
                discountAmount: discountAmount,
                totalAmount: total
            });

            if (res.success) {
                alert('Booking Confirmed Successfully!');
                navigate('/bookings');
            } else {
                alert('Booking failed. Please try again.');
            }
        } catch (e) {
            alert('Error processing booking.');
        } finally {
            setSubmitting(false);
        }
    };

    // Fetch available coupons on component mount
    useEffect(() => {
        const fetchCoupons = async () => {
            setLoadingCoupons(true);
            try {
                const response = await couponsApi.getAvailableCoupons();
                if (response.success) {
                    setAvailableCoupons(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch coupons:', error);
            } finally {
                setLoadingCoupons(false);
            }
        };

        fetchCoupons();
    }, []);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${bookingData.selectedDate.getDate()} ${monthNames[bookingData.selectedDate.getMonth()]} ${bookingData.selectedDate.getFullYear()}`;

    return (
        <div className="booking-summary-page">
            <TopNav showBackButton={true} />

            {/* Modern Header */}
            <div className="booking-header">
                <div className="booking-header-content">
                    <div className="booking-progress">
                        <div className="progress-step active">
                            <span className="step-icon">✓</span>
                            <span className="step-text">Details</span>
                        </div>
                        <div className="progress-line active"></div>
                        <div className="progress-step active">
                            <span className="step-icon">2</span>
                            <span className="step-text">Confirm</span>
                        </div>
                        <div className="progress-line"></div>
                        <div className="progress-step">
                            <span className="step-icon">3</span>
                            <span className="step-text">Booked</span>
                        </div>
                    </div>
                    <h1 className="booking-title">Confirm Your Booking</h1>
                </div>
            </div>

            <div className="booking-summary-container">
                {/* Left: Venue Image & Quick Info */}
                <motion.div
                    className="venue-preview-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div
                        className="venue-preview-image"
                        style={{ backgroundImage: `url(${bookingData.venueImage})` }}
                    />
                    <div className="venue-preview-info">
                        <div className="venue-court-details">
                            <h2 className="court-name">{bookingData.venueName}</h2>
                            {bookingData.city && (
                                <div className="court-detail-item">
                                    <span className="detail-icon">🏙️</span>
                                    <span className="detail-label">City:</span>
                                    <span className="detail-value">{bookingData.city}</span>
                                </div>
                            )}
                            {bookingData.branchName && (
                                <div className="court-detail-item">
                                    <span className="detail-icon">🏢</span>
                                    <span className="detail-label">Branch:</span>
                                    <span className="detail-value">{bookingData.branchName}</span>
                                </div>
                            )}
                            <div className="court-detail-item">
                                <span className="detail-icon">🎾</span>
                                <span className="detail-label">Court:</span>
                                <span className="detail-value">{bookingData.venueName}</span>
                            </div>
                        </div>

                        <div className="venue-quick-stats">
                            <div className="stat-item">
                                <span className="stat-icon">📅</span>
                                <span>{formattedDate}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-icon">⏰</span>
                                <span>{bookingData.selectedSlots.length} hour{bookingData.selectedSlots.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-icon">👥</span>
                                <span>{players} player{players > 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div className="venue-location-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {bookingData.venueLocation}
                        </div>
                    </div>
                </motion.div>

                {/* Right: Booking Details */}
                <motion.div
                    className="booking-details-card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="booking-details-header">
                        <h3>Booking Details</h3>
                        <div className="selected-slots-display">
                            {bookingData.selectedSlots.map((slot, i) => (
                                <span key={i} className="slot-tag">{slot.display_time}</span>
                            ))}
                        </div>
                    </div>

                    {/* Players Adjustment */}
                    <div className="players-section">
                        <label className="section-label">Number of Players</label>
                        <div className="players-controls">
                            <button
                                className="player-btn"
                                onClick={() => setPlayers(Math.max(1, players - 1))}
                                disabled={players <= 1}
                            >
                                −
                            </button>
                            <span className="player-count">{players}</span>
                            <button
                                className="player-btn"
                                onClick={() => setPlayers(players + 1)}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="coupon-section">
                        <label className="section-label">Promo Code</label>
                        {appliedCoupon ? (
                            <div className="applied-coupon-display">
                                <span className="coupon-code">{appliedCoupon}</span>
                                <span className="coupon-discount-text">-{discount}% OFF</span>
                                <button className="remove-coupon" onClick={handleRemoveCoupon}>×</button>
                            </div>
                        ) : (
                            <div className="coupon-input-group">
                                <input
                                    type="text"
                                    placeholder="Enter code (optional)"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="coupon-input"
                                />
                                <button
                                    className="apply-btn"
                                    onClick={handleApplyCoupon}
                                    disabled={!couponCode}
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="price-breakdown-card">
                        <h4 className="price-title">Price Breakdown</h4>

                        <div className="price-item">
                            <span>Base Price</span>
                            <span>₹{basePrice.toFixed(2)}</span>
                        </div>

                        <div className="price-item">
                            <span>Service Fee</span>
                            <span>₹{taxesAndFees.toFixed(2)}</span>
                        </div>

                        {discount > 0 && (
                            <div className="price-item discount">
                                <span>Discount ({discount}%)</span>
                                <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="price-divider"></div>

                        <div className="price-total">
                            <span>Total Amount</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        className="confirm-booking-btn"
                        onClick={handleConfirmBooking}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <span className="loading-text">Processing Booking...</span>
                        ) : (
                            <>
                                <span>Complete Booking</span>
                                <span className="btn-arrow">→</span>
                            </>
                        )}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
