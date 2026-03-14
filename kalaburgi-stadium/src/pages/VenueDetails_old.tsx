import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { venuesApi } from '../api/venues';
import type { Venue } from '../api/venues';
import { courtsApi } from '../api/courts';
import type { CourtRatings, CourtReview } from '../api/courts';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaMapMarkerAlt, FaStar, FaClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// --- Types ---
interface Slot {
    time: string;
    display_time: string;
    price: number;
    available: boolean;
    court_name?: string;
}

// --- Sub-Components ---
// Hero component removed as it is now integrated into the main layout

// --- Main Page Component ---
export const VenueDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Venue Data State
    const [venue, setVenue] = useState<Venue | null>(null);
    const [ratings, setRatings] = useState<CourtRatings | null>(null);
    const [reviews, setReviews] = useState<CourtReview[]>([]);
    const [loadingVenue, setLoadingVenue] = useState(true);

    // Slot Selection State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
    const [scrollerBaseDate, setScrollerBaseDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Game Type Selection State
    const [selectedSport, setSelectedSport] = useState<string>('');

    // Booking Summary State
    const [numPlayers, setNumPlayers] = useState(2);
    const [teamName, setTeamName] = useState('');



    useEffect(() => {
        if (id) loadVenueData(id);
    }, [id]);

    useEffect(() => {
        if (id) fetchSlots(id);
        setSelectedSlots([]); // Clear any previous selection when sport or date changes
    }, [id, selectedDate, currentDate, selectedSport]);

    // Re-fetch slots whenever the user returns to this page (e.g. back button from booking summary)
    // location.key changes every time React Router renders this component fresh (including back-nav)
    useEffect(() => {
        if (id) fetchSlots(id);
    }, [location.key]);

    // Also re-fetch on window focus (tab switching)
    useEffect(() => {
        const handleFocus = () => {
            if (id) fetchSlots(id);
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [id, selectedDate, currentDate, selectedSport]);

    const loadVenueData = async (venueId: string) => {
        setLoadingVenue(true);
        try {
            const [venueRes, ratingsRes, reviewsRes] = await Promise.all([
                venuesApi.getVenueById(venueId),
                courtsApi.getCourtRatings(venueId),
                courtsApi.getCourtReviews(venueId)
            ]);
            if (venueRes.success && venueRes.data) {
                setVenue(venueRes.data);
                // Set default sport if available
                if (venueRes.data.game_type) {
                    const types = venueRes.data.game_type.split(',').map(s => s.trim()).filter(Boolean);
                    if (types.length > 0) setSelectedSport(types[0]);
                }
            }
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
            const res = await venuesApi.getVenueSlots(venueId, `${year}-${month}-${day}`, selectedSport);
            // Only show slots that are actually available
            setAvailableSlots(res.success && res.data ? res.data.slots.filter((s: Slot) => s.available) : []);
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

        const bookingState = {
            venueId: id,
            venueName: venue?.court_name,
            venueImage: venue?.photos?.[0],
            date: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`,
            selectedSlots: selectedSlots,
            selectedSport: selectedSport,
            totalPrice: selectedSlots.reduce((sum, s) => sum + s.price, 0) * numPlayers,
            numPlayers: numPlayers
        };

        // Optimistically hide the selected slots immediately so the UI is clean
        // while the user is on the booking summary / payment flow.
        const bookedTimes = new Set(selectedSlots.map(s => s.display_time));
        setAvailableSlots(prev => prev.filter(s => !bookedTimes.has(s.display_time)));
        setSelectedSlots([]);

        if (!isAuthenticated) {
            // Redirect to login, preserving the full booking state so it is
            // restored after OTP verification (OTPVerification reads from.state)
            navigate('/login', {
                state: {
                    from: {
                        pathname: '/booking/summary',
                        state: bookingState
                    }
                }
            });
            return;
        }

        // User is authenticated — go straight to booking summary
        navigate('/booking/summary', { state: bookingState });
    };



    if (loadingVenue) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    if (!venue) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center text-gray-900">
                <h2 className="text-2xl font-bold mb-4">Venue not found</h2>
                <Button variant="primary" onClick={() => navigate('/venues')}>
                    Back to Venues
                </Button>
            </div>
        </div>
    );

    const basePrice = selectedSlots.reduce((acc, s) => acc + s.price, 0);
    const totalPrice = basePrice * numPlayers;

    return (
        <div className="min-h-screen bg-gray-50 font-inter text-gray-900 pb-20">
            <TopNav />

            <div className="max-w-[90%] 2xl:max-w-[1700px] mx-auto px-4 md:px-8 py-8 pt-10 md:pt-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/venues')}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-6 group"
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>Back to Venues</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-32">

                    {/* LEFT COLUMN - Venue Info */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Title Section (Moved Above Grid) */}
                        <div className="mb-6">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat text-gray-900 mb-2 uppercase tracking-tight leading-none">
                                {venue.court_name}
                            </h1>
                            <p className="text-gray-500 flex items-center gap-2 text-sm font-medium">
                                <FaMapMarkerAlt className="text-primary" />
                                {venue.location}
                            </p>
                        </div>

                        {/* Image Gallery */}
                        <div className="flex flex-col md:flex-row gap-3 overflow-hidden shadow-md md:h-[420px]">
                            {/* Main large photo — left half */}
                            <div className="relative w-full md:w-1/2 h-[250px] md:h-full flex-shrink-0 overflow-hidden">
                                <img
                                    src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076'}
                                    alt={venue.court_name}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                                        Top Rated
                                    </div>
                                    <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                                        <FaStar className="text-yellow-400" />
                                        <span>{(venue.rating || ratings?.average_rating)?.toFixed(1) || '0.0'} ({venue.reviews || ratings?.total_reviews || 0})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right side — 2x2 grid of secondary photos */}
                            <div className="hidden md:grid flex-1 grid-cols-2 grid-rows-2 gap-3">
                                {[1, 2, 3, 4].map((idx) => (
                                    <div key={idx} className="relative overflow-hidden">
                                        {idx === 4 && venue.photos && venue.photos.length > 5 ? (
                                            <>
                                                <img
                                                    src={venue.photos[idx] || `https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2076`}
                                                    alt={`Venue view ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <span className="text-white font-bold uppercase tracking-widest border border-white/30 px-4 py-2 text-sm">
                                                        +{venue.photos.length - 5} Photos
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <img
                                                src={venue.photos?.[idx] || [
                                                    'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=2076',
                                                    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2076',
                                                    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2076',
                                                    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2076',
                                                ][idx - 1]}
                                                alt={`Venue view ${idx + 1}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>



                        {/* Available Sports */}
                        {venue.game_type && (
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Available Sports</h2>
                                <div className="flex flex-wrap gap-2">
                                    {venue.game_type.split(',').map((sport, idx) => {
                                        const s = sport.trim();
                                        if (!s) return null;
                                        const sportIcons: Record<string, string> = {
                                            football: '⚽', cricket: '🏏', badminton: '🏸',
                                            tennis: '🎾', basketball: '🏀', volleyball: '🏐',
                                            hockey: '🏑', swimming: '🏊', boxing: '🥊',
                                        };
                                        const icon = sportIcons[s.toLowerCase()] || '🏅';
                                        const isSelected = selectedSport === s;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedSport(s)}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${isSelected
                                                    ? 'bg-primary text-white border-primary shadow-md scale-105'
                                                    : 'bg-white border-gray-200 text-gray-700 shadow-sm hover:border-primary/50'
                                                    }`}
                                            >
                                                <span>{icon}</span> {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Single flat content panel — all sections flow together */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                            {/* About */}
                            <div className="p-8">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ground Overview</h2>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {venue.description || "Experience world-class sporting action at this premier venue. Our premium facilities are designed for competitive matches and casual play alike."}
                                </p>
                            </div>

                            {/* Amenities */}
                            {venue.amenities && venue.amenities.length > 0 && (
                                <>
                                    <div className="h-px bg-gray-100 mx-8" />
                                    <div className="p-8">
                                        <h2 className="text-base font-bold text-gray-900 mb-5">Available Amenities</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                            {venue.amenities.map((item, i) => {
                                                const label = typeof item === 'string' ? item : item.name;
                                                const n = label.toLowerCase();
                                                const getIcon = (): string => {
                                                    if (n.includes('park')) return '🅿️';
                                                    if (n.includes('wifi') || n.includes('wi-fi') || n.includes('internet')) return '📶';
                                                    if (n.includes('toilet') || n.includes('washroom') || n.includes('restroom') || n.includes('wc')) return '🚻';
                                                    if (n.includes('shower')) return '🚿';
                                                    if (n.includes('changing') || n.includes('locker') || n.includes('dressing')) return '🔒';
                                                    if (n.includes('flood') || n.includes('light') || n.includes('lamp')) return '💡';
                                                    if (n.includes('drink') || n.includes('water')) return '💧';
                                                    if (n.includes('cafe') || n.includes('coffee') || n.includes('tea')) return '☕';
                                                    if (n.includes('food') || n.includes('canteen') || n.includes('restaurant') || n.includes('meal')) return '🍽️';
                                                    if (n.includes('first aid') || n.includes('medical') || n.includes('health')) return '🩺';
                                                    if (n.includes('cctv') || n.includes('security') || n.includes('camera')) return '📷';
                                                    if (n.includes('ac') || n.includes('air con') || n.includes('cooling')) return '❄️';
                                                    if (n.includes('coach') || n.includes('train')) return '🏆';
                                                    if (n.includes('equip') || n.includes('kit') || n.includes('gear')) return '🎽';
                                                    if (n.includes('turf') || n.includes('grass') || n.includes('ground')) return '🌿';
                                                    if (n.includes('score') || n.includes('board')) return '📊';
                                                    if (n.includes('seat') || n.includes('stand') || n.includes('gallery')) return '🪑';
                                                    if (n.includes('bath') || n.includes('wash')) return '🚿';
                                                    if (n.includes('child') || n.includes('kid')) return '👶';
                                                    if (n.includes('atm') || n.includes('cash')) return '💳';
                                                    return '⚙️';
                                                };
                                                return (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0 border border-gray-200">
                                                            {getIcon()}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-800">{label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Location */}
                            <div className="h-px bg-gray-100 mx-8" />
                            <div className="p-8">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location</h2>
                                <div className="relative group overflow-hidden rounded-xl border border-gray-200 aspect-video mb-3">
                                    <iframe
                                        width="100%" height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy" allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(venue.location + (venue.city_name ? ', ' + venue.city_name : ''))}`}
                                        className="grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                                    ></iframe>
                                    <a
                                        href={(venue.google_map_url && (venue.google_map_url.startsWith('http://') || venue.google_map_url.startsWith('https://')))
                                            ? venue.google_map_url
                                            : (venue.google_map_url ? `https://${venue.google_map_url}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.location + (venue.city_name ? ', ' + venue.city_name : ''))}`)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="absolute inset-0 bg-transparent cursor-pointer"
                                        title="Open full map"
                                    >
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white shadow-lg p-2 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase text-primary border border-gray-100">
                                                <FaMapMarkerAlt className="h-3.5 w-3.5" /> View Full Map
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                {/* Full Address */}
                                <div className="mt-3 flex items-start gap-2 text-sm text-gray-500">
                                    <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0" />
                                    <span>
                                        {[venue.location, venue.city_name].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            </div>

                            {/* Terms & Conditions */}
                            {venue.terms_and_conditions && venue.terms_and_conditions.trim() && (
                                <>
                                    <div className="h-px bg-gray-100 mx-8" />
                                    <div className="p-8">
                                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Terms & Conditions</h2>
                                        <div className="space-y-3">
                                            {venue.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, i) => (
                                                <div key={i} className="flex gap-3 text-sm text-gray-600 items-start">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0"></span>
                                                    <span>{term.replace(/^\*|-|\u2022/, '').trim() || term}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Rules & Cancellation */}
                            {(venue as any).rules && (venue as any).rules.trim() && (
                                <>
                                    <div className="h-px bg-gray-100 mx-8" />
                                    <div className="p-8">
                                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Rules & Cancellation</h2>
                                        <div className="space-y-3">
                                            {(venue as any).rules.split('\n').filter((r: string) => r.trim()).map((rule: string, i: number) => (
                                                <div key={i} className="flex gap-3 text-sm text-gray-600 items-start">
                                                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 shrink-0"></span>
                                                    <span>{rule.replace(/^\*|-|\u2022/, '').trim() || rule}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Ratings & Reviews Section (Redesigned to match image) */}
                            <div className="h-px bg-gray-100 mx-8" />
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 font-inter mb-4">Reviews And Ratings</h2>
                                        <div className="flex items-center gap-4">
                                            <span className="text-6xl font-black text-gray-900 leading-none">
                                                {(venue.rating || ratings?.average_rating || 0).toFixed(0)}
                                            </span>
                                            <div className="flex flex-col">
                                                <div className="flex text-yellow-500 text-xl gap-0.5 mb-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} className={i < Math.floor(venue.rating || ratings?.average_rating || 0) ? 'fill-current' : 'text-gray-200'} />
                                                    ))}
                                                </div>
                                                <span className="text-sm font-medium text-gray-500">
                                                    Based on {venue.reviews || ratings?.total_reviews || 0} Reviews
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2.5 bg-white border border-gray-900 text-gray-900 text-sm font-semibold rounded-md hover:bg-gray-50 transition-colors mt-12">
                                        Add Your Rating
                                    </button>
                                </div>

                                <div className="space-y-4 max-w-2xl">
                                    {reviews.length > 0 ? (
                                        reviews.map((review) => (
                                            <div key={review.id} className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-full bg-[#EBF5FF] flex items-center justify-center text-[8px] font-bold text-[#A5C8FF] text-center px-1 leading-tight">
                                                            No Image
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900 mb-0.5">{review.user_name}</h4>
                                                            <p className="text-xs font-semibold text-gray-400">
                                                                {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex text-yellow-500 text-xs gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar key={i} className={i < review.rating ? 'fill-current' : 'text-gray-200'} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.review_text && (
                                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight leading-relaxed">
                                                        {review.review_text}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <p className="text-sm text-gray-400 font-medium">No reviews yet for this venue.</p>
                                        </div>
                                    )}
                                    {reviews.length > 3 && (
                                        <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline pt-2 ml-2">
                                            View All {reviews.length} Reviews
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>

                    <div className="lg:col-span-2 mt-8 lg:mt-0">
                        <div className="static lg:sticky lg:top-24">
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400"></div>

                                <div className="text-center mb-8 pt-2">
                                    <h2 className="text-2xl font-bold text-gray-900 uppercase font-montserrat leading-none mb-1">
                                        Book Your Slot
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest font-inter">Select date, time & confirm</p>
                                </div>

                                {/* Game Type Selector */}
                                {venue?.game_type && (
                                    <div className="mb-6">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3 font-inter">Select Sport</span>
                                        <div className="flex flex-wrap gap-2">
                                            {venue.game_type.split(',').map((sport, idx) => {
                                                const s = sport.trim();
                                                if (!s) return null;
                                                const isSelected = selectedSport === s;
                                                return (
                                                    <button
                                                        key={`${s}-${idx}`}
                                                        onClick={() => setSelectedSport(s)}
                                                        className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border ${isSelected
                                                            ? 'bg-primary text-white border-primary shadow-sm scale-102'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {s}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Date Selector (Horizontal) */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest font-inter">Select Date</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    const prev = new Date(scrollerBaseDate);
                                                    prev.setMonth(prev.getMonth() - 1);
                                                    // Don't go before today's month
                                                    if (prev < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) return;
                                                    setScrollerBaseDate(prev);
                                                }}
                                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                                            >
                                                <FaChevronLeft className="text-[10px]" />
                                            </button>
                                            <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide min-w-[120px] text-center font-inter">
                                                {scrollerBaseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const next = new Date(scrollerBaseDate);
                                                    next.setMonth(next.getMonth() + 1);
                                                    setScrollerBaseDate(next);
                                                }}
                                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                                            >
                                                <FaChevronRight className="text-[10px]" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-2 px-2 scroll-smooth">
                                        {Array.from({ length: 30 }).map((_, i) => {
                                            const date = new Date(scrollerBaseDate);
                                            date.setDate(scrollerBaseDate.getDate() + i);

                                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon
                                            const dayNumber = date.getDate(); // 12

                                            // Check if this date is selected
                                            // We compare day, month, and year to be precise
                                            const isSelected =
                                                selectedDate === dayNumber &&
                                                currentDate.getMonth() === date.getMonth() &&
                                                currentDate.getFullYear() === date.getFullYear();

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        setSelectedDate(dayNumber);
                                                        setCurrentDate(date);
                                                    }}
                                                    className={`flex flex-col items-center justify-center min-w-[55px] h-[65px] rounded-lg border transition-all duration-200 flex-shrink-0 ${isSelected
                                                        ? 'bg-primary border-primary text-white shadow-md scale-102 transform'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary/30 hover:bg-primary/5'
                                                        }`}
                                                >
                                                    <span className={`text-[10px] font-medium uppercase mb-1 font-inter ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                        {dayName}
                                                    </span>
                                                    <span className={`text-lg font-semibold font-inter ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                        {dayNumber}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="mb-8">
                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 font-inter">Available Slots</span>
                                    {loadingSlots ? (
                                        <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 text-xs font-medium">
                                            <FaClock className="mx-auto mb-2 text-lg opacity-30" />
                                            No slots available
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {availableSlots.map(slot => {
                                                const isSel = selectedSlots.some(s => s.display_time === slot.display_time);
                                                return (
                                                    <button
                                                        key={slot.display_time}
                                                        className={`relative flex items-center justify-center p-4 rounded-md border-2 transition-all duration-200 min-h-[70px] ${isSel
                                                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/30'
                                                            : 'bg-white border-gray-300 hover:border-primary/50 hover:bg-gray-50 hover:shadow-sm'
                                                            }`}
                                                        onClick={() => handleSlotClick(slot)}
                                                    >
                                                        {isSel && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <span className={`text-sm font-medium font-inter ${isSel ? 'text-white' : 'text-gray-900'}`}>
                                                            {slot.display_time}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Inputs */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 font-inter">Players</label>
                                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 h-9">
                                            <button onClick={() => setNumPlayers(Math.max(1, numPlayers - 1))} className="text-gray-400 hover:text-primary transition-colors text-lg font-semibold">-</button>
                                            <span className="text-sm font-bold text-gray-900 font-inter">{numPlayers}</span>
                                            <button onClick={() => setNumPlayers(numPlayers + 1)} className="text-gray-400 hover:text-primary transition-colors text-lg font-semibold">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 font-inter">Team Name</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            className="w-full h-9 bg-white border border-gray-200 rounded-md px-3 text-xs font-medium text-gray-900 outline-none focus:border-primary/40 placeholder:text-gray-300"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Booking Summary */}
                                <div className="bg-white border border-gray-100 rounded-lg p-5 mb-6">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 font-inter">Booking Summary</h3>

                                    {/* Selected Details */}
                                    <div className="space-y-3 mb-4">
                                        {/* Sport */}
                                        {selectedSport && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Sport</span>
                                                <span className="text-sm font-semibold text-gray-900">{selectedSport}</span>
                                            </div>
                                        )}

                                        {/* Date */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Date</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Venue/Court */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Court</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {selectedSlots.length > 0 ? selectedSlots[0].court_name || 'Arena' : 'Not selected'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-300/50 my-3"></div>

                                    {/* Selected Time Slots */}
                                    {selectedSlots.length > 0 && (
                                        <div className="mb-4">
                                            <span className="text-sm text-gray-500 block mb-2">Time Slots</span>
                                            <div className="space-y-1.5">
                                                {selectedSlots.map((slot, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                                                        <span className="text-sm font-medium text-gray-700 font-inter">{slot.display_time}</span>
                                                        <span className="text-sm font-semibold text-gray-900">₹{slot.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="border-t border-gray-300/50 my-3"></div>

                                    {/* Price Breakdown */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Subtotal ({selectedSlots.length} slots)</span>
                                            <span>₹{selectedSlots.reduce((sum, s) => sum + s.price, 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Booking Fee</span>
                                            <span>₹0</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-sm font-bold text-gray-900 uppercase">Total</span>
                                            <span className="text-lg font-bold text-primary">₹{totalPrice}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full py-4 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                                    onClick={handleBooking}
                                    disabled={selectedSlots.length === 0}
                                >
                                    Confirm Booking
                                </Button>

                            </div>


                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
