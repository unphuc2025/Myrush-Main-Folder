import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/bookings';
import { venuesApi } from '../api/venues';
import { couponsApi, type AvailableCoupon } from '../api/coupons';
import { useNotification } from '../context/NotificationContext';

import { Button } from '../components/ui/Button';
import { TopNav } from '../components/TopNav';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaTicketAlt, FaClock, FaChevronLeft, FaExclamationTriangle } from 'react-icons/fa';

interface Slot {
    time: string;
    display_time: string;
    price: number;
    court_id?: string;
    court_name?: string;
    slot_id?: string;
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
    isCapacityBased?: boolean;
    courtId?: string;
    sliceMask?: number;
    selectedConfigs?: {
        courtId: string;
        label: string;
        sliceId: string;
        sliceMask: number;
    }[];
    teamName?: string;
}

export const BookingSummary: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;
    const { showAlert } = useNotification();

    const [venue, setVenue] = useState<any>(null);
    const [numPlayers] = useState(state?.numPlayers || 1);
    const [teamName, setTeamName] = useState(state?.teamName || '');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCouponCode, setAppliedCouponCode] = useState(''); // locked-in code after validation
    const [submitting, setSubmitting] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(true);
    const [appliedCouponInfo, setAppliedCouponInfo] = useState<any>(null);
    const [gstPercent, setGstPercent] = useState(0);
    const [cancellationPolicy, setCancellationPolicy] = useState<any>(null);

    // Reservation & Timer State
    const [orderResData, setOrderResData] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<string>("10:00");
    const [isExpired, setIsExpired] = useState(false);
    const reservationInitiated = React.useRef(false);
    const localHoldStartTime = React.useRef(Date.now());
    const [isReleasing, setIsReleasing] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Navigation Interceptor
    useEffect(() => {
        if (isExpired || !orderResData || submitting || isReleasing) return;

        // 1. Browser Back Button Interceptor
        const handlePopState = (e: PopStateEvent) => {
            // Re-push state to keep user on same URL
            window.history.pushState(null, '', window.location.href);
            setShowCancelModal(true);
        };

        // 2. Tab Close/Refresh Interceptor
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Required for Chrome
        };

        // Initialize blocking state
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isExpired, orderResData, submitting, isReleasing]);

    const handleBackClick = () => {
        if (!isExpired && orderResData && !submitting) {
            setShowCancelModal(true);
        } else {
            navigate(-1);
        }
    };

    const handleReleaseHold = async () => {
        if (!orderResData?.id) {
            navigate(`/venues/${state?.venueId || ''}`, { replace: true });
            return;
        }

        setIsReleasing(true);
        try {
            await bookingsApi.releaseHold(orderResData.id);
            setShowCancelModal(false);
            // Use window.history.go(-2) to jump past the dummy state and back to VenueDetails
            window.history.go(-2);
        } catch (error) {
            console.error("Failed to release hold:", error);
            setShowCancelModal(false);
            window.history.go(-2); 
        } finally {
            setIsReleasing(false);
        }
    };

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

        const loadPolicies = async () => {
            const res = await venuesApi.getPublicPolicies(); // Fetch all
            if (res.success && res.data && res.data.length > 0) {
                const activeGst = res.data.find((p: any) => p.type === 'gst' && p.is_active);
                if (activeGst) {
                    setGstPercent(parseFloat(activeGst.value));
                }

                const activeCancellation = res.data.find((p: any) => p.type === 'cancellation' && p.is_active);
                if (activeCancellation) {
                    setCancellationPolicy(activeCancellation);
                }
            }
        };

        loadVenue();
        loadCoupons();
        loadPolicies();
    }, [state, state?.venueId, navigate]);

    // PRE-RESERVE SLOTS (10-minute hold starts now)
    useEffect(() => {
        if (state && !reservationInitiated.current) {
            reservationInitiated.current = true;
            initiateProactiveReservation();
        }
    }, [state]);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            let expiry: number;

            if (orderResData?.hold_expiry_at) {
                expiry = new Date(orderResData.hold_expiry_at).getTime();
            } else {
                // Fallback to local 10-minute timer while server is processing
                expiry = localHoldStartTime.current + (10 * 60 * 1000);
            }

            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft("00:00");
                setIsExpired(true);
                clearInterval(timer);
            } else {
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [orderResData]);

    const initiateProactiveReservation = async () => {
        try {
            const sortedSlots = [...state.selectedSlots].sort((a, b) => a.time.localeCompare(b.time));
            const startTime = sortedSlots[0].time;
            const durationMinutes = sortedSlots.length * 30;
            const configs = state.selectedConfigs && state.selectedConfigs.length > 0
                ? state.selectedConfigs
                : [{ courtId: state.courtId || state.selectedSlots[0]?.court_id || state.venueId, label: state.venueName || 'Standard Arena', sliceId: 'full', sliceMask: state.sliceMask || 0 }];

            const rawSlotIds = state.selectedSlots.map(s => s.slot_id).filter(Boolean) as string[];
            const slotIds = Array.from(new Set(rawSlotIds));

            let res;
            if (configs.length > 1) {
                res = await bookingsApi.createMultiCourtOrder({
                    configs: configs.map(c => ({ courtId: c.courtId, sliceMask: c.sliceMask, branchId: state.venueId })),
                    bookingDate: state.date,
                    timeSlots: sortedSlots,
                    slotIds: slotIds,
                    numberOfPlayers: numPlayers,
                    couponCode: couponCode || undefined,
                    teamName: teamName || undefined,
                    // Essential for Razorpay order creation
                    originalAmount: slotsCost,
                    totalAmount: totalAmount
                });
            } else {
                res = await bookingsApi.createPaymentOrder({
                    courtId: configs[0].courtId,
                    bookingDate: state.date,
                    startTime: startTime,
                    durationMinutes: durationMinutes,
                    timeSlots: sortedSlots,
                    slotIds: slotIds,
                    sliceMask: configs[0].sliceMask,
                    numberOfPlayers: numPlayers,
                    couponCode: couponCode || undefined,
                    teamName: teamName || undefined,
                    // Essential for Razorpay order creation
                    originalAmount: slotsCost,
                    totalAmount: totalAmount
                });
            }

            if (res.success) {
                setOrderResData(res.data);
            }
        } catch (err) {
            console.error("Proactive Reservation Failed:", err);
        }
    };

    if (!state || (!venue && !state.venueName)) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;

    // Slot prices forwarded from VenueDetails are already the *total* per-slot cost:
    //   • Capacity venues  : basePrice * numPlayers (e.g. ₹100 * 3 = ₹300 per slot)
    //   • Court/zone venues: final court price (not player-multiplied)
    // So we sum them directly — no additional numPlayers multiplication.
    const slotsCost = state.selectedSlots.reduce((acc, s) => acc + s.price, 0);
    // For the booking receipt sub-line, derive the per-person base (capacity only)
    const baseSlotsPrice = state.isCapacityBased && numPlayers > 1
        ? Math.round(slotsCost / numPlayers)
        : slotsCost;
    const platformFee = 0;
    const subtotal = slotsCost - discount;
    const tax = (subtotal * gstPercent) / 100;
    const totalAmount = subtotal + platformFee + tax;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        try {
            const res = await couponsApi.validateCoupon(couponCode, slotsCost);
            if (res.success && res.data.valid) {
                setDiscount(res.data.discount_amount || 0);
                setAppliedCouponCode(couponCode.trim().toUpperCase()); // lock in the code
                setAppliedCouponInfo(res.data);
                showAlert(`Coupon Applied: ₹${res.data.discount_amount} Off`, 'success');
                
                // Clear existing reservation to force a new one with the coupon
                setOrderResData(null);
                reservationInitiated.current = false;
                initiateProactiveReservation();
            } else {
                setDiscount(0);
                setAppliedCouponCode('');
                setAppliedCouponInfo(null);
                showAlert(res.data.message || 'Invalid Coupon Code', 'error');
            }
        } catch (error) {
            showAlert('Failed to validate coupon', 'error');
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
                showAlert('Razorpay SDK failed to load. Are you online?', 'error');
                setSubmitting(false);
                return;
            }

            const configs = state.selectedConfigs && state.selectedConfigs.length > 0
                ? state.selectedConfigs
                : [{ courtId: state.courtId || state.selectedSlots[0]?.court_id || state.venueId, label: state.venueName || 'Standard Arena', sliceId: 'full', sliceMask: state.sliceMask || 0 }];
            const numCourts = configs.length;

            const sortedSlots = [...state.selectedSlots].sort((a, b) => a.time.localeCompare(b.time));
            const startTime = sortedSlots[0].time;
            const durationMinutes = sortedSlots.length * 30;

            const rawSlotIds = state.selectedSlots.map(s => s.slot_id).filter(Boolean) as string[];
            const slotIds = Array.from(new Set(rawSlotIds));

            if (durationMinutes < 60) {
                showAlert('Minimum booking duration is 1 hour (2 slots).', 'warning');
                setSubmitting(false);
                return;
            }

            // --- Use existing order or create new if missing ---
            let orderRes = orderResData;
            let finalOrderData = orderResData;
            
            // If order data is missing or coupon changed, we might need a fresh order
            if (!orderRes || (appliedCouponCode && orderRes.coupon_code !== appliedCouponCode)) {
                let response;
                if (numCourts > 1) {
                    response = await bookingsApi.createMultiCourtOrder({
                        configs: configs.map(c => ({ courtId: c.courtId, sliceMask: c.sliceMask, branchId: state.venueId })),
                        bookingDate: state.date,
                        timeSlots: sortedSlots,
                        slotIds: slotIds,
                        numberOfPlayers: numPlayers,
                        couponCode: appliedCouponCode || undefined,
                        teamName: teamName || undefined
                    });
                } else {
                    response = await bookingsApi.createPaymentOrder({
                        courtId: configs[0].courtId,
                        bookingDate: state.date,
                        startTime: startTime,
                        durationMinutes: durationMinutes,
                        timeSlots: sortedSlots,
                        slotIds: slotIds,
                        sliceMask: configs[0].sliceMask,
                        numberOfPlayers: numPlayers,
                        couponCode: appliedCouponCode || undefined,
                        originalAmount: slotsCost,
                        totalAmount: totalAmount,
                        teamName: teamName || undefined
                    });
                }
                
                if (!response.success || !response.data) {
                    showAlert((response as any).error || 'Could not initiate payment. Please try again.', 'error');
                    setSubmitting(false);
                    return;
                }
                finalOrderData = response.data;
            }

            if (!finalOrderData) {
                showAlert('Could not initiate payment. Please try again.', 'error');
                setSubmitting(false);
                return;
            }

            const { id: order_id, amount, currency, key_id, server_calculated_amount } = finalOrderData;
            
            // Server's authoritative price calculation should override frontend's naive slot sum
            const authoritativeTotal = server_calculated_amount || (amount / 100);
            const authoritativeDiscount = discount;
            const authoritativeOriginal = authoritativeTotal + authoritativeDiscount - platformFee;

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
                        const results = [];
                        const serverBreakdown = finalOrderData?.breakdown;

                        if (numCourts > 1 && Array.isArray(serverBreakdown)) {
                            // --- MULTI-COURT FLOW ---
                            // Use the server-provided breakdown to accurately match 'Pending' records
                            for (const item of serverBreakdown) {
                                const rawSlotIds = state.selectedSlots.map(s => s.slot_id).filter(Boolean) as string[];
                                const slotIds = Array.from(new Set(rawSlotIds));
                                
                                const payload = {
                                    courtId: item.courtId,
                                    bookingDate: state.date,
                                    startTime: item.time_slots?.[0]?.time || startTime,
                                    durationMinutes: (item.time_slots?.length || 0) * 30 || durationMinutes,
                                    numberOfPlayers: numPlayers,
                                    timeSlots: item.time_slots,
                                    slotIds: slotIds,
                                    sliceMask: item.sliceMask,
                                    courtName: state.selectedConfigs?.find(c => c.courtId === item.courtId && c.sliceMask === item.sliceMask)?.label || item.courtName || undefined,
                                    
                                    // Send exactly what the server calculated for this specific court
                                    totalAmount: item.total_amount, 
                                    originalAmount: item.total_amount,
                                    discountAmount: 0,
                                    
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    numCourts: 1, // Treated as an individual update on the backend
                                    teamName: teamName || undefined
                                };
                                const res = await bookingsApi.createBooking(payload as any);
                                results.push(res);
                            }
                        } else {
                            // --- SINGLE COURT FLOW ---
                            const payload = {
                                courtId: configs[0].courtId,
                                bookingDate: state.date,
                                startTime: startTime,
                                durationMinutes: durationMinutes,
                                numberOfPlayers: numPlayers,
                                timeSlots: sortedSlots,
                                slotIds: slotIds,
                                sliceMask: configs[0].sliceMask,
                                courtName: configs[0].label,
                                
                                totalAmount: authoritativeTotal,
                                originalAmount: authoritativeOriginal,
                                discountAmount: authoritativeDiscount,
                                couponCode: appliedCouponCode || undefined,
                                
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                numCourts: 1,
                                teamName: teamName || undefined
                            };
                            const res = await bookingsApi.createBooking(payload as any);
                            results.push(res);
                        }

                        const allOk = results.every(r => r.success);
                        if (allOk) {
                            showAlert('Booking Confirmed! 🎉', 'success');
                            navigate('/bookings', { state: { bookingSuccess: true } });
                        } else {
                            const failedIdx = results.findIndex(r => !r.success);
                            const errDetail = results[failedIdx]?.data?.detail || (results[failedIdx] as any)?.error || '';
                            showAlert('Payment successful but booking creation failed. ' + errDetail, 'error');
                        }
                    } catch (err: any) {
                        showAlert('Error confirming booking: ' + err.message, 'error');
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
            showAlert('An error occurred during transaction', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            <TopNav />

            <div className="pt-20 md:pt-26 max-w-screen-2xl mx-auto px-4 md:px-8">
                {/* Floating Top-Right Timer */}
                <div className={`fixed top-24 right-4 md:right-8 z-[100] transition-all duration-500 transform ${timeLeft ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
                    <div className={`backdrop-blur-xl border-2 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 ${
                        isExpired 
                            ? 'bg-red-50/90 border-red-200 text-red-600 animate-bounce' 
                            : 'bg-white/90 border-primary/20 text-gray-900'
                    }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-primary/10'}`}>
                            <FaClock className={`text-lg ${isExpired ? 'text-red-500' : 'text-primary'}`} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                                {isExpired ? 'RESERVATION' : orderResData ? 'HOLD ACTIVE' : 'SECURING SLOT'}
                            </div>
                            <div className={`text-xl font-black tracking-tighter tabular-nums leading-none ${!orderResData && !isExpired ? 'animate-pulse' : ''}`}>
                                {isExpired ? 'EXPIRED' : timeLeft}
                            </div>
                        </div>
                        {!isExpired && (
                            <div className="flex flex-col gap-1 ml-2">
                                <div className="w-1 h-1 rounded-full bg-primary animate-ping"></div>
                                <div className="w-1 h-1 rounded-full bg-primary animate-ping [animation-delay:300ms]"></div>
                            </div>
                        )}
                    </div>
                </div>

                <header className="mb-4 text-left">
                    <button
                        onClick={handleBackClick}
                        className="group flex items-center mb-2"
                        title="Back"
                    >
                        <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all shadow-sm group-active:scale-95 text-gray-400 group-hover:text-primary">
                            <FaChevronLeft className="text-[12px] group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                    </button>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading uppercase tracking-tight leading-none">
                        Final <span className="text-primary italic">Summary</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-2">Re-verify your booking details below</p>
                </header>

                {/* Cancel Confirmation Modal */}
                <AnimatePresence>
                    {showCancelModal && (
                        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowCancelModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-yellow-500/20 overflow-hidden"
                            >
                                <div className="flex flex-col items-center text-center relative z-10">
                                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                        <FaExclamationTriangle className="text-yellow-500 text-4xl" />
                                    </div>
                                    
                                    <div className="mb-2">
                                        <span className="text-[10px] font-black tracking-[0.2em] text-yellow-600 uppercase bg-yellow-100 px-3 py-1 rounded-full">
                                            Hold expires in: {timeLeft}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-black text-black mb-4 uppercase tracking-tight">
                                        Wait!
                                    </h3>
                                    
                                    <p className="text-gray-600 text-lg leading-relaxed font-medium mb-8">
                                        Leaving now will release your <span className="text-black font-bold">10-minute slot hold</span>. Other players can book this immediately.
                                    </p>
                                    
                                    <div className="flex gap-4 w-full">
                                        <button
                                            onClick={handleReleaseHold}
                                            disabled={isReleasing}
                                            className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 text-black font-bold hover:bg-gray-200 transition-all uppercase tracking-wider text-sm disabled:opacity-50"
                                        >
                                            {isReleasing ? 'Releasing...' : 'Yes, Cancel'}
                                        </button>
                                        <button
                                            onClick={() => setShowCancelModal(false)}
                                            disabled={isReleasing}
                                            className="flex-1 py-4 px-6 rounded-2xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all uppercase tracking-wider text-sm disabled:opacity-50"
                                        >
                                            Keep Hold
                                        </button>
                                    </div>
                                </div>

                                {/* Decorative element matching CustomNotification */}
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* LEFT COLUMN: Verification Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Main Spotlight Card */}
                        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-xl">
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
                                        <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">SELECTED ARENA</div>
                                        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight leading-tight">{state.venueName || venue?.court_name}</h2>
                                        <p className="flex items-start gap-2 text-gray-500 font-medium text-xs mt-1">
                                            <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0" /> {venue?.location || state.venueName}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SPORT</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {state.selectedSport}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">COURT{state.selectedConfigs && state.selectedConfigs.length > 1 ? 'S' : ''}</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {state.selectedConfigs && state.selectedConfigs.length > 0
                                                    ? (() => {
                                                        const courtNames = state.selectedConfigs.map(c => c.label);
                                                        return Array.from(new Set(courtNames)).join(', ');
                                                    })()
                                                    : state.selectedSlots[0]?.court_name || 'Standard Arena'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DATE</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {new Date(state.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slot and Player Verification */}
                        <div className="bg-white rounded-xl p-5 sm:p-8 shadow-sm border border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-gray-100 pb-8">
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-tight">Booking Details</h3>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Timeslots</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Deduplicate slots by display_time for multi-court view */}
                                    {Array.from(new Map(state.selectedSlots.map(slot => [slot.display_time, slot])).values()).map((slot, idx) => (
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
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Team Name <span className="text-gray-300 font-medium">(Optional)</span></label>
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
                            <div className="bg-white rounded-xl p-5 sm:p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400"></div>
                                <h3 className="text-xl font-bold font-heading uppercase mb-2 flex items-center gap-2 text-gray-800 tracking-tight">
                                    Reservation Summary <span className="text-[10px] font-bold text-gray-400">({state.selectedSlots.length} Slots)</span>
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-gray-400">
                                        <span>Total Base Price</span>
                                        <div className="text-right">
                                            <span className="text-gray-900 block">₹{slotsCost}</span>
                                            {numPlayers > 1 && (
                                                <span className="text-[10px] text-primary lowercase font-bold">(₹{baseSlotsPrice} x {numPlayers} members)</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-gray-400">
                                        <span>Convenience Fee</span>
                                        <span className="text-gray-900">₹{platformFee}</span>
                                    </div>
                                    {gstPercent > 0 && (
                                        <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-gray-400">
                                            <span>GST ({gstPercent}%)</span>
                                            <span className="text-gray-900">₹{tax.toFixed(2)}</span>
                                        </div>
                                    )}
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
                                            {discount > 0 ? <span>REPLACE</span> : <span>APPLY</span>}
                                        </button>
                                    </div>

                                    {appliedCouponInfo && (
                                        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-primary uppercase tracking-tight">ACTIVE: {appliedCouponCode}</p>
                                                <p className="text-[10px] text-primary/60 font-semibold uppercase">₹{discount} SAVED ON THIS BOOKING</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDiscount(0);
                                                    setCouponCode('');
                                                    setAppliedCouponCode('');
                                                    setAppliedCouponInfo(null);
                                                }}
                                                className="text-[10px] font-bold text-primary hover:text-red-500 transition-colors uppercase"
                                            >
                                                REMOVE
                                            </button>
                                        </div>
                                    )}
                                    {/* Simple Dropdown List */}
                                    {availableCoupons.length > 0 && (
                                        <div className="mt-4">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select an Offer</label>
                                            <div className="relative">
                                                <select
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCouponCode(val);
                                                    }}
                                                    className="w-full h-11 pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:border-primary/50 appearance-none cursor-pointer outline-none shadow-sm"
                                                >
                                                    <option value="">-- Choose a Coupon --</option>
                                                    {availableCoupons.map((coupon) => (
                                                        <option key={coupon.code} value={coupon.code}>
                                                            {coupon.code} - {coupon.discount_type === 'percentage' ? `${Math.round(coupon.discount_value)}% OFF` : `₹${Math.round(coupon.discount_value)} OFF`}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {loadingCoupons && (
                                        <div className="mt-8 flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Finding the best offers...</p>
                                        </div>
                                    )}

                                    {!loadingCoupons && availableCoupons.length === 0 && (
                                        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                            <FaTicketAlt className="mx-auto text-gray-200 text-2xl mb-2 opacity-50" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active coupons available</p>
                                        </div>
                                    )}
                                </div>
                                {/* Cancellation Policy Display */}
                                {cancellationPolicy && (
                                    <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-3 bg-primary rounded-full"></div>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cancellation Policy</span>
                                        </div>
                                        <p className="text-[10px] text-white font-bold leading-relaxed">
                                            {cancellationPolicy.name} {cancellationPolicy.value ? `(${cancellationPolicy.value}% fee)` : ''}
                                        </p>
                                        {cancellationPolicy.content && (
                                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-1 italic">
                                                {cancellationPolicy.content}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="primary"
                                className={`w-full h-16 text-lg font-bold uppercase tracking-widest shadow-2xl transition-all rounded-xl ${isExpired ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1'}`}
                                onClick={handleConfirm}
                                disabled={submitting || isExpired}
                            >
                                {submitting ? <span>GENERATING ORDER...</span> : isExpired ? <span>HOLD EXPIRED</span> : <span>CONFIRM &amp; PAY ₹{totalAmount}</span>}
                            </Button>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
