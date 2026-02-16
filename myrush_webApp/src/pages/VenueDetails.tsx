import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { venuesApi } from '../api/venues';
import type { Venue } from '../api/venues';
import { courtsApi } from '../api/courts';
import type { CourtRatings } from '../api/courts';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaMapMarkerAlt, FaStar, FaCheck, FaClock } from 'react-icons/fa';

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
    }, [id, selectedDate, currentDate, selectedSport]);

    const loadVenueData = async (venueId: string) => {
        setLoadingVenue(true);
        try {
            const [venueRes, ratingsRes] = await Promise.all([
                venuesApi.getVenueById(venueId),
                courtsApi.getCourtRatings(venueId),
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
    const totalPrice = basePrice;

    return (
        <div className="min-h-screen bg-gray-50 font-inter text-gray-900 pb-20">
            <TopNav />

            <div className="max-w-[90%] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-6">
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
                            <h1 className="text-3xl lg:text-5xl font-black font-montserrat text-gray-900 mb-2 uppercase tracking-tight leading-none">
                                {venue.court_name}
                            </h1>
                            <p className="text-gray-500 flex items-center gap-2 text-sm font-medium">
                                <FaMapMarkerAlt className="text-primary" />
                                {venue.location}
                            </p>
                        </div>

                        {/* Image Gallery Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] shadow-lg group relative">
                            {/* Main Large Image */}
                            <div className={`md:col-span-2 md:row-span-2 relative h-full cursor-pointer`} onClick={() => {/* Open Lightbox logic could go here */ }}>
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
                                        <span>{ratings?.average_rating?.toFixed(1) || '0.0'} ({ratings?.total_reviews || 0})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Images */}
                            <div className="hidden md:block md:col-span-1 md:row-span-1 relative h-full cursor-pointer">
                                <img
                                    src={venue.photos?.[1] || 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=2076'}
                                    alt="Venue view 2"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="hidden md:block md:col-span-1 md:row-span-1 relative h-full cursor-pointer">
                                <img
                                    src={venue.photos?.[2] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2076'}
                                    alt="Venue view 3"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Third/Fourth with overlay */}
                            <div className="hidden md:flex md:col-span-2 md:row-span-1 gap-4">
                                <div className="w-1/2 relative h-full cursor-pointer overflow-hidden">
                                    <img
                                        src={venue.photos?.[3] || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2076'}
                                        alt="Venue view 4"
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 rounded-bl-none" // grid-gap handles rounded checks effectively
                                    />
                                </div>
                                <div className="w-1/2 relative h-full cursor-pointer overflow-hidden">
                                    <img
                                        src={venue.photos?.[4] || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2076'}
                                        alt="Venue view 5"
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Show "See All" if more photos exist */}
                                    {venue.photos && venue.photos.length > 5 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center group/more hover:bg-black/70 transition-colors">
                                            <span className="text-white font-bold uppercase tracking-widest border border-white/30 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all">
                                                +{venue.photos.length - 5} Photos
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Title Overlay (Only visible on small screens where grid acts as single hero) */}

                        </div>



                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                                <span className="text-3xl mb-2">🏆</span>
                                <div className="text-xl font-black text-gray-900">1,200+</div>
                                <div className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Games Played</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                                <span className="text-3xl mb-2">☀️</span>
                                <div className="text-xl font-black text-gray-900">Outdoor</div>
                                <div className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Venue Type</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                                <span className="text-3xl mb-2">⚽</span>
                                <div className="text-xl font-black text-gray-900">{venue.game_type || 'Sports'}</div>
                                <div className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Sport</div>
                            </div>
                        </div>

                        {/* About Venue */}
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase font-montserrat">
                                About Venue
                            </h2>
                            <p className="text-sm text-gray-600 leading-relaxed mb-8">
                                {venue.description || "Experience world-class sporting action at this premier venue. Our premium facilities are designed for competitive matches and casual play alike, featuring high-quality surfaces and professional lighting for late-night sessions."}
                            </p>

                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Amenities</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(venue.amenities && venue.amenities.length > 0 ? venue.amenities : [
                                    'Free Parking', 'Secure Lockers', 'Modern Showers', 'High-Speed Wi-Fi'
                                ]).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-primary flex items-center justify-center text-sm">
                                            <FaCheck />
                                        </div>
                                        <span className="font-medium text-gray-700 text-sm">{typeof item === 'string' ? item : item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location & Terms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Location */}
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 h-full">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase font-montserrat">Location</h2>
                                {venue.google_map_url ? (
                                    <a
                                        href={venue.google_map_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block aspect-video bg-gray-100 rounded-2xl mb-4 relative overflow-hidden group cursor-pointer border border-gray-200"
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2 text-primary text-xl">
                                                    <FaMapMarkerAlt />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Open in Maps</span>
                                            </div>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="aspect-video bg-gray-100 rounded-2xl mb-4 relative overflow-hidden group cursor-pointer border border-gray-200">
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2 text-primary text-xl">
                                                    <FaMapMarkerAlt />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Open in Maps</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {venue.location}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Easily accessible with ample parking.</p>
                            </div>

                            {/* Terms */}
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 h-full">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase font-montserrat">Terms</h2>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 text-sm text-gray-600 items-start">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0"></span>
                                        Advance booking recommended
                                    </li>
                                    <li className="flex gap-3 text-sm text-gray-600 items-start">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0"></span>
                                        Valid ID proof required at entry
                                    </li>
                                    <li className="flex gap-3 text-sm text-gray-600 items-start">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0"></span>
                                        Cancellation: 24 hours notice
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN - Sticky Booking Widget */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400"></div>

                                <div className="text-center mb-8 pt-2">
                                    <h2 className="text-2xl font-bold text-gray-900 uppercase font-montserrat leading-none mb-1">
                                        Book Your Slot
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest" style={{ fontFamily: '"Inter", sans-serif' }}>Select date, time & confirm</p>
                                </div>

                                {/* Game Type Selector */}
                                {venue?.game_type && (
                                    <div className="mb-6">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3" style={{ fontFamily: '"Inter", sans-serif' }}>Select Sport</span>
                                        <div className="flex flex-wrap gap-2">
                                            {venue.game_type.split(',').map((sport, idx) => {
                                                const s = sport.trim();
                                                if (!s) return null;
                                                const isSelected = selectedSport === s;
                                                return (
                                                    <button
                                                        key={`${s}-${idx}`}
                                                        onClick={() => setSelectedSport(s)}
                                                        className={`px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${isSelected
                                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105'
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
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Select Date</span>
                                        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-2 px-2 scroll-smooth">
                                        {Array.from({ length: 30 }).map((_, i) => {
                                            const date = new Date();
                                            date.setDate(date.getDate() + i);

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
                                                    className={`flex flex-col items-center justify-center min-w-[60px] h-[70px] rounded-xl border-2 transition-all duration-200 flex-shrink-0 ${isSelected
                                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/40 scale-105 transform'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary/30 hover:bg-primary/5'
                                                        }`}
                                                >
                                                    <span className={`text-[10px] font-medium uppercase mb-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                        {dayName}
                                                    </span>
                                                    <span className={`text-xl font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                        {dayNumber}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Available Slots</span>
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
                                                        <span className={`text-sm font-medium ${isSel ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: '"Inter", sans-serif' }}>
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
                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Players</label>
                                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 h-10">
                                            <button onClick={() => setNumPlayers(Math.max(1, numPlayers - 1))} className="text-gray-400 hover:text-primary transition-colors text-lg font-semibold">-</button>
                                            <span className="text-sm font-bold text-gray-900">{numPlayers}</span>
                                            <button onClick={() => setNumPlayers(numPlayers + 1)} className="text-gray-400 hover:text-primary transition-colors text-lg font-semibold">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Team Name</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-xs font-medium text-gray-900 outline-none focus:border-primary/50 placeholder:text-gray-300"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Booking Summary */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 mb-6">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Booking Summary</h3>

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
                                                        <span className="text-sm font-medium text-gray-700" style={{ fontFamily: '"Inter", sans-serif' }}>{slot.display_time}</span>
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
