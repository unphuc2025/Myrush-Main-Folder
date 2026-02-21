import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/bookings';
import { venuesApi } from '../api/venues';
import { couponsApi, type AvailableCoupon } from '../api/coupons';

import { Button } from '../components/ui/Button';
import { TopNav } from '../components/TopNav';
import { FaMapMarkerAlt, FaTicketAlt, FaClock, FaChevronLeft } from 'react-icons/fa';

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
    const [numPlayers, setNumPlayers] = useState(state?.numPlayers || 1);
    const [teamName, setTeamName] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(true);
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
            setLoadingCoupons(true);
            const res = await couponsApi.getAvailableCoupons();
            if (res.success) {
                setAvailableCoupons(res.data);
            }
            setLoadingCoupons(false);
        };

        loadVenue();
        loadCoupons();
    }, [state, state.venueId, navigate]);

    if (!state || (!venue && !state.venueName)) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;

    // Calculations
    const baseSlotsPrice = state.selectedSlots.reduce((acc, s) => acc + s.price, 0);
    const slotsCost = baseSlotsPrice * numPlayers;
    const platformFee = 0;
    const tax = 0;
    const totalAmount = slotsCost + platformFee + tax - discount;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        try {
            const res = await couponsApi.validateCoupon(couponCode, slotsCost);
            if (res.success && res.data.valid) {
                setDiscount(res.data.discount_amount || 0);
                setAppliedCouponInfo(res.data);
                alert(`Coupon Applied: ₹${res.data.discount_amount} Off`);
            } else {
                setDiscount(0);
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
            const durationMinutes = sortedSlots.length * 60;

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
                image: `${window.location.origin}/Rush-logo.webp`,
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
                            couponCode: couponCode,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        };

                        const res = await bookingsApi.createBooking(payload);

                        if (res.success) {
                            alert('Booking Confirmed!');
                            navigate('/bookings');
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
        <div className="min-h-screen bg-gray-50 font-inter text-gray-900 pb-20">
            <TopNav />

            <div className="pt-10 max-w-7xl mx-auto px-4 md:px-8">
                <header className="mb-8 text-center lg:text-left">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-3 text-xs font-bold text-gray-400 hover:text-primary transition-all uppercase tracking-widest mb-8 mx-auto lg:mx-0"
                    >
                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all shadow-sm group-active:scale-95">
                            <FaChevronLeft className="text-[10px] group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        Revise Selection
                    </button>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight leading-none">
                        Final <span className="text-primary italic">Summary</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-2">Re-verify your booking details below</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* LEFT COLUMN: Verification Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Main Spotlight Card */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="flex flex-col md:grid md:grid-cols-5 h-full">
                                <div className="relative aspect-[16/9] md:aspect-auto bg-gray-100 md:col-span-2">
                                    <img
                                        src={state.venueImage || venue?.photos?.[0] || 'https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070'}
                                        alt={state.venueName || venue?.court_name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 left-4 bg-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                                        {state.selectedSport}
                                    </div>
                                </div>
                                <div className="p-5 sm:p-8 flex flex-col justify-center md:col-span-3">
                                    <div className="mb-6">
                                        <div className="text-[10px] font-medium text-primary uppercase tracking-[0.2em] mb-1">SELECTED ARENA</div>
                                        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight leading-loose">{state.venueName || venue?.court_name}</h2>
                                        <p className="flex items-start gap-2 text-gray-500 font-medium text-xs mt-1">
                                            <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0" /> {venue?.location || state.venueName}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">SPORT</div>
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                {state.selectedSport}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">COURT</div>
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                {state.selectedSlots[0]?.court_name || 'Standard Arena'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">DATE</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {new Date(state.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slot and Player Verification */}
                        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-gray-100 pb-8">
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-tight">Booking Details</h3>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Timeslots & Personnel</p>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-2 pr-2 border-r border-gray-200">Players</span>
                                    <button onClick={() => setNumPlayers(Math.max(1, numPlayers - 1))} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors">-</button>
                                    <span className="font-bold w-6 text-center text-sm">{numPlayers}</span>
                                    <button onClick={() => setNumPlayers(numPlayers + 1)} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors">+</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {state.selectedSlots.map((slot, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                                                    <FaClock className="text-primary text-xs" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700">{slot.display_time}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">₹{slot.price}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-4">
                                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Team Name <span className="text-gray-300">(Optional)</span></label>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 font-semibold focus:border-primary/50 transition-colors text-gray-900 placeholder:font-medium placeholder:text-gray-300 text-sm"
                                        placeholder="e.g. THUNDER STRIKERS"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Financial Summary */}
                    <div className="lg:col-span-1">
                        <div className="static lg:sticky lg:top-28 space-y-6">
                            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400"></div>
                                <h3 className="text-lg font-semibold uppercase mb-8 flex items-center gap-2 text-gray-800">
                                    Reservation Summary <span className="text-xs font-medium text-gray-400">({state.selectedSlots.length} Slots)</span>
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-gray-400">
                                        <span>Total Base Price</span>
                                        <span className="text-gray-900">₹{baseSlotsPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-gray-400">
                                        <span>Personnel Multiplier</span>
                                        <span className="text-gray-900">x {numPlayers}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-gray-400">
                                        <span>Convenience Fee</span>
                                        <span className="text-gray-900">₹{platformFee}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-green-500">
                                            <span>Promotion Applied</span>
                                            <span>-₹{discount}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 mb-8 pt-8 flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] block mb-1">TOTAL PAYABLE</span>
                                        <span className="text-4xl font-bold text-gray-900 tracking-tighter">₹{totalAmount}</span>
                                    </div>
                                </div>

                                {/* Dynamic Coupon UI */}
                                <div className="mb-8">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <FaTicketAlt className="absolute top-3.5 left-3.5 text-gray-400 text-xs" />
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="w-full h-11 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase placeholder:normal-case placeholder:font-semibold focus:border-primary/50 text-gray-900"
                                                placeholder="ENTER COUPON"
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="px-6 h-11 bg-black text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-black/10"
                                        >
                                            {discount > 0 ? 'REPLACE' : 'APPLY'}
                                        </button>
                                    </div>

                                    {appliedCouponInfo && (
                                        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-primary uppercase tracking-tight">ACTIVE: {couponCode}</p>
                                                <p className="text-[10px] text-primary/60 font-semibold uppercase">₹{discount} SAVED ON THIS BOOKING</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDiscount(0);
                                                    setCouponCode('');
                                                    setAppliedCouponInfo(null);
                                                }}
                                                className="text-[10px] font-bold text-primary hover:text-red-500 transition-colors uppercase"
                                            >
                                                REMOVE
                                            </button>
                                        </div>
                                    )}
                                    {/* Available Coupons List - REDESIGNED */}
                                    {availableCoupons.length > 0 && (
                                        <div className="mt-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Offers</p>
                                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Best Deals for You</span>
                                            </div>
                                            <div className="space-y-3">
                                                {availableCoupons.map((coupon) => {
                                                    const isApplied = appliedCouponInfo?.code === coupon.code;
                                                    return (
                                                        <div
                                                            key={coupon.code}
                                                            onClick={() => {
                                                                if (!isApplied) {
                                                                    setCouponCode(coupon.code);
                                                                    setTimeout(() => handleApplyCoupon(), 100);
                                                                }
                                                            }}
                                                            className={`group relative overflow-hidden bg-white border rounded-2xl p-4 transition-all cursor-pointer hover:shadow-md ${isApplied
                                                                ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]'
                                                                : 'border-gray-100'}`}
                                                        >
                                                            {/* Voucher cut-out effect logic (visual only) */}
                                                            <div className="flex items-start gap-4">
                                                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors ${isApplied ? 'bg-primary text-white' : 'bg-gray-50 text-gray-900 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                                                    <span className="text-sm font-black leading-none">
                                                                        {coupon.discount_type === 'percentage' ? `${Math.round(coupon.discount_value)}%` : `₹${Math.round(coupon.discount_value)}`}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">OFF</span>
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`text-sm font-black uppercase tracking-tight ${isApplied ? 'text-primary' : 'text-gray-900 group-hover:text-primary'}`}>
                                                                            {coupon.code}
                                                                        </span>
                                                                        {isApplied && (
                                                                            <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase">Applied</span>
                                                                        )}
                                                                    </div>
                                                                    {coupon.description && (
                                                                        <p className="text-[10px] text-gray-500 font-medium leading-tight mb-2 line-clamp-2">{coupon.description}</p>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                                        {coupon.min_order_value && (
                                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Min Order: ₹{coupon.min_order_value}</span>
                                                                        )}
                                                                        {coupon.terms_condition && (
                                                                            <span className="text-[9px] font-bold text-primary/40 uppercase hover:text-primary transition-colors">* Terms apply</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Subtle dot line separator for voucher look */}
                                                            {!isApplied && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                                                        Apply →
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {loadingCoupons && (
                                        <div className="mt-8 flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Finding the best offers...</p>
                                        </div>
                                    )}

                                    {!loadingCoupons && availableCoupons.length === 0 && (
                                        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                            <FaTicketAlt className="mx-auto text-gray-200 text-2xl mb-2 opacity-50" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active coupons available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full h-16 text-lg font-bold uppercase tracking-widest shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:-translate-y-1 rounded-xl"
                                onClick={handleConfirm}
                                disabled={submitting}
                            >
                                {submitting ? 'GENERATING ORDER...' : `CONFIRM & PAY ₹${totalAmount}`}
                            </Button>

                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Secure TLS 1.3 Encryption</p>
                            </div>
                        </div>

                        <div className="text-center px-4">
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                By proceeding, you agree to our <span className="text-gray-900 font-bold border-b border-gray-300">Terms of Service</span> and <span className="text-gray-900 font-bold border-b border-gray-300">Cancellation Policy</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
