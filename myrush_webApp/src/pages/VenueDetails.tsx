import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { venuesApi } from '../api/venues';
import type { Venue } from '../api/venues';
import { courtsApi } from '../api/courts';
import type { CourtRatings } from '../api/courts';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaMapMarkerAlt, FaStar, FaCheck, FaUsers, FaClock, FaArrowRight } from 'react-icons/fa';

// --- Types ---
interface Slot {
    time: string;
    display_time: string;
    price: number;
    available: boolean;
}

// --- Sub-Components ---

const VenueHero: React.FC<{
    venue: Venue;
    rating: number;
    reviewCount: number;
    onBack: () => void;
}> = ({ venue, rating, reviewCount, onBack }) => (
    <motion.section
        className="relative h-80 md:h-[500px] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
    >
        <div className="absolute inset-0 z-0">
            <img
                src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076'}
                alt={venue.court_name}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        </div>

        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto mt-20">
            <motion.h1
                className="text-4xl md:text-7xl font-black font-montserrat tracking-tighter text-white mb-6 uppercase leading-none drop-shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                {venue.court_name}
            </motion.h1>

            <motion.div
                className="flex items-center justify-center gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <FaStar className="text-yellow-400 text-sm" />
                    <span className="text-white font-bold text-sm">{rating.toFixed(1)}</span>
                    <span className="text-gray-300 text-sm">({reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <FaMapMarkerAlt className="text-sm text-primary" />
                    <span className="font-medium text-sm">{venue.location}</span>
                </div>
            </motion.div>
        </div>

        <button
            onClick={onBack}
            className="absolute top-24 left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-30 border border-white/20"
        >
            <FaArrowRight className="rotate-180 text-lg" />
        </button>
    </motion.section>
);

// --- Main Page Component ---
export const VenueDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Venue Data State
    const [venue, setVenue] = useState<Venue | null>(null);
    const [ratings, setRatings] = useState<CourtRatings | null>(null);
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

    // Helper functions for calendar
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const isPast = (d: number, date: Date) => {
        const today = new Date();
        const check = new Date(date.getFullYear(), date.getMonth(), d);
        today.setHours(0, 0, 0, 0);
        return check < today;
    };

    useEffect(() => {
        if (id) loadVenueData(id);
    }, [id]);

    useEffect(() => {
        if (id) fetchSlots(id);
    }, [id, selectedDate, currentDate]);

    const loadVenueData = async (venueId: string) => {
        setLoadingVenue(true);
        try {
            const [venueRes, ratingsRes] = await Promise.all([
                venuesApi.getVenueById(venueId),
                courtsApi.getCourtRatings(venueId),
            ]);
            if (venueRes.success && venueRes.data) setVenue(venueRes.data);
            if (ratingsRes.success) setRatings(ratingsRes.data);
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
        navigate('/booking/summary', {
            state: {
                venueId: id,
                date: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`,
                selectedSlots: selectedSlots,
                totalPrice: selectedSlots.reduce((sum, s) => sum + s.price, 0)
            }
        });
    };

    const handleMonthChange = (dir: number) => {
        const newD = new Date(currentDate);
        newD.setMonth(newD.getMonth() + dir);
        setCurrentDate(newD);
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
    const totalPrice = basePrice + (selectedSlots.length > 0 ? 50 : 0);

    return (
        <div className="min-h-screen bg-gray-50 font-inter relative pb-20">
            <TopNav />

            {/* Hero Section */}
            <VenueHero
                venue={venue}
                rating={ratings?.average_rating || 0}
                reviewCount={ratings?.total_reviews || 0}
                onBack={() => navigate(-1)}
            />

            {/* Main Content - Side by Side Layout */}
            <section className="py-12 relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Left Side - Venue Details */}
                        <div className="lg:sticky lg:top-8 lg:self-start">
                            <div className="space-y-6">
                                {/* Venue Overview - Combined Stats and About */}
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                    <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">
                                        About <span className="text-primary italic">Venue</span>
                                    </h2>

                                    {/* Quick Stats - Horizontal Layout */}
                                    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🏆</span>
                                            <div>
                                                <div className="text-lg font-black text-gray-900">1,200+</div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wider">Games Played</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🌤️</span>
                                            <div>
                                                <div className="text-lg font-black text-gray-900">Outdoor</div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wider">Venue Type</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">⚽</span>
                                            <div>
                                                <div className="text-lg font-black text-gray-900">{venue.game_type || 'Football'}</div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wider">Sport</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                        {venue.description || 'Experience top-tier facilities designed for both competitive matches and casual play. Well-maintained surfaces and professional equipment available.'}
                                    </p>

                                    {/* Amenities */}
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Amenities</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {(venue.amenities && venue.amenities.length > 0 ? venue.amenities : [
                                                'Parking', 'Lockers', 'Showers', 'Restrooms', 'First Aid', 'Wi-Fi'
                                            ]).slice(0, 6).map((item: any, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <FaCheck className="text-primary text-xs" />
                                                    </div>
                                                    <span className="font-medium text-gray-700">{typeof item === 'string' ? item : item.name}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Terms - Combined Section */}
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Location */}
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                                                <FaMapMarkerAlt className="inline mr-2" /> Location
                                            </h3>
                                            <div className="aspect-video bg-gray-50 border border-gray-100 rounded-2xl mb-4 flex items-center justify-center">
                                                <div className="text-center">
                                                    <FaMapMarkerAlt className="text-3xl text-gray-400 mx-auto mb-1" />
                                                    <p className="text-xs text-gray-500">Interactive Map</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {venue.location} - Easily accessible with ample parking and public transport options nearby.
                                            </p>
                                        </div>

                                        {/* Terms & Conditions */}
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">Terms</h3>
                                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                                <div className="space-y-2 text-gray-500 text-xs leading-relaxed">
                                                    {venue.terms_and_conditions ? (
                                                        <div className="whitespace-pre-wrap line-clamp-6">{venue.terms_and_conditions}</div>
                                                    ) : (
                                                        <div>
                                                            <p>• Advance booking recommended</p>
                                                            <p>• Valid ID proof required</p>
                                                            <p>• Cancellation policy: 24 hours notice</p>
                                                            <p>• No refunds for no-shows</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Booking Widget */}
                        <div className="lg:sticky lg:top-8 h-fit">
                            <motion.div
                                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                                        Book Your <span className="text-primary italic">Slot</span>
                                    </h2>
                                    <p className="text-gray-500">Select date, time and confirm your booking</p>
                                </div>

                                {/* Calendar */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Select Date</h3>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleMonthChange(-1)}
                                                disabled={currentDate <= new Date()}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center transition-colors text-sm text-gray-700 shadow-sm"
                                            >
                                                ‹
                                            </button>
                                            <span className="text-sm font-bold min-w-[140px] text-center text-gray-900">
                                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                            </span>
                                            <button
                                                onClick={() => handleMonthChange(1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-sm text-gray-700 shadow-sm"
                                            >
                                                ›
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 mb-3">
                                        {daysOfWeek.map(d => (
                                            <div key={d} className="text-center text-gray-400 font-bold text-xs uppercase tracking-wider py-1">
                                                {d}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: getFirstDay(currentDate) }).map((_, i) => <div key={`e-${i}`} />)}
                                        {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                                            const d = i + 1;
                                            const disabled = isPast(d, currentDate);
                                            const selected = selectedDate === d;
                                            return (
                                                <button
                                                    key={d}
                                                    className={`aspect-square rounded-lg font-bold text-xs transition-all ${selected
                                                        ? 'bg-black text-white shadow-md'
                                                        : disabled
                                                            ? 'text-gray-300 cursor-not-allowed'
                                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                        }`}
                                                    onClick={() => !disabled && setSelectedDate(d)}
                                                    disabled={disabled}
                                                >
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Available Slots</h3>
                                        {loadingSlots && <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>}
                                    </div>

                                    {availableSlots.length === 0 && !loadingSlots ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <FaClock className="text-2xl mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No slots available for this date</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                                            {availableSlots.map(slot => {
                                                const isSel = selectedSlots.some(s => s.display_time === slot.display_time);
                                                return (
                                                    <button
                                                        key={slot.display_time}
                                                        className={`p-4 rounded-lg font-bold text-sm transition-all text-center ${isSel
                                                            ? 'bg-primary/10 border-2 border-primary text-primary shadow-sm'
                                                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-200 text-gray-700'
                                                            }`}
                                                        onClick={() => handleSlotClick(slot)}
                                                    >
                                                        <div className="text-base font-semibold">{slot.display_time}</div>
                                                        <div className={`text-xs font-medium mt-1 ${isSel ? 'text-primary/70' : 'text-gray-400'}`}>
                                                            ₹{slot.price}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Booking Form */}
                                <div className="space-y-6 mb-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                <FaUsers className="inline mr-1" /> Players
                                            </label>
                                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                <button
                                                    onClick={() => setNumPlayers(Math.max(1, numPlayers - 1))}
                                                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center font-bold transition-colors shadow-sm text-gray-600"
                                                >
                                                    −
                                                </button>
                                                <span className="text-lg font-black flex-1 text-center text-gray-900">{numPlayers}</span>
                                                <button
                                                    onClick={() => setNumPlayers(numPlayers + 1)}
                                                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center font-bold transition-colors shadow-sm text-gray-600"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                Team Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Optional"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-lg h-12 px-3 text-gray-900 placeholder-gray-400 outline-none focus:border-primary/50 transition-colors"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Price Summary */}
                                <div className="border-t border-gray-200 pt-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-sm text-gray-600">Subtotal</div>
                                            <div className="text-xs text-gray-500">
                                                {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} × ₹{availableSlots[0]?.price || 0}
                                            </div>
                                        </div>
                                        <div className="text-lg font-black text-gray-900">₹{selectedSlots.length > 0 ? selectedSlots.length * (availableSlots[0]?.price || 0) : 0}</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600">Booking Fee</div>
                                        <div className="text-sm font-bold text-gray-900">₹{selectedSlots.length > 0 ? 50 : 0}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xl font-black border-t border-gray-100 pt-4">
                                        <div className="text-gray-900">Total</div>
                                        <div className="text-primary">₹{totalPrice}</div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        className="w-full h-12 text-base font-black mt-6 shadow-lg shadow-primary/20"
                                        onClick={handleBooking}
                                        disabled={selectedSlots.length === 0}
                                    >
                                        Confirm Booking
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
