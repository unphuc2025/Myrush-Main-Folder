import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/bookings';
import { venuesApi } from '../api/venues';
import { couponsApi, type AvailableCoupon } from '../api/coupons';

import { TopNav } from '../components/TopNav';
import { FaMapMarkerAlt, FaTicketAlt, FaClock, FaChevronLeft, FaArrowRight } from 'react-icons/fa';

interface Slot {
    time: string;
    display_time: string;
    price: number;
    court_id?: string;
    court_name?: string;
}

interface LocationState {
    venueId: string;
    venueName?: string;
    venueImage?: string;
    date: string;
    selectedSlots: Slot[];
    selectedSport: string;
    totalPrice: number;
    numPlayers?: number;
}

export const BookingSummary: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;

    const [venue, setVenue] = useState<any>(null);
    const [numPlayers] = useState(state?.numPlayers || 1);
    const [teamName, setTeamName] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCouponCode, setAppliedCouponCode] = useState(''); // locked-in code after validation
    const [submitting, setSubmitting] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
    const [appliedCouponInfo, setAppliedCouponInfo] = useState<any>(null);

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

        const loadCoupons = async () => {
            const res = await couponsApi.getAvailableCoupons();
            if (res.success) {
                setAvailableCoupons(res.data);
            }
        };

        loadVenue();
        loadCoupons();
    }, [state, state?.venueId, navigate]);

    if (!state || (!venue && !state.venueName)) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;

    // Calculations
    const baseSlotsPrice = state.selectedSlots.reduce((acc, s) => acc + s.price, 0);
    const slotsCost = baseSlotsPrice;
    const platformFee = 0;
    const tax = 0;
    const totalAmount = slotsCost + platformFee + tax - discount;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        try {
            const res = await couponsApi.validateCoupon(couponCode, slotsCost);
            if (res.success && res.data.valid) {
                setDiscount(res.data.discount_amount || 0);
                setAppliedCouponCode(couponCode.trim().toUpperCase()); // lock in the code
                setAppliedCouponInfo(res.data);
                alert(`Coupon Applied: ₹${res.data.discount_amount} Off`);
            } else {
                setDiscount(0);
                setAppliedCouponCode('');
                setAppliedCouponInfo(null);
                alert(res.data.message || 'Invalid Coupon Code');
            }
        } catch (error) {
            alert('Failed to validate coupon');
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
            const durationMinutes = sortedSlots.length * 30;

            if (durationMinutes < 60) {
                alert('Minimum booking duration is 1 hour (2 slots).');
                setSubmitting(false);
                return;
            }

            const orderRes = await bookingsApi.createPaymentOrder({
                courtId: state.selectedSlots[0]?.court_id || state.venueId,
                bookingDate: state.date,
                startTime: startTime,
                durationMinutes: durationMinutes,
                timeSlots: state.selectedSlots,
                numberOfPlayers: numPlayers,
                couponCode: couponCode
            });

            if (!orderRes.success || !orderRes.data) {
                alert('Failed to initiate payment: ' + (orderRes.data?.detail || 'Unknown error'));
                setSubmitting(false);
                return;
            }

            const { id: order_id, amount, currency, key_id } = orderRes.data;

            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: "MyRush",
                description: `Booking for ${state.venueName || venue?.court_name}`,
                image: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? undefined
                    : `${window.location.origin}/Rush-logo.webp`,
                order_id: order_id,
                handler: async function (response: any) {
                    try {
                        const payload = {
                            courtId: state.selectedSlots[0]?.court_id || state.venueId,
                            bookingDate: state.date,
                            startTime: startTime,
                            durationMinutes: durationMinutes,
                            numberOfPlayers: numPlayers,
                            pricePerHour: sortedSlots[0].price,
                            teamName: teamName,
                            timeSlots: state.selectedSlots,
                            totalAmount: totalAmount,
                            originalAmount: slotsCost + platformFee,
                            discountAmount: discount,
                            couponCode: appliedCouponCode || undefined,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        };

                        const res = await bookingsApi.createBooking(payload);

                        if (res.success) {
                            alert('Booking Confirmed! 🎉');
                            // Navigate to bookings — VenueDetails will auto-refetch slots
                            // on window focus when user returns, hiding the booked slot.
                            navigate('/bookings', { state: { bookingSuccess: true } });
                        } else {
                            alert('Payment successful but booking creation failed. ' + (res.data?.detail || ''));
                        }
                    } catch (err: any) {
                        alert('Error confirming booking: ' + err.message);
                    }
                },
                prefill: {
                    name: "MyRush User",
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: { color: "#3399cc" }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error(error);
            alert('An error occurred during transaction');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 font-sans text-black pb-20">
            <TopNav />
            <div className="container mx-auto px-6 pb-20 pt-24 md:pt-32">
                <header className="mb-16 border-l-[12px] border-black pl-10 relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center mb-8"
                        title="Back"
                    >
                        <div className="w-14 h-14 border-4 border-black bg-white flex items-center justify-center transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                            <FaChevronLeft className="text-black transition-transform group-hover:-translate-x-1 text-xl" />
                        </div>
                        <span className="ml-6 text-xs font-black uppercase tracking-[0.2em] text-black">Back</span>
                    </button>
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-black font-heading uppercase tracking-tighter leading-none italic drop-shadow-[4px_4px_0px_rgba(163,230,53,1)]">
                        Booking <span className="text-black not-italic">Summary</span>
                    </h1>
                    <p className="text-sm text-zinc-500 font-black uppercase tracking-[0.3em] mt-4 italic">Verify details before final payment</p>
                </header>

                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-12 lg:gap-20">
                    {/* LEFT COLUMN: Verification Details */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Main Spotlight Card */}
                        <div className="bg-white overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] border-4 border-black rounded-none relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -z-10" />
                            <div className="flex flex-col md:grid md:grid-cols-5 h-full">
                                <div className="relative aspect-[16/10] md:aspect-auto bg-zinc-100 md:col-span-2 border-r-0 md:border-r-4 border-black overflow-hidden">
                                    <img
                                        src={state.venueImage || venue?.photos?.[0] || 'https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070'}
                                        alt={state.venueName || venue?.court_name}
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                    />
                                    <div className="absolute top-6 left-6 bg-primary px-6 py-3 border-4 border-black rounded-none text-xs font-black uppercase tracking-widest text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] italic">
                                        {state.selectedSport}
                                    </div>
                                </div>
                                <div className="p-10 sm:p-14 flex flex-col justify-center md:col-span-3 bg-white relative">
                                    <div className="absolute top-10 right-10 text-8xl font-black text-zinc-50/50 -z-0 pointer-events-none uppercase italic leading-none select-none">BYZ</div>
                                    <div className="mb-10 relative z-10">
                                        <div className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                            <div className="w-1.5 h-4 bg-primary border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"></div>
                                            Selected Venue
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic mb-6 break-words">{state.venueName || venue?.court_name}</h2>
                                        <p className="flex items-start gap-3 text-black font-black text-sm uppercase tracking-tight leading-relaxed italic">
                                            <FaMapMarkerAlt className="text-primary mt-1 shrink-0 text-lg drop-shadow-[2px_2px_0px_black]" /> {venue?.location || state.venueName}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10 pt-10 border-t-4 border-black relative z-10">
                                        <div className="space-y-2">
                                            <div className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Discipline</div>
                                            <div className="text-base font-black text-black uppercase italic tracking-tighter">
                                                {state.selectedSport}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Court</div>
                                            <div className="text-base font-black text-black uppercase tracking-tighter">
                                                {state.selectedSlots[0]?.court_name || 'Primary Arena'}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Booking Date</div>
                                            <div className="text-base font-black text-black uppercase tracking-tighter">
                                                {new Date(state.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slot and Player Verification */}
                        <div className="bg-white rounded-none p-10 sm:p-14 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] border-4 border-black relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b-4 border-black pb-10 italic">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Time Slots</h3>
                                    <p className="text-xs text-zinc-400 font-black uppercase tracking-[0.3em] mt-2">Confirmed Durations</p>
                                </div>
                                <div className="bg-primary border-4 border-black px-6 py-3 text-xs font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] italic">
                                    {state.selectedSlots.length} Slots Selected
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {state.selectedSlots.map((slot, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-zinc-50 border-4 border-black rounded-none px-8 py-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-[1.02] hover:bg-white group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-none bg-white flex items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:bg-primary transition-colors">
                                                    <FaClock className="text-black text-sm" />
                                                </div>
                                                <span className="text-lg font-black uppercase tracking-tighter">{slot.display_time}</span>
                                            </div>
                                            <span className="text-xl font-black text-black italic drop-shadow-[2px_2px_0px_rgba(163,230,53,1)]">₹{slot.price}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-14 pt-10 border-t-4 border-black/5">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-2.5 h-6 bg-black"></div>
                                        <label className="text-xs font-black text-black uppercase tracking-[0.3em]">Team Name (Optional)</label>
                                    </div>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="w-full h-20 bg-zinc-50 border-4 border-black rounded-none px-8 font-black uppercase focus:bg-primary transition-all text-black placeholder:text-zinc-300 text-lg outline-none tracking-widest shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]"
                                        placeholder="Enter Team Name"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Financial Summary */}
                    <div className="lg:col-span-1">
                        <div className="static lg:sticky lg:top-36 space-y-12">
                            <div className="bg-black text-white rounded-none p-10 sm:p-14 shadow-[20px_20px_0px_0px_rgba(163,230,53,1)] border-[8px] border-black relative overflow-hidden">
                                <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                                <div className="absolute top-0 left-0 w-full h-4 bg-primary z-10"></div>
                                <h3 className="text-3xl font-black uppercase tracking-widest italic mb-12 pb-6 border-b-4 border-white/20 relative z-20">Final Price</h3>

                                <div className="space-y-8 mb-12 relative z-20">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                                        <span>Base Price</span>
                                        <span className="text-white">₹{baseSlotsPrice}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                                        <span>Discount</span>
                                        <span className="text-primary">-₹{discount}</span>
                                    </div>
                                    <div className="h-0.5 bg-white opacity-20" />
                                    <div className="pt-4">
                                        <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] block mb-4">Total Amount</span>
                                        <span className="text-7xl md:text-8xl font-black text-primary tracking-tighter italic leading-none drop-shadow-[6px_6px_0px_rgba(255,255,255,0.1)]">₹{totalAmount}</span>
                                    </div>
                                </div>

                                {/* Dynamic Coupon UI */}
                                <div className="mb-14 space-y-6 relative z-20">
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <FaTicketAlt className="absolute top-1/2 -translate-y-1/2 left-5 text-black text-lg z-10" />
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="w-full h-16 pl-14 bg-white border-4 border-black rounded-none text-sm font-black uppercase tracking-widest focus:bg-primary text-black placeholder:text-zinc-400 outline-none transition-all shadow-[4px_4px_0px_rgba(255,255,255,0.2)]"
                                                placeholder="COUPON CODE"
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="px-8 h-16 bg-primary text-black border-4 border-black rounded-none text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:translate-y-1 shadow-[6px_6px_0px_rgba(255,255,255,0.2)]"
                                        >
                                            {discount > 0 ? 'REPLACE' : 'APPLY'}
                                        </button>
                                    </div>

                                    {appliedCouponInfo && (
                                        <div className="p-6 bg-primary border-4 border-black rounded-none flex items-center justify-between animate-in zoom-in-95 shadow-[6px_6px_0px_rgba(255,255,255,0.1)]">
                                            <div>
                                                <p className="text-xs font-black text-black uppercase tracking-tight">ACTIVE: {appliedCouponCode}</p>
                                                <p className="text-[10px] text-black/60 font-black uppercase tracking-widest mt-1">₹{discount} DISCOUNT APPLIED</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDiscount(0);
                                                    setCouponCode('');
                                                    setAppliedCouponCode('');
                                                    setAppliedCouponInfo(null);
                                                }}
                                                className="text-[10px] font-black text-red-600 hover:text-black transition-colors uppercase py-2 px-4 border-2 border-black/20 hover:border-black"
                                            >
                                                REMOVE
                                            </button>
                                        </div>
                                    )}

                                    {availableCoupons.length > 0 && !appliedCouponInfo && (
                                        <div className="pt-2">
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Available Offers</label>
                                            <div className="relative">
                                                <select
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    className="w-full h-12 pl-5 pr-12 bg-zinc-900 border-4 border-white/10 rounded-none text-xs font-black text-white focus:border-primary appearance-none cursor-pointer outline-none uppercase tracking-widest"
                                                >
                                                    <option value="">-- SELECT COUPON --</option>
                                                    {availableCoupons.map((coupon) => (
                                                        <option key={coupon.code} value={coupon.code}>
                                                            {coupon.code} (-{coupon.discount_type === 'percentage' ? `${Math.round(coupon.discount_value)}%` : `₹${Math.round(coupon.discount_value)}`})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="w-full h-24 bg-primary text-black border-4 border-black text-2xl font-black uppercase tracking-[0.2em] shadow-[12px_12px_0px_rgba(255,255,255,0.15)] hover:bg-white hover:scale-[1.02] active:translate-y-1 transition-all disabled:opacity-20 flex flex-col items-center justify-center leading-none gap-3 italic relative z-20"
                                    onClick={handleConfirm}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <div className="w-10 h-10 border-6 border-black border-t-transparent animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Confirm & Pay <FaArrowRight className="inline ml-2" /></span>
                                            <span className="text-[11px] tracking-[0.5em] opacity-50 not-italic">Secure Transaction</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-white border-4 border-black border-dashed p-10 sm:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-all group-hover:scale-150" />
                                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.4em] mb-8 relative z-10">Booking Rules</h4>
                                <ul className="space-y-6 relative z-10">
                                    <li className="flex gap-5 text-xs font-black text-black uppercase tracking-tight leading-relaxed italic">
                                        <div className="w-3 h-3 bg-primary border-2 border-black mt-1 shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]"></div>
                                        <span>Cancellations must be filed 24 hours prior to booking start.</span>
                                    </li>
                                    <li className="flex gap-5 text-xs font-black text-black uppercase tracking-tight leading-relaxed italic">
                                        <div className="w-3 h-3 bg-primary border-2 border-black mt-1 shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]"></div>
                                        <span>Bring valid identification for entry to the venue.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
