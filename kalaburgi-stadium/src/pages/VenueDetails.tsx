import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { venuesApi } from '../api/venues';
import type { Venue } from '../api/venues';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { VenueImageGallery } from '../components/VenueImageGallery';
import { FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaArrowRight } from 'react-icons/fa';
import { getAmenityIcon } from '../utils/amenityIcons';
import { useFavorites } from '../context/FavoritesContext';

interface Slot {
    time: string;
    display_time: string;
    price: number;
    available: boolean;
    court_name?: string;
}

const CustomDropdown: React.FC<{
    label: string,
    value: string,
    options: string[],
    onChange: (val: string) => void
}> = ({ value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border-4 border-black p-4 text-xs font-black uppercase tracking-widest text-black flex items-center justify-between cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${isOpen ? 'bg-primary' : ''}`}
            >
                <span>{value || 'Select Discipline'}</span>
                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-64 overflow-y-auto no-scrollbar"
                    >
                        {options.map((opt) => (
                            <div
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className={`p-4 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-colors border-b-2 border-black last:border-none ${value === opt ? 'bg-primary text-black' : 'text-black'}`}
                            >
                                {opt}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const VenueDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, openAuthModal } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();

    const [venue, setVenue] = useState<Venue | null>(null);
    const [loadingVenue, setLoadingVenue] = useState(true);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [scrollerBaseDate] = useState(new Date());
    const [displayMonth, setDisplayMonth] = useState(new Date());
    const scrollerRef = useRef<HTMLDivElement>(null);
    
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSport, setSelectedSport] = useState<string>('');

    const favorited = useMemo(() => {
        if (venue) return isFavorite(venue.id) || (venue.branch_id ? isFavorite(venue.branch_id) : false);
        return isFavorite(id || '');
    }, [venue, id, isFavorite]);

    useEffect(() => { if (id) loadVenueData(id); }, [id]);
    useEffect(() => { if (id) fetchSlots(id); }, [id, currentDate, selectedSport]);

    const loadVenueData = async (venueId: string) => {
        setLoadingVenue(true);
        try {
            const venueRes = await venuesApi.getVenueById(venueId);
            if (venueRes.success && venueRes.data) {
                setVenue(venueRes.data);
                if (venueRes.data.game_type) {
                    const types = venueRes.data.game_type.split(',').map(s => s.trim()).filter(Boolean);
                    if (types.length > 0) setSelectedSport(types[0]);
                }
            }
        } catch (error) { console.error(error); }
        finally { setLoadingVenue(false); }
    };

    const fetchSlots = async (venueId: string) => {
        setLoadingSlots(true);
        try {
            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
            const res = await venuesApi.getVenueSlots(venueId, dateStr, selectedSport);
            setAvailableSlots(res.success && res.data ? res.data.slots.filter((s: Slot) => s.available) : []);
        } catch (error) { setAvailableSlots([]); }
        finally { setLoadingSlots(false); }
    };

    const handleDateScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const index = Math.round(e.currentTarget.scrollLeft / 67);
        const date = new Date(scrollerBaseDate);
        date.setDate(scrollerBaseDate.getDate() + index);
        if (date.getMonth() !== displayMonth.getMonth()) setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    };

    const scrollToMonth = (direction: 'prev' | 'next') => {
        if (!scrollerRef.current) return;
        const nextMonth = new Date(displayMonth);
        nextMonth.setMonth(displayMonth.getMonth() + (direction === 'next' ? 1 : -1));
        const diffDays = Math.ceil((nextMonth.getTime() - scrollerBaseDate.getTime()) / 86400000);
        scrollerRef.current.scrollTo({ left: diffDays * 67, behavior: 'smooth' });
    };

    const handleSlotClick = (slot: Slot) => {
        const exists = selectedSlots.some(s => s.display_time === slot.display_time);
        setSelectedSlots(exists ? selectedSlots.filter(s => s.display_time !== slot.display_time) : [...selectedSlots, slot]);
    };

    const handleBooking = () => {
        if (!venue || !id || selectedSlots.length === 0) return;
        const bookingState = {
            venueId: id,
            venueName: venue.court_name,
            venueImage: venue.photos?.[0],
            date: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`,
            selectedSlots, selectedSport,
            totalPrice: selectedSlots.reduce((sum, s) => sum + s.price, 0),
            numPlayers: 1, teamName: ''
        };
        if (!isAuthenticated) {
            navigate(location.pathname, { state: { from: { pathname: '/booking/summary', state: bookingState } }, replace: true });
            openAuthModal();
            return;
        }
        navigate('/booking/summary', { state: bookingState });
    };

    if (loadingVenue) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;
    if (!venue) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center font-black uppercase"><h2 className="text-2xl mb-4">Venue not found</h2><Button onClick={() => navigate('/venues')}>Back</Button></div></div>;

    const totalPrice = selectedSlots.reduce((acc, s) => acc + s.price, 0);

    return (
        <div className="min-h-screen bg-zinc-100 font-sans text-black pb-20">
            <TopNav />
            <div className="container mx-auto px-6 pb-20 pt-24 md:pt-32">
                <button onClick={() => navigate('/venues')} className="mb-10 w-12 h-12 border-4 border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"><FaChevronLeft /></button>

                <div className="flex flex-col lg:grid lg:grid-cols-5 gap-10 lg:gap-16">
                    <div className="lg:col-span-3 space-y-12">
                        <div className="mb-0 border-l-[12px] border-black pl-8 relative z-10 transition-transform duration-500 overflow-visible">
                            <div className="flex justify-between items-start gap-4">
                                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black font-heading text-black mb-2 uppercase leading-[1.0] py-3 break-words w-full whitespace-normal italic drop-shadow-[4px_4px_0px_rgba(163,230,53,1)]">{venue.court_name}</h1>
                                <button onClick={() => toggleFavorite(venue.id)} className={`mt-4 w-14 h-14 rounded-none border-4 flex items-center justify-center transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 shrink-0 ${favorited ? 'bg-red-500 border-black text-white' : 'bg-white border-black text-zinc-300'}`}>{favorited ? <FaHeart /> : <FaRegHeart />}</button>
                            </div>
                            <p className="text-black flex items-center gap-2.5 text-base font-black uppercase tracking-[0.2em] italic"><FaMapMarkerAlt className="text-primary drop-shadow-[2px_2px_0px_black]" />{venue.location}</p>
                        </div>

                        <div className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white p-2">
                            <VenueImageGallery photos={venue.photos || []} venueName={venue.court_name} />
                        </div>

                        <div className="bg-white rounded-none border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative group/info">
                            <div className="absolute top-20 right-0 text-[18rem] font-black text-zinc-100/30 z-0 pointer-events-none uppercase tracking-tighter italic select-none leading-none opacity-20">INFO</div>
                            <div className="p-10 relative z-10 bg-white/40 backdrop-blur-[2px]">
                                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Ground Overview</h2>
                                <p className="text-lg text-black font-bold leading-relaxed">{venue.description || "Experience world-class sporting action."}</p>
                            </div>

                            {venue.amenities && venue.amenities.length > 0 && (
                                <div className="p-10 relative z-10 border-t-4 border-black/10">
                                    <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter mb-8 italic drop-shadow-[4px_4px_0px_rgba(163,230,53,1)]">Elite Amenities</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                                        {venue.amenities.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="w-12 h-12 rounded-none bg-primary border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-primary transition-colors flex-shrink-0">
                                                    {getAmenityIcon(typeof item === 'string' ? item : item.name, "w-6 h-6 text-black")}
                                                </div>
                                                <span className="text-sm font-black uppercase tracking-widest text-black">{typeof item === 'string' ? item : item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-10 border-t-4 border-black/10">
                                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">Location</h2>
                                <div className="relative group overflow-hidden rounded-none border-4 border-black aspect-video mb-6 shadow-[8px_8px_0px_0px_rgba(163,230,53,1)]">
                                    <iframe width="100%" height="100%" style={{ border: 0 }} src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(venue.location)}`}></iframe>
                                </div>
                                <div className="mt-4 flex items-start gap-4 text-base font-bold text-black bg-zinc-50 p-6 border-4 border-black"><FaMapMarkerAlt className="text-primary text-2xl shrink-0" /><span>{venue.location}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 order-first lg:order-last">
                        <div className="sticky top-28 lg:top-36 h-[calc(100vh-160px)] overflow-y-auto no-scrollbar pb-12">
                            <div className="bg-white rounded-none p-6 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] border-8 border-black relative overflow-hidden">
                                <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                                <div className="absolute top-0 left-0 w-full h-2 bg-primary z-10"></div>
                                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-3xl z-0" />

                                <div className="relative z-20">
                                    <div className="text-center mb-8 pt-2"><h2 className="text-3xl font-black text-black uppercase tracking-tighter italic leading-none mb-1">Booking Slot</h2><p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Select date & confirm booking</p></div>
                                    
                                    {venue.game_type && (
                                        <div className="mb-8 bg-zinc-100 p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex items-center gap-4 mb-4 italic"><div className="w-1.5 h-6 bg-black"></div><span className="text-[10px] font-black uppercase tracking-widest">Choose Discipline</span></div>
                                            <CustomDropdown label="Sport" value={selectedSport} options={venue.game_type.split(',').map(s => s.trim())} onChange={setSelectedSport} />
                                        </div>
                                    )}

                                    <div className="mb-10">
                                        <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4 italic"><div className="w-2 h-8 bg-black"></div><span className="text-2xl font-black text-black uppercase tracking-tighter">Select Date</span></div><div className="flex items-center gap-4"><button onClick={() => scrollToMonth('prev')} className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><FaChevronLeft /></button><span className="text-sm font-black text-black uppercase tracking-widest min-w-[140px] text-center italic">{displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span><button onClick={() => scrollToMonth('next')} className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><FaChevronRight /></button></div></div>
                                        <div ref={scrollerRef} onScroll={handleDateScroll} className="flex overflow-x-auto pb-6 gap-4 no-scrollbar -mx-2 px-2 scroll-smooth">
                                            {Array.from({ length: 90 }).map((_, i) => {
                                                const d = new Date(scrollerBaseDate); d.setDate(scrollerBaseDate.getDate() + i);
                                                const isSel = d.toDateString() === currentDate.toDateString();
                                                return <button key={i} onClick={() => setCurrentDate(d)} className={`flex flex-col items-center justify-center min-w-[70px] h-[90px] border-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${isSel ? 'bg-primary border-black text-black' : 'bg-white border-black text-black'}`}><span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSel ? 'text-black' : 'text-zinc-400'}`}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span><span className="text-2xl font-black">{d.getDate()}</span></button>
                                            })}
                                        </div>
                                    </div>

                                    <div className="mb-10">
                                        <div className="flex items-center gap-4 mb-8 italic"><div className="w-2 h-8 bg-primary"></div><span className="text-2xl font-black text-black uppercase tracking-tighter">Available Slots</span></div>
                                        {loadingSlots ? <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-black border-t-primary animate-spin"></div></div> : availableSlots.length === 0 ? <div className="text-center py-12 bg-zinc-50 border-4 border-black border-dashed font-black uppercase text-zinc-400 text-xs">No windows available</div> : (
                                            <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-4 no-scrollbar">
                                                {availableSlots.map(slot => {
                                                    const isS = selectedSlots.some(s => s.display_time === slot.display_time);
                                                    return <button key={slot.display_time} className={`relative flex items-center justify-center p-5 border-4 transition-all min-h-[80px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${isS ? 'bg-black text-white border-black' : 'bg-white border-black text-black hover:bg-primary'}`} onClick={() => handleSlotClick(slot)}><span className="text-sm font-black uppercase tracking-tighter">{slot.display_time}</span></button>
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-zinc-50 border-4 border-black border-dashed p-8 mb-10">
                                        <div className="flex items-center gap-3 mb-6"><div className="w-6 h-1 bg-black"></div><h3 className="text-xl font-black text-black uppercase tracking-tighter italic">Booking Summary</h3></div>
                                        <div className="space-y-4 mb-6">
                                            {selectedSport && <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Discipline</span><span className="text-sm font-black uppercase italic">{selectedSport}</span></div>}
                                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Booking Date</span><span className="text-sm font-black uppercase">{currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Venue</span><span className="text-sm font-black uppercase max-w-[150px] truncate text-right">{venue.court_name}</span></div>
                                        </div>

                                        <div className="h-0.5 bg-black/10 my-6"></div>

                                        {selectedSlots.length > 0 && (
                                            <div className="mb-6">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-4">Confirmed Slots</span>
                                                <div className="space-y-3">
                                                    {selectedSlots.map((slot: Slot, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center bg-white border-2 border-black rounded-none px-4 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                                            <span className="text-xs font-black uppercase tracking-widest">{slot.display_time}</span>
                                                            <span className="text-xs font-black text-black drop-shadow-[1px_1px_rgba(163,230,53,1)]">₹{slot.price}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="h-0.5 bg-black/10 my-6"></div>
                                        <div className="flex justify-between items-center pt-4 border-t-2 border-black"><span className="text-lg font-black uppercase tracking-tighter">Total Price</span><span className="text-4xl font-black text-black italic drop-shadow-[4px_4px_0px_0px_rgba(163,230,53,1)]">BYZ ₹{totalPrice}</span></div>
                                    </div>

                                    <button onClick={handleBooking} disabled={selectedSlots.length === 0} className="w-full py-6 bg-black text-white font-black uppercase tracking-[0.2em] text-sm transition-all shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] hover:bg-primary hover:text-black hover:scale-[1.02] active:scale-[0.98] active:shadow-none disabled:opacity-50 disabled:grayscale italic">Proceed to Pay <FaArrowRight className="inline ml-2" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
