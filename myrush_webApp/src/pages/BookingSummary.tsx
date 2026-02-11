import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/bookings';
import { venuesApi } from '../api/venues';

import { Button } from '../components/ui/Button';
import { TopNav } from '../components/TopNav';
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaClock } from 'react-icons/fa';

interface Slot {
    time: string;
    display_time: string;
    price: number;
}

interface LocationState {
    venueId: string;
    date: string;
    selectedSlots: Slot[];
    totalPrice: number;
    venueImage?: string;
}

export const BookingSummary: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;

    const [venue, setVenue] = useState<any>(null);
    const [numPlayers, setNumPlayers] = useState(2);
    const [teamName, setTeamName] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!state) {
            navigate('/venues');
            return;
        }

        const loadVenue = async () => {
            const res = await venuesApi.getVenueById(state.venueId);
            if (res.success && res.data) {
                setVenue(res.data);
            }
        };
        loadVenue();
    }, [state, navigate]);

    if (!state || !venue) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;

    // Calculations
    const slotsCost = state.selectedSlots.length * (state.selectedSlots[0]?.price || 0);
    const platformFee = 20;
    const tax = Math.round(slotsCost * 0.18);
    const totalAmount = slotsCost + platformFee + tax - discount;

    const handleApplyCoupon = () => {
        if (couponCode.toLowerCase() === 'first50') {
            setDiscount(50);
            alert('Coupon Applied: ₹50 Off');
        } else {
            alert('Invalid Coupon Code');
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                alert('Razorpay SDK failed to load. Are you online?');
                setSubmitting(false);
                return;
            }

            const sortedSlots = [...state.selectedSlots].sort((a, b) => a.time.localeCompare(b.time));
            const startTime = sortedSlots[0].time;
            const durationMinutes = sortedSlots.length * 60;

            // 1. Create Payment Order
            const orderRes = await bookingsApi.createPaymentOrder({
                courtId: state.venueId,
                bookingDate: state.date,
                startTime: startTime,
                durationMinutes: durationMinutes,
                timeSlots: state.selectedSlots,
                numberOfPlayers: numPlayers,
                couponCode: couponCode // Pass current coupon code state
            });

            if (!orderRes.success || !orderRes.data) {
                alert('Failed to initiate payment: ' + (orderRes.data?.detail || 'Unknown error'));
                setSubmitting(false);
                return;
            }

            const { id: order_id, amount, currency, key_id } = orderRes.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: "MyRush",
                description: `Booking for ${venue.court_name}`,
                image: "https://your-logo-url.com/logo.png", // Replace with valid logo
                order_id: order_id,
                handler: async function (response: any) {
                    // 3. Verify & Create Booking
                    try {
                        const payload = {
                            courtId: state.venueId,
                            bookingDate: state.date,
                            startTime: startTime,
                            durationMinutes: durationMinutes,
                            numberOfPlayers: numPlayers,
                            pricePerHour: sortedSlots[0].price,
                            teamName: teamName,
                            timeSlots: state.selectedSlots,
                            totalAmount: totalAmount, // This is client-side calc, backend uses its own
                            // Razorpay Details
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        };

                        const res = await bookingsApi.createBooking(payload);

                        if (res.success) {
                            alert('Booking Confirmed!');
                            navigate('/bookings');
                        } else {
                            alert('Payment successful but booking creation failed. Please contact support. ' + (res.data?.detail || ''));
                        }
                    } catch (err: any) {
                        alert('Error confirming booking: ' + err.message);
                    }
                },
                prefill: {
                    name: "MyRush User", // Ideally dynamic user details
                    email: "user@example.com",
                    contact: "9999999999"
                },
                notes: {
                    address: "MyRush Corporate Office"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error(error);
            alert('An error occurred during transaction');
        } finally {
            setSubmitting(false); // Note: Razorpay modal stays open, but we reset button state. 
            // Might want to keep it loading until handler returns, but Razorpay is async. 
            // Actually, keep submitting true creates better UX if we handle failures in handler.
            // But for now, reset on modal open/error.
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-inter text-gray-900 pb-20">
            <TopNav />

            <div className="pt-24 max-w-7xl mx-auto px-6 md:px-12">
                <header className="mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2 transition-colors"
                    >
                        <span>←</span> Back
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Booking <span className="text-primary">Summary</span></h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
                    {/* LEFT COLUMN: Venue Details & Images */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Venue Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden group">
                            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 relative bg-gray-100">
                                <img
                                    src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070'}
                                    alt={venue.court_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black">
                                    {venue.game_type || 'Sports'}
                                </div>
                            </div>

                            <h2 className="text-2xl font-black uppercase mb-2">{venue.court_name}</h2>
                            <p className="flex items-center gap-2 text-gray-500 font-medium text-sm mb-6">
                                <FaMapMarkerAlt className="text-primary" /> {venue.location}
                            </p>

                            <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-6">
                                <div className="bg-gray-50 px-4 py-3 rounded-xl min-w-[140px]">
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Date</div>
                                    <div className="font-black flex items-center gap-2">
                                        <FaCalendarAlt className="text-primary" /> {state.date}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 rounded-xl min-w-[140px]">
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Time</div>
                                    <div className="font-black flex items-center gap-2">
                                        <FaClock className="text-primary" />
                                        {state.selectedSlots[0]?.display_time}
                                        {state.selectedSlots.length > 1 && ` + ${state.selectedSlots.length - 1} more`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Booking Details Input */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black uppercase mb-6">Game Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Number of Players</label>
                                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200 w-fit">
                                        <button onClick={() => setNumPlayers(Math.max(1, numPlayers - 1))} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors">-</button>
                                        <span className="font-black w-8 text-center">{numPlayers}</span>
                                        <button onClick={() => setNumPlayers(numPlayers + 1)} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Team Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 font-medium focus:border-black transition-colors"
                                        placeholder="e.g. Thunder Strikers"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Summary & Payment */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-6">
                            {/* Price Breakdown */}
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                                <h3 className="text-xl font-black uppercase mb-6">Payment Summary</h3>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                                        <span>Slot Price ({state.selectedSlots.length} slots)</span>
                                        <span>₹{slotsCost}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                                        <span>Convenience Fee</span>
                                        <span>₹{platformFee}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                                        <span>Taxes (18% GST)</span>
                                        <span>₹{tax}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600 font-bold">
                                            <span>Discount Applied</span>
                                            <span>-₹{discount}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-dashed border-gray-200 my-6 pt-6 flex justify-between items-end">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Payable</span>
                                    <span className="text-3xl font-black text-black">₹{totalAmount}</span>
                                </div>

                                {/* Coupon Section */}
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Have a coupon?</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <FaTicketAlt className="absolute top-3.5 left-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="w-full h-11 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold uppercase placeholder:normal-case focus:border-primary/50"
                                                placeholder="Enter code"
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="px-4 h-11 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 ml-1">*Try 'FIRST50' for ₹50 off</p>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full h-14 text-lg font-black shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform"
                                    onClick={handleConfirm}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : `Pay ₹${totalAmount}`}
                                </Button>
                            </div>

                            {/* Trust Badge */}
                            <div className="bg-gray-100 rounded-2xl p-4 text-center ">
                                <p className="text-xs text-gray-500 font-bold">🔒 100% Secure Payment powered by Razorpay</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
