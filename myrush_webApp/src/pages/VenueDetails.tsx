import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { venuesApi } from '../api/venues';
import type { Venue } from '../api/venues';
import { courtsApi } from '../api/courts';
import type { CourtRatings, CourtReview } from '../api/courts';
import { TopNav } from '../components/TopNav';
import './VenueDetails.css';

// --- Types ---
interface Slot {
    time: string;
    display_time: string;
    price: number;
    available: boolean;
}

// --- Sub-Components ---

const VenueHeader: React.FC<{
    venue: Venue;
    onBack: () => void;
}> = ({ venue, onBack }) => (
    <div className="venue-header-section">
        <div
            className="venue-hero-image"
            style={{ backgroundImage: `url(${venue.photos?.[0] || '/court-placeholder.png'})` }}
        >
            <div className="hero-overlay">
                <button className="icon-btn back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
            <div className="hero-content">
                <span className="venue-tag">{venue.game_type || 'Sports Venue'}</span>
            </div>
        </div>
    </div>
);

const VenueInfo: React.FC<{
    venue: Venue;
    rating: number;
    reviewCount: number;
}> = ({ venue, rating, reviewCount }) => (
    <div className="venue-info-container">
        <div className="venue-primary-details">
            <div className="title-section">
                <h1>{venue.court_name}</h1>
                <div className="rating-pill">
                    <span className="star">★</span>
                    <span className="score">{rating.toFixed(1)}</span>
                    <span className="count">({reviewCount} reviews)</span>
                </div>
            </div>
            <div className="location-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                {venue.location}
            </div>
        </div>

        <div className="stats-grid">
            <div className="stat-card">
                <span className="stat-value">1,200+</span>
                <span className="stat-label">Games Played</span>
            </div>
            <div className="stat-card">
                <span className="stat-value">Outdoor</span>
                <span className="stat-label">Venue Type</span>
            </div>
            <div className="stat-card">
                <span className="stat-value">6:00 AM</span>
                <span className="stat-label">Opens At</span>
            </div>
        </div>

        <div className="info-section">
            <h3 className="section-title">About Venue</h3>
            <p className="description-text">{venue.description || 'Experience top-tier facilities designed for both competitive matches and casual play. Well-maintained surfaces and professional equipment available.'}</p>
        </div>

        <div className="info-section">
            <h3 className="section-title">Amenities</h3>
            <div className="amenities-grid">
                {(venue.amenities && venue.amenities.length > 0 ? venue.amenities : [
                    { id: '1', name: 'Parking' }, { id: '2', name: 'Lockers' },
                    { id: '3', name: 'Showers' }, { id: '4', name: 'Restrooms' },
                    { id: '5', name: 'First Aid' }, { id: '6', name: 'Wi-Fi' }
                ]).map((item: any) => (
                    <div key={item.id} className="amenity-item">
                        <div className="amenity-icon-check">✓</div>
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="info-section">
            <h3 className="section-title">Terms & Conditions</h3>
            <div className="terms-content">
                {venue.terms_and_conditions ? (
                    <div className="terms-text">
                        {venue.terms_and_conditions}
                    </div>
                ) : (
                    <div className="terms-text" style={{ fontStyle: 'italic', color: '#999' }}>
                        Terms and conditions will be displayed here once available.
                    </div>
                )}
            </div>
        </div>

        <div className="info-section map-wrapper">
            <h3 className="section-title">Location</h3>
            <div className="map-view-box">
                <div className="map-interaction-placeholder">
                    View on Map
                </div>
            </div>
        </div>
    </div>
);

const BookingSidebar: React.FC<{
    currentDate: Date;
    selectedDate: number;
    monthNames: string[];
    daysOfWeek: string[];
    availableSlots: Slot[];
    selectedSlots: Slot[];
    numPlayers: number;
    teamName: string;
    loadingSlots: boolean;
    totalPrice: number;
    onDateChange: (direction: number) => void;
    onSelectDate: (day: number) => void;
    onSlotClick: (slot: Slot) => void;
    setNumPlayers: (n: number) => void;
    setTeamName: (t: string) => void;
    onBook: () => void;
}> = (props) => {
    // Calendar Utils
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const daysInMonth = getDaysInMonth(props.currentDate);
    const firstDay = getFirstDay(props.currentDate);

    const isPast = (d: number) => {
        const today = new Date();
        const check = new Date(props.currentDate.getFullYear(), props.currentDate.getMonth(), d);
        today.setHours(0, 0, 0, 0);
        return check < today;
    };

    return (
        <div className="booking-card-modern">
            <div className="discount-tag">
                <span className="tag-icon">🏷️</span> 15% OFF on Weekdays
            </div>

            <div className="calendar-modern">
                <div className="calendar-header">
                    <button onClick={() => props.onDateChange(-1)} disabled={props.currentDate <= new Date()}>
                        ‹
                    </button>
                    <span>{props.monthNames[props.currentDate.getMonth()]} {props.currentDate.getFullYear()}</span>
                    <button onClick={() => props.onDateChange(1)}>
                        ›
                    </button>
                </div>
                <div className="calendar-grid-modern">
                    {props.daysOfWeek.map(d => <span key={d} className="w-day">{d}</span>)}
                    {Array.from({ length: firstDay }).map((_, i) => <span key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const d = i + 1;
                        const disabled = isPast(d);
                        const selected = props.selectedDate === d;
                        return (
                            <button
                                key={d}
                                className={`c-day ${selected ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                onClick={() => !disabled && props.onSelectDate(d)}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="booking-section">
                <div className="section-header">
                    <h4>Available Slots</h4>
                    {props.loadingSlots && <span className="spinner-sm"></span>}
                </div>

                {props.availableSlots.length === 0 && !props.loadingSlots ? (
                    <div className="empty-state-slots">No slots available for this date.</div>
                ) : (
                    <div className="slots-scroll-grid">
                        {props.availableSlots.map(slot => {
                            const isSel = props.selectedSlots.some(s => s.display_time === slot.display_time);
                            return (
                                <button
                                    key={slot.display_time}
                                    className={`time-chip ${isSel ? 'active' : ''}`}
                                    onClick={() => props.onSlotClick(slot)}
                                >
                                    {slot.display_time}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="booking-form-modern">
                <div className="form-group">
                    <label>Players</label>
                    <div className="stepper-modern">
                        <button onClick={() => props.setNumPlayers(Math.max(1, props.numPlayers - 1))}>−</button>
                        <span className="val">{props.numPlayers}</span>
                        <button onClick={() => props.setNumPlayers(props.numPlayers + 1)}>+</button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Team Name (Optional)</label>
                    <input
                        className="modern-input"
                        type="text"
                        placeholder="Enter team name"
                        value={props.teamName}
                        onChange={(e) => props.setTeamName(e.target.value)}
                    />
                </div>
            </div>

            <div className="price-footer">
                <div className="price-line">
                    <span>Subtotal</span>
                    <span>₹{props.selectedSlots.length > 0 ? props.selectedSlots.length * (props.availableSlots[0]?.price || 0) : 0}</span>
                </div>
                <div className="price-line">
                    <span>Fees</span>
                    <span>₹{props.selectedSlots.length > 0 ? 50 : 0}</span>
                </div>
                <div className="price-total">
                    <span>Total Pay</span>
                    <span>₹{props.totalPrice}</span>
                </div>

                <button className="booking-btn-primary" onClick={props.onBook}>
                    Confirm Booking
                </button>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export const VenueDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Venue Data State
    const [venue, setVenue] = useState<Venue | null>(null);
    const [ratings, setRatings] = useState<CourtRatings | null>(null);
    const [reviews, setReviews] = useState<CourtReview[]>([]);
    const [loadingVenue, setLoadingVenue] = useState(true);

    // Slot Selection State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Booking Summary State
    const [numPlayers, setNumPlayers] = useState(2);
    const [teamName, setTeamName] = useState('');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    useEffect(() => {
        if (id) loadVenueData(id);
    }, [id]);

    useEffect(() => {
        if (id) fetchSlots(id);
    }, [id, selectedDate, currentDate]);

    const loadVenueData = async (venueId: string) => {
        setLoadingVenue(true);
        try {
            const [venueRes, ratingsRes, reviewsRes] = await Promise.all([
                venuesApi.getVenueById(venueId),
                courtsApi.getCourtRatings(venueId),
                courtsApi.getCourtReviews(venueId, 5)
            ]);
            if (venueRes.success && venueRes.data) setVenue(venueRes.data);
            if (ratingsRes.success) setRatings(ratingsRes.data);
            if (reviewsRes.success) setReviews(reviewsRes.data.reviews);
        } catch (error) { console.error(error); }
        finally { setLoadingVenue(false); }
    };

    const fetchSlots = async (venueId: string) => {
        setLoadingSlots(true);
        try {
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = selectedDate.toString().padStart(2, '0');
            const res = await venuesApi.getAvailableSlots(venueId, `${year}-${month}-${day}`);
            setAvailableSlots(res.success && res.data ? res.data.slots : []);
        } catch (error) { setAvailableSlots([]); }
        finally { setLoadingSlots(false); }
    };

    const handleSlotClick = (slot: Slot) => {
        const exists = selectedSlots.some(s => s.display_time === slot.display_time);
        setSelectedSlots(exists
            ? selectedSlots.filter(s => s.display_time !== slot.display_time)
            : [...selectedSlots, slot]
        );
    };

    const handleBooking = () => {
        if (!venue || !id || selectedSlots.length === 0) {
            alert('Please select at least one time slot');
            return;
        }

        // Navigate to booking summary page with all booking data
        navigate('/booking-summary', {
            state: {
                venueId: id,
                venueName: venue.court_name,
                venueImage: venue.photos?.[0] || '/court-placeholder.png',
                venueLocation: venue.location,
                selectedDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate),
                selectedSlots: selectedSlots,
                players: numPlayers,
                teamName: teamName
            }
        });
    };

    const handleMonthChange = (dir: number) => {
        const newD = new Date(currentDate);
        newD.setMonth(newD.getMonth() + dir);
        setCurrentDate(newD);
    };

    if (loadingVenue) return <div className="loading-wrapper"><div className="loader"></div></div>;
    if (!venue) return <div className="error-wrapper">Venue not found</div>;

    const basePrice = selectedSlots.reduce((acc, s) => acc + s.price, 0);
    const totalPrice = basePrice + (selectedSlots.length > 0 ? 50 : 0);

    return (
        <div className="venue-details-page-modern">
            <TopNav showBackButton={true} />

            <div className="venue-layout-grid">
                {/* Left Column */}
                <div className="content-left">
                    <VenueHeader venue={venue} />
                    <VenueInfo
                        venue={venue}
                        rating={ratings?.average_rating || 0}
                        reviewCount={ratings?.total_reviews || 0}
                    />
                </div>

                {/* Right Column - Sticky */}
                <div className="sidebar-right">
                    <BookingSidebar
                        currentDate={currentDate}
                        selectedDate={selectedDate}
                        monthNames={monthNames}
                        daysOfWeek={daysOfWeek}
                        availableSlots={availableSlots}
                        selectedSlots={selectedSlots}
                        loadingSlots={loadingSlots}
                        numPlayers={numPlayers}
                        teamName={teamName}
                        totalPrice={totalPrice}
                        onDateChange={handleMonthChange}
                        onSelectDate={setSelectedDate}
                        onSlotClick={handleSlotClick}
                        setNumPlayers={setNumPlayers}
                        setTeamName={setTeamName}
                        onBook={handleBooking}
                    />
                </div>
            </div>
        </div>
    );
};
