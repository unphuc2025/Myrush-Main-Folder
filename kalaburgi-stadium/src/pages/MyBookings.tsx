import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingsApi } from '../api/bookings';
import { TopNav } from '../components/TopNav';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaStar } from 'react-icons/fa';
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
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        loadBookings();
    }, [activeTab]);

    // [x] Update MyBookings.tsx with Neubrutalist Ticket cards <!-- id: 37 -->
    // [ ] Redesign VenueDetails.tsx booking widget <!-- id: 38 -->
    const loadBookings = async () => {
        setLoading(true);
        const res = await bookingsApi.getUserBookings();
        if (res.success && res.data) {
            let processedBookings = res.data.map((b: Booking) => {
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
                        // If no end time but confirmed, treat as upcoming (e.g. newly created)
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


    return (
        <div className="min-h-screen bg-zinc-100 font-sans text-black pb-20">
            <TopNav />

            <div className="max-w-7xl mx-auto px-6 pt-28">
                <header className="mb-12 border-l-[12px] border-black pl-8">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                        My <span className="text-primary italic">Sessions</span>
                    </h1>
                    <p className="text-lg font-bold uppercase tracking-widest text-zinc-600 mt-2">Manage your athletic journey at DSA Gulbarga</p>
                </header>

                <div className="flex flex-wrap gap-4 mb-12">
                    {['all', 'upcoming', 'completed', 'cancelled'].map(tab => (
                        <button
                            key={tab}
                            className={`px-8 py-3 font-black uppercase tracking-widest text-sm transition-all border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                                activeTab === tab 
                                ? 'bg-primary border-black text-black' 
                                : 'bg-white border-black text-black hover:bg-zinc-50'
                            }`}
                            onClick={() => setActiveTab(tab as any)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {loading ? (
                        <div className="col-span-full h-64 flex items-center justify-center bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                            <span className="ml-4 font-black uppercase tracking-widest">Retrieving Data...</span>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="col-span-full bg-white border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
                            <div className="text-primary text-6xl mb-6 flex justify-center"><FaCalendarAlt /></div>
                            <h3 className="text-3xl font-black uppercase mb-4">No {activeTab !== 'all' ? activeTab : ''} Sessions</h3>
                            <p className="text-zinc-500 font-bold uppercase tracking-wider mb-8">Your arena is waiting for you.</p>
                            <button 
                                className="bg-black text-white px-10 py-4 font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(163,230,53,1)]"
                                onClick={() => navigate('/venues')}
                            >
                                Book a Slot
                            </button>
                        </div>
                    ) : (
                        bookings.map(booking => (
                            <motion.div
                                key={booking.id}
                                className="bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col sm:flex-row min-h-[220px]"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Ticket Left Pin */}
                                <div className="bg-primary border-r-4 border-black p-6 flex flex-col justify-center items-center sm:min-w-[120px] text-center">
                                    <span className="text-4xl font-black leading-none">{new Date(booking.booking_date).getDate()}</span>
                                    <span className="text-xs font-black uppercase tracking-widest leading-none mt-1">
                                        {new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <div className="mt-4 w-full h-px border-t-2 border-dashed border-black opacity-30"></div>
                                    <span className="text-[10px] font-black uppercase mt-2 opacity-60">
                                        {new Date(booking.booking_date).getFullYear()}
                                    </span>
                                </div>

                                {/* Main Session info */}
                                <div className="flex-1 p-6 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest skew-x-[-15deg]">
                                            <span className="inline-block skew-x-[15deg]">{booking.status}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400">ID: {booking.booking_display_id || booking.id.slice(0, 8)}</span>
                                    </div>

                                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{booking.venue_name}</h3>
                                    <p className="text-black/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-6">
                                        <FaMapMarkerAlt className="text-primary" /> {booking.venue_location}
                                    </p>

                                    <div className="mt-auto grid grid-cols-2 border-t-2 border-black border-dashed pt-4">
                                        <div>
                                            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Time Slot</span>
                                            <span className="flex items-center gap-1 font-black text-sm uppercase">
                                                <FaClock className="text-primary text-xs" /> 
                                                {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Investment</span>
                                            <span className="text-xl font-black">₹{booking.total_amount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions - Hover or Side Strip */}
                                <div className="bg-zinc-50 border-l-4 border-black p-4 flex sm:flex-col justify-center gap-3">
                                    <button
                                        className="bg-black text-white w-full h-12 flex items-center justify-center hover:bg-primary hover:text-black transition-colors border-2 border-black"
                                        title="View Details"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest">Details</span>
                                    </button>
                                    
                                    {booking.status === 'completed' && !reviewStates[booking.id]?.has_reviewed && (
                                        <button
                                            className="bg-primary text-black w-full h-12 flex items-center justify-center hover:bg-black hover:text-white transition-colors border-2 border-black"
                                            title="Rate Experience"
                                            onClick={() => setShowRatingModal(booking.id)}
                                        >
                                            <FaStar className="text-sm" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </main>

                {/* MODALS RENDERED WITH NEUBRUTALIST STYLING BELOW */}
                <AnimatePresence>
                    {selectedBooking && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
                            <motion.div
                                className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-primary border-b-8 border-black p-8 flex justify-between items-center">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Session Invoice</h3>
                                    <button className="text-3xl font-black" onClick={() => setSelectedBooking(null)}>×</button>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="flex justify-between items-end border-b-4 border-black border-dashed pb-8">
                                        <div>
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Venue Details</span>
                                            <h4 className="text-3xl font-black uppercase">{selectedBooking.venue_name}</h4>
                                            <p className="font-bold text-zinc-600 uppercase tracking-wider">{selectedBooking.venue_location}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-widest skew-x-[-15deg] inline-block">
                                                <span className="inline-block skew-x-[15deg]">{selectedBooking.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Date</span>
                                                <span className="text-lg font-black uppercase">
                                                    {new Date(selectedBooking.booking_date).toLocaleDateString('en-US', {
                                                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Time Slot</span>
                                                <span className="text-lg font-black uppercase flex items-center gap-2">
                                                    <FaClock className="text-primary" />
                                                    {selectedBooking.start_time?.slice(0, 5)} - {selectedBooking.end_time?.slice(0, 5)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-4 text-right">
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Price Breakdown</span>
                                                <span className="text-sm font-bold text-zinc-500 uppercase">Regular Court Rate</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Total Payable</span>
                                                <span className="text-4xl font-black text-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                                    ₹{selectedBooking.total_amount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex justify-center">
                                        <button 
                                            className="bg-black text-white w-full py-5 text-xl font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-colors shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] active:shadow-none translate-y-0 active:translate-y-2 active:translate-x-2"
                                            onClick={() => setSelectedBooking(null)}
                                        >
                                            Acknowledge
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Rating Modal styled the same way */}
                    {showRatingModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowRatingModal(null)}>
                            <motion.div
                                className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-primary border-b-8 border-black p-8">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Rate Session</h3>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Help others play better</p>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="flex justify-center scale-150 py-4">
                                        {renderStars(selectedRating, true, setSelectedRating)}
                                    </div>

                                    <textarea
                                        className="w-full bg-zinc-100 border-4 border-black p-4 font-bold text-sm outline-none focus:bg-white transition-colors"
                                        placeholder="EXPLAIN YOUR EXPERIENCE..."
                                        rows={4}
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            className="border-4 border-black p-4 font-black uppercase tracking-widest"
                                            onClick={() => setShowRatingModal(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className="bg-black text-white p-4 font-black uppercase tracking-widest disabled:opacity-30"
                                            onClick={() => {
                                                const booking = bookings.find(b => b.id === showRatingModal);
                                                if (booking) handleSubmitReview(booking.id, booking.court_id || '');
                                            }}
                                            disabled={selectedRating === 0}
                                        >
                                            Post Review
                                        </button>
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

export default MyBookings;
