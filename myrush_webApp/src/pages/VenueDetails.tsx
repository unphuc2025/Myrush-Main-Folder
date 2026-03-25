import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSportIcon } from '../utils/sportIcons';
import { venuesApi } from '../api/venues';
import type { Venue } from '../api/venues';
import { courtsApi } from '../api/courts';
import type { CourtRatings, CourtReview } from '../api/courts';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { VenueImageGallery } from '../components/VenueImageGallery';
import { FaMapMarkerAlt, FaStar, FaClock, FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart } from 'react-icons/fa';
import { getAmenityIcon } from '../utils/amenityIcons';
import { useFavorites } from '../context/FavoritesContext';
import { useNotification } from '../context/NotificationContext';
interface SportSlice {
    id: string;
    sport_id: string;
    sport_name?: string;
    name: string;
    mask: number;
    price_per_hour?: number;
}

interface Slot {
    time: string;
    display_time: string;
    price: number;
    available: boolean;
    court_id?: string;
    court_name?: string;
    slot_id?: string;
    occupied_mask?: number;
    total_zones?: number;
    slices?: SportSlice[];
}

// --- Sub-Components ---
// Hero component removed as it is now integrated into the main layout

// --- Main Page Component ---
export const VenueDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, openAuthModal } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { showAlert } = useNotification();

    // Venue Data State
    const [venue, setVenue] = useState<Venue | null>(null);
    // Robust check: UI-level ID, venue-object ID, or venue-object branch_id
    const favorited = useMemo(() => {
        if (venue) {
            return isFavorite(venue.id) || (venue.branch_id ? isFavorite(venue.branch_id) : false);
        }
        return isFavorite(id || '');
    }, [venue, id, isFavorite]);
    const [ratings, setRatings] = useState<CourtRatings | null>(null);
    const [reviews, setReviews] = useState<CourtReview[]>([]);
    const [loadingVenue, setLoadingVenue] = useState(true);

    // Slot Selection State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(currentDate.getDate());

    // Set base date to today
    const [scrollerBaseDate] = useState(new Date());

    const [displayMonth, setDisplayMonth] = useState(new Date());
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Game Type Selection State
    const [selectedSport, setSelectedSport] = useState<string>('');
    const [selectedSliceId, setSelectedSliceId] = useState<string>('');

    // Derived configuration options (Slices) based on selected sport
    const availableConfigurations = useMemo(() => {
        const configs: { courtId: string; totalZones: number; slice: SportSlice | 'full'; label: string; minPrice: number }[] = [];
        const courtsMap = new Map<string, { totalZones: number; slices: Map<string, SportSlice>; minPrice: number; name: string }>();
        
        availableSlots.forEach(slot => {
            if (!slot.court_id) return;
            if (!courtsMap.has(slot.court_id)) {
                courtsMap.set(slot.court_id, {
                    totalZones: slot.total_zones || 1,
                    slices: new Map(),
                    minPrice: slot.price,
                    name: slot.court_name || 'Court'
                });
            }
            const cInfo = courtsMap.get(slot.court_id)!;
            if (slot.price < cInfo.minPrice) cInfo.minPrice = slot.price;
            
            if (slot.slices && slot.slices.length > 0) {
                slot.slices.forEach(sl => {
                    // Only include slices that match the selected sport
                    const sliceSport = (sl.sport_name || '').toLowerCase();
                    const activeSport = (selectedSport || '').toLowerCase();
                    if (!activeSport || sliceSport === activeSport || sliceSport.includes(activeSport) || activeSport.includes(sliceSport)) {
                        cInfo.slices.set(sl.id, sl);
                    }
                });
            }
        });

        courtsMap.forEach((cInfo, courtId) => {
            if (cInfo.slices.size > 0) {
                cInfo.slices.forEach(sl => {
                    configs.push({
                        courtId,
                        totalZones: cInfo.totalZones,
                        slice: sl,
                        label: `${cInfo.name.replace('Court', '').trim() || 'Court'} - ${sl.name}`,
                        minPrice: cInfo.minPrice
                    });
                });
            } else {
                 configs.push({
                    courtId,
                    totalZones: cInfo.totalZones,
                    slice: 'full',
                    label: cInfo.name || 'Full Court',
                    minPrice: cInfo.minPrice
                });
            }
        });
        
        return configs;
    }, [availableSlots]);

    // Auto-select first configuration when available changes
    useEffect(() => {
        if (availableConfigurations.length > 0) {
             const exists = availableConfigurations.some(c => (c.slice === 'full' ? `full-${c.courtId}` : (c.slice as SportSlice).id) === selectedSliceId);
             if (!exists) {
                 const first = availableConfigurations[0];
                 setSelectedSliceId(first.slice === 'full' ? `full-${first.courtId}` : (first.slice as SportSlice).id);
             }
        } else {
             setSelectedSliceId('');
        }
    }, [availableConfigurations]);

    // Derived slots based on selected config
    const filteredSlots = useMemo(() => {
        if (!selectedSliceId) return []; 
        
        const config = availableConfigurations.find(c => 
            (c.slice === 'full' ? `full-${c.courtId}` : (c.slice as SportSlice).id) === selectedSliceId
        );
        
        if (!config) return [];
        
        return availableSlots.filter(slot => {
            if (slot.court_id !== config.courtId) return false;
            
            if (config.slice === 'full') {
                 const fullMask = (1 << (slot.total_zones || 1)) - 1;
                 return ((slot.occupied_mask || 0) & fullMask) === 0;
            } else {
                 const sl = config.slice as SportSlice;
                 return ((slot.occupied_mask || 0) & sl.mask) === 0;
            }
        }).map(slot => {
            const sl = config.slice as SportSlice;
            const newPrice = (config.slice !== 'full' && sl.price_per_hour && sl.price_per_hour > 0) 
                ? (sl.price_per_hour / 2.0)
                : undefined;
                
            return {
                ...slot,
                price: newPrice !== undefined ? newPrice : slot.price
            };
        });
    }, [availableSlots, selectedSliceId, availableConfigurations]);

    // Talking Lands virtual tour URLs — keyed by venue (branch) ID
    const VIRTUAL_TOUR_URLS: Record<string, string> = {
        'cfc0df1c-07c9-486f-960e-6b15bb9e3bf5': 'https://rush-arena-bcu.talkinglands.studio/',          // Rush Arena BCU
        '5a28925c-c412-4115-8e9d-657fb44fc04a': 'https://rush-arena-cooke-town.talkinglands.studio/',   // Rush Arena Cooke Town
        '2e85dcd9-fa65-4e1d-917f-739f84785e91': 'https://rush-arena-gtmall.talkinglands.studio/',       // Rush Arena X KheloMore GT Mall
        '761bf3d3-7878-4080-be38-d4be3fecc52d': 'https://rush-arena-rj.talkinglands.studio/',           // Rush Arena - Rajajinagar
    };
    const venueVirtualTourUrl = id ? VIRTUAL_TOUR_URLS[id] : undefined;

    // Booking Summary State
    const [numPlayers] = useState(1);
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


    const handleDateScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scroller = e.currentTarget;
        const itemWidth = 67; // 55px width + 12px gap
        const index = Math.round(scroller.scrollLeft / itemWidth);
        const date = new Date(scrollerBaseDate);
        date.setDate(scrollerBaseDate.getDate() + index);

        if (date.getMonth() !== displayMonth.getMonth() || date.getFullYear() !== displayMonth.getFullYear()) {
            setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }
    };

    const scrollToMonth = (direction: 'prev' | 'next') => {
        if (!scrollerRef.current) return;

        const nextMonth = new Date(displayMonth);
        nextMonth.setMonth(displayMonth.getMonth() + (direction === 'next' ? 1 : -1));

        const today = new Date();
        const firstOfTodayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (nextMonth < firstOfTodayMonth) return;

        const diffTime = nextMonth.getTime() - scrollerBaseDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const itemWidth = 67;
        scrollerRef.current.scrollTo({
            left: diffDays * itemWidth,
            behavior: 'smooth'
        });
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
            showAlert('Please select at least one time slot', 'warning');
            return;
        }

        // Enforce 1-hour minimum booking (2 x 30min slots)
        if (selectedSlots.length < 2) {
            showAlert('Minimum booking duration is 1 hour (Please select at least 2 consecutive slots)', 'warning');
            return;
        }

        const currentConfig = availableConfigurations.find(c => (c.slice === 'full' ? `full-${c.courtId}` : (c.slice as SportSlice).id) === selectedSliceId);
        const sliceMask = currentConfig 
            ? (currentConfig.slice === 'full' ? ((1 << currentConfig.totalZones) - 1) : (currentConfig.slice as SportSlice).mask)
            : 0;

        const bookingState = {
            venueId: id,
            venueName: venue?.court_name,
            venueImage: venue?.photos?.[0],
            date: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`,
            selectedSlots: selectedSlots,
            selectedSport: selectedSport,
            totalPrice: selectedSlots.reduce((sum, s) => sum + s.price, 0),
            numPlayers: numPlayers,
            courtId: currentConfig?.courtId,
            sliceMask: sliceMask
        };

        if (!isAuthenticated) {
            // Preservation of state for the modal flow
            navigate(location.pathname, {
                state: {
                    from: {
                        pathname: '/booking/summary',
                        state: bookingState
                    }
                },
                replace: true
            });
            openAuthModal();
            return;
        }

        // Optimistically hide the selected slots immediately so the UI is clean
        // while the user is on the booking summary / payment flow.
        const bookedTimes = new Set(selectedSlots.map(s => s.display_time));
        setAvailableSlots(prev => prev.filter(s => !bookedTimes.has(s.display_time)));
        setSelectedSlots([]);

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
    const totalPrice = basePrice;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            <TopNav />

            <div className="max-w-[95%] 2xl:max-w-[1700px] mx-auto px-4 md:px-6 py-8 pt-20 md:pt-26">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/venues')}
                    className="flex items-center mb-2 group"
                    title="Back to Venues"
                >
                    <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center transition-all shadow-sm active:scale-95 text-gray-600">
                        <FaChevronLeft className="text-[12px] transition-transform" />
                    </div>
                </button>

                <div className="flex flex-col lg:grid lg:grid-cols-5 gap-8 lg:gap-12">

                    {/* LEFT COLUMN - Venue Info */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Title Section (Moved Above Grid) */}
                        <div className="mb-6">
                            <div className="flex justify-between items-start gap-4">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-gray-900 mb-2 uppercase leading-[1.2] py-3 break-words w-full whitespace-normal">
                                    {venue.court_name}
                                </h1>
                                <button
                                    onClick={() => venue && toggleFavorite(venue.id)}
                                    className={`mt-4 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0 ${favorited ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-100 text-gray-400 hover:text-red-400'}`}
                                    title={favorited ? "Remove from Favorites" : "Add to Favorites"}
                                >
                                    {favorited ? <FaHeart className="w-6 h-6" /> : <FaRegHeart className="w-6 h-6" />}
                                </button>
                            </div>
                            <p className="text-gray-500 flex items-center gap-2.5 text-sm font-medium">
                                <FaMapMarkerAlt className="text-primary text-base shrink-0" />
                                {venue.location}
                            </p>
                        </div>

                        <VenueImageGallery
                            photos={venue.photos || []}
                            venueName={venue.court_name}
                            virtualTourUrl={venueVirtualTourUrl}
                        />

                        {/* Available Sports */}
                        {venue.game_type && (
                            <div>
                                <h2 className="text-xl font-bold font-heading text-gray-900 uppercase tracking-tight mb-3">Available Sports</h2>
                                <div className="flex flex-wrap gap-2">
                                    {venue.game_type.split(',').map((sport, idx) => {
                                        const s = sport.trim();
                                        if (!s) return null;
                                        return (
                                            <div
                                                key={idx}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold shadow-sm"
                                            >
                                                {getSportIcon(s, "w-4 h-4 text-primary")}
                                                <span>{s}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Single flat content panel — all sections flow together */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                            {/* About */}
                            <div className="p-8">
                                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ground Overview</h2>
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

                                                const getIcon = (): React.ReactNode => {
                                                    return getAmenityIcon(label, "w-5 h-5 text-primary");
                                                };
                                                return (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0 border border-primary/20">
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
                                        className="grayscale-[0.2] transition-all duration-500"
                                    ></iframe>
                                    <a
                                        href={(venue.google_map_url && (venue.google_map_url.startsWith('http://') || venue.google_map_url.startsWith('https://')))
                                            ? venue.google_map_url
                                            : (venue.google_map_url ? `https://${venue.google_map_url}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.location + (venue.city_name ? ', ' + venue.city_name : ''))}`)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="absolute inset-0 bg-transparent cursor-pointer"
                                        title="Open full map"
                                    >
                                        <div className="absolute top-3 right-3 opacity-0 transition-opacity">
                                            <div className="bg-white shadow-lg p-2 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase text-primary border border-gray-100">
                                                <FaMapMarkerAlt className="h-3.5 w-3.5" /> View Full Map
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                {/* Full Address */}
                                <div className="mt-4 flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <FaMapMarkerAlt className="text-primary mt-0.5 text-lg shrink-0" />
                                    <span className="leading-relaxed">
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
                                        <h2 className="text-2xl font-bold text-gray-900 font-sans mb-4">Reviews And Ratings</h2>
                                        <div className="flex items-center gap-4">
                                            <span className="text-6xl font-black text-gray-900 leading-none">
                                                {(venue.rating && venue.rating > 0 ? venue.rating : (ratings?.average_rating && ratings.average_rating > 0 ? ratings.average_rating : 5.0)).toFixed(1)}
                                            </span>
                                            <div className="flex flex-col">
                                                <div className="flex text-yellow-500 text-xl gap-0.5 mb-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} className={i < Math.floor(venue.rating && venue.rating > 0 ? venue.rating : (ratings?.average_rating && ratings.average_rating > 0 ? ratings.average_rating : 5)) ? 'fill-current' : 'text-gray-200'} />
                                                    ))}
                                                </div>
                                                <span className="text-sm font-medium text-gray-500">
                                                    Based on {venue.reviews || ratings?.total_reviews || 0} Reviews
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 max-w-2xl">
                                    {reviews.length > 0 ? (
                                        reviews.map((review) => (
                                            <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
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
                                        <div className="py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-sm text-gray-400 font-medium">No reviews yet for this venue.</p>
                                        </div>
                                    )}
                                    {reviews.length > 3 && (
                                        <button className="text-primary text-xs font-bold uppercase tracking-widest pt-2 ml-2">
                                            View All {reviews.length} Reviews
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* RIGHT COLUMN - Booking Widget (Sticky with independent scroll) */}
                    <div className="lg:col-span-2 order-first lg:order-last">
                        <div className="sticky top-28 lg:top-24 h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pr-2 pb-8">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400"></div>

                                <div className="text-center mb-8 pt-2">
                                    <h2 className="text-2xl font-bold text-gray-900 leading-none mb-1">
                                        Book Your Slot
                                    </h2>
                                    <p className="text-sm text-gray-400 font-semibold">Select date, time & confirm</p>
                                </div>

                                {/* Game Type Selector */}
                                {venue?.game_type && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                                            <span className="text-base font-bold text-gray-800 leading-none">Select Sport</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {venue.game_type.split(',').map((sport, idx) => {
                                                const s = sport.trim();
                                                if (!s) return null;
                                                const isSelected = selectedSport === s;
                                                return (
                                                    <button
                                                        key={`${s}-${idx}`}
                                                        onClick={() => setSelectedSport(s)}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${isSelected
                                                            ? 'bg-primary text-white border-primary shadow-lg'
                                                            : 'bg-white text-gray-600 border-gray-400 shadow-sm'
                                                            }`}
                                                    >
                                                        {getSportIcon(s, "w-3.5 h-3.5")}
                                                        <span>{s}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Court & Size Selector (Redesigned) */}
                                {availableConfigurations.length > 0 && (() => {
                                    // Group configurations by court
                                    const courtGroups = availableConfigurations.reduce((acc, config) => {
                                        const courtName = config.label.split(' - ')[0] || 'Court';
                                        if (!acc[config.courtId]) {
                                            acc[config.courtId] = { courtId: config.courtId, courtName, slices: [] };
                                        }
                                        acc[config.courtId].slices.push(config);
                                        return acc;
                                    }, {} as Record<string, { courtId: string; courtName: string; slices: typeof availableConfigurations }>);

                                    return (
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                                                <span className="text-base font-bold text-gray-800 leading-none">
                                                    Select Court & Size
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {Object.values(courtGroups).map((group) => {
                                                    const isAnySliceSelected = group.slices.some(config => {
                                                        const configId = config.slice === 'full' ? `full-${config.courtId}` : (config.slice as SportSlice).id;
                                                        return selectedSliceId === configId;
                                                    });

                                                    return (
                                                        <div
                                                            key={group.courtId}
                                                            className={`rounded-xl border-2 p-3 transition-all ${isAnySliceSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                                                        >
                                                            {/* Court Name Header */}
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className={`w-2 h-2 rounded-full ${isAnySliceSelected ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                                                <span className={`text-sm font-bold ${isAnySliceSelected ? 'text-primary' : 'text-gray-700'}`}>
                                                                    {group.courtName}
                                                                </span>
                                                            </div>

                                                            {/* Slice chips */}
                                                            <div className="flex flex-wrap gap-2">
                                                                {group.slices.map((config, idx) => {
                                                                    const configId = config.slice === 'full' ? `full-${config.courtId}` : (config.slice as SportSlice).id;
                                                                    const isSelected = selectedSliceId === configId;
                                                                    const mask = config.slice === 'full' ? ((1 << config.totalZones) - 1) : (config.slice as SportSlice).mask;
                                                                    const sliceLabel = config.slice === 'full' ? 'Full Court' : (config.slice as SportSlice).name;

                                                                    return (
                                                                        <button
                                                                            key={`chip-${idx}`}
                                                                            onClick={() => { setSelectedSliceId(configId); setSelectedSlots([]); }}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${isSelected
                                                                                ? 'bg-primary text-white border-primary shadow-md'
                                                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary'
                                                                            }`}
                                                                        >
                                                                            <span>{sliceLabel}</span>
                                                                            <span className={`font-semibold ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                                                ₹{config.minPrice}/hr
                                                                            </span>
                                                                            {/* Mini bitmask zones */}
                                                                            {config.totalZones > 1 && (
                                                                                <div className="flex gap-0.5 ml-1">
                                                                                    {Array.from({ length: config.totalZones }).map((_, zoneIndex) => {
                                                                                        const isZoneInSlice = (mask & (1 << zoneIndex)) !== 0;
                                                                                        return (
                                                                                            <div
                                                                                                key={`z-${zoneIndex}`}
                                                                                                className={`w-3 h-4 rounded-sm text-[7px] font-black flex items-center justify-center ${isZoneInSlice
                                                                                                    ? isSelected ? 'bg-white/30 text-white' : 'bg-primary/20 text-primary'
                                                                                                    : isSelected ? 'bg-white/10 text-white/30' : 'bg-gray-200 text-gray-300'
                                                                                                }`}
                                                                                            >
                                                                                                {zoneIndex + 1}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}


                                {/* Date Selector (Horizontal) */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                                            <span className="text-base font-bold text-gray-800 leading-none">Select Date</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => scrollToMonth('prev')}
                                                className="p-1.5 rounded-full text-gray-400 transition-colors"
                                            >
                                                <FaChevronLeft className="text-[10px]" />
                                            </button>
                                            <span className="text-base font-semibold text-gray-900 min-w-[120px] text-center">
                                                {displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </span>
                                            <button
                                                onClick={() => scrollToMonth('next')}
                                                className="p-1.5 rounded-full text-gray-400 transition-colors"
                                            >
                                                <FaChevronRight className="text-[10px]" />
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        ref={scrollerRef}
                                        onScroll={handleDateScroll}
                                        className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-2 px-2 scroll-smooth"
                                    >
                                        {Array.from({ length: 120 }).map((_, i) => {
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
                                                    className={`flex flex-col items-center justify-center min-w-[60px] h-[75px] rounded-xl border-2 transition-all duration-200 flex-shrink-0 ${isSelected
                                                        ? 'bg-primary border-primary text-white shadow-lg'
                                                        : 'bg-white border-gray-400 text-gray-600 shadow-sm'
                                                        }`}
                                                >
                                                    <span className={`text-sm font-medium mb-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                        {dayName}
                                                    </span>
                                                    <span className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                        {dayNumber}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                                        <span className="block text-sm font-bold text-gray-800 leading-none">Available Slots</span>
                                    </div>
                                    {loadingSlots ? (
                                        <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : filteredSlots.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 text-xs font-medium">
                                            <FaClock className="mx-auto mb-2 text-lg opacity-30" />
                                            No slots available
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                                            {filteredSlots.map(slot => {
                                                const isSel = selectedSlots.some(s => s.display_time === slot.display_time);
                                                return (
                                                    <button
                                                        key={slot.display_time}
                                                        className={`relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 min-h-[70px] ${isSel
                                                            ? 'bg-primary border-primary text-white shadow-xl'
                                                            : 'bg-white border-gray-400 text-gray-900 shadow-sm'
                                                            }`}
                                                        onClick={() => handleSlotClick(slot)}
                                                    >
                                                        {isSel && (
                                                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center z-10 animate-in zoom-in duration-300">
                                                                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <span className={`text-xs font-semibold tracking-tight ${isSel ? 'text-white' : 'text-gray-800'}`}>
                                                            {slot.display_time}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Inputs */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-0.5 h-3 bg-primary rounded-full"></div>
                                        <label className="block text-sm font-bold text-gray-800 leading-none">Team Name</label>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Optional (e.g. My Team)"
                                        className="w-full h-10 bg-white border border-gray-200 rounded-md px-3 text-sm font-medium text-gray-900 outline-none focus:border-primary/40 placeholder:text-gray-300"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                    />
                                </div>

                                {/* Booking Summary */}
                                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-0.5 h-3 bg-primary rounded-full"></div>
                                        <h3 className="text-base font-bold text-gray-800 leading-none">Booking Summary</h3>
                                    </div>

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
                                                    <div key={idx} className="flex justify-between items-center bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
                                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{slot.display_time}</span>
                                                        <span className="text-xs font-black text-primary">₹{slot.price}</span>
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
                                            <span className="text-sm font-bold text-gray-900">Total</span>
                                            <span className="text-lg font-bold text-primary">₹{totalPrice}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full py-4 text-base font-bold rounded-xl shadow-lg shadow-primary/25 transition-all"
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
