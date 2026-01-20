import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { bookingsApi } from '../api/bookings';
import './BookingSummaryNew.css';

interface BookingSummaryState {
    venueId: string;
    venueName: string;
    venueImage: string;
    venueLocation: string;
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

    if (!bookingData) {
        navigate(-1);
        return null;
    }

    const basePrice = bookingData.selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
    const taxesAndFees = basePrice * 0.05; // 5% taxes
    const discountAmount = (basePrice * discount) / 100;
    const total = basePrice + taxesAndFees - discountAmount;

    const handleApplyCoupon = () => {
        if (couponCode.toUpperCase() === 'RUSH10') {
            setAppliedCoupon('RUSH10');
            setDiscount(10);
            alert('Coupon applied! 10% discount');
        } else if (couponCode.toUpperCase() === 'WEEKDAY15') {
            setAppliedCoupon('WEEKDAY15');
            setDiscount(15);
            alert('Coupon applied! 15% discount');
        } else {
            alert('Invalid coupon code');
        }
        setCouponCode('');
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

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${bookingData.selectedDate.getDate()} ${monthNames[bookingData.selectedDate.getMonth()]} ${bookingData.selectedDate.getFullYear()}`;

    return (
        <div className="booking-summary-page">
            <TopNav showBackButton={true} />

            {/* Almost There Banner */}
            <div className="almost-there-banner">
                <div className="almost-there-content">
                    <div className="check-icon">✓</div>
                    <span className="almost-text">Almost there! Complete your booking</span>
                </div>
            </div>

            <div className="booking-summary-container">
                {/* Left: Venue Image */}
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
                        <h2>{bookingData.venueName}</h2>
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
                    <div className="discount-banner">
                        🏷️ 16% off on weekday bookings!
                    </div>

                    <h3 className="section-heading">Booking Summary</h3>

                    <div className="summary-row">
                        <span className="row-label">Date</span>
                        <span className="row-value">{formattedDate}</span>
                    </div>

                    <div className="summary-row">
                        <span className="row-label">Selected Slots</span>
                        <div className="slots-pills">
                            {bookingData.selectedSlots.map((slot, i) => (
                                <span key={i} className="slot-pill-active">{slot.display_time}</span>
                            ))}
                        </div>
                    </div>

                    <div className="summary-row">
                        <span className="row-label">Number of Players</span>
                        <div className="player-stepper">
                            <button onClick={() => setPlayers(Math.max(1, players - 1))}>−</button>
                            <span>{players} Players</span>
                            <button onClick={() => setPlayers(players + 1)}>+</button>
                        </div>
                    </div>

                    <div className="coupon-section">
                        <h4 className="coupon-heading">Have a coupon code?</h4>
                        {appliedCoupon ? (
                            <div className="applied-coupon">
                                <span className="coupon-code-badge">{appliedCoupon}</span>
                                <span className="coupon-discount">-{discount}% OFF</span>
                                <button className="remove-coupon-btn" onClick={handleRemoveCoupon}>×</button>
                            </div>
                        ) : (
                            <div className="coupon-input-row">
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="coupon-input"
                                />
                                <button className="apply-coupon-btn" onClick={handleApplyCoupon}>
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="price-breakdown">
                        <div className="price-row">
                            <span>Base Price ({bookingData.selectedSlots.length} hour)</span>
                            <span>₹{basePrice.toFixed(2)}</span>
                        </div>
                        <div className="price-row">
                            <span>Taxes & Fees</span>
                            <span>₹{taxesAndFees.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="price-row discount-row">
                                <span>Discount ({discount}%)</span>
                                <span className="discount-amount">-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="price-total-row">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        className="confirm-booking-btn"
                        onClick={handleConfirmBooking}
                        disabled={submitting}
                    >
                        {submitting ? 'Processing...' : 'Book Now'}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
