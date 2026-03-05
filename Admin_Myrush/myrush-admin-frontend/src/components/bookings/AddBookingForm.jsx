import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, User, CreditCard, Check, Play, MapPin, IndianRupee, ChevronDown, Tag } from 'lucide-react';
import { courtsApi, usersApi, bookingsApi, couponsApi } from '../../services/adminApi';

const TimePicker = ({ value, onChange, className }) => {
    const [hours, minutes] = (value || '09:00').split(':');
    let h = parseInt(hours, 10);
    const m = minutes;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;

    const handleHourChange = (e) => {
        let newH = parseInt(e.target.value, 10);
        if (ampm === 'PM' && newH !== 12) newH += 12;
        if (ampm === 'AM' && newH === 12) newH = 0;
        onChange(`${newH.toString().padStart(2, '0')}:${m}`);
    };

    const handleMinuteChange = (e) => {
        onChange(`${hours}:${e.target.value}`);
    };

    const handleAmpmChange = (e) => {
        const newAmpm = e.target.value;
        let newH = parseInt(hours, 10);
        if (newAmpm === 'PM' && newH < 12) newH += 12;
        if (newAmpm === 'AM' && newH >= 12) newH -= 12;
        onChange(`${newH.toString().padStart(2, '0')}:${m}`);
    };

    return (
        <div className={`flex gap-1 ${className}`}>
            <div className="relative flex-1">
                <select
                    value={h}
                    onChange={handleHourChange}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 text-center font-bold"
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                </select>
            </div>
            <span className="self-center font-bold text-slate-400">:</span>
            <div className="relative flex-1">
                <select
                    value={m}
                    onChange={handleMinuteChange}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 text-center font-bold"
                >
                    {['00', '15', '30', '45'].map(min => (
                        <option key={min} value={min}>{min}</option>
                    ))}
                </select>
            </div>
            <div className="relative flex-1">
                <select
                    value={ampm}
                    onChange={handleAmpmChange}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 text-center font-bold"
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
        </div>
    );
};

export default function AddBookingForm({ onClose, onBookingAdded, booking = null, isFullPage = false, isViewing = false }) {
    const [courts, setCourts] = useState([]);
    const [users, setUsers] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [couponInput, setCouponInput] = useState('');
    const [couponStatus, setCouponStatus] = useState(null); // {valid: bool, message: string}
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditingExisting, setIsEditingExisting] = useState(!!booking);

    const [formData, setFormData] = useState({
        court_id: '',
        user_id: '',
        date: new Date().toISOString().split('T')[0],
        time_slots: [{ start: '09:00', end: '10:00', price: 0 }],
        status: 'pending',
        payment_status: 'pending',
        total_amount: 0,
        discount_amount: 0,
        coupon_code: ''
    });

    useEffect(() => {
        fetchData();
        if (booking) {
            // Robustly map time slots ensuring we have start/end keys
            // Handle potential stringified JSON for time_slots
            let parsedSlots = [];
            if (typeof booking.time_slots === 'string') {
                try { parsedSlots = JSON.parse(booking.time_slots); } catch (e) { parsedSlots = []; }
            } else if (Array.isArray(booking.time_slots)) {
                parsedSlots = booking.time_slots;
            }

            const durationHrs = (booking.total_duration_minutes || booking.duration_minutes || 60) / 60;
            const fallbackPrice = booking.price_per_hour ? booking.price_per_hour : (booking.total_amount ? booking.total_amount / durationHrs : 0);

            const mappedSlots = (parsedSlots && parsedSlots.length > 0)
                ? parsedSlots.map(slot => ({
                    start: (slot.start || slot.start_time || slot.startTime || '').toString().substring(0, 5),
                    end: (slot.end || slot.end_time || slot.endTime || '').toString().substring(0, 5),
                    price: slot.price || slot.price_per_slot || fallbackPrice || 0
                }))
                : [{
                    start: (booking.start_time || '').toString().substring(0, 5),
                    end: (booking.end_time || '').toString().substring(0, 5),
                    price: fallbackPrice
                }];

            setFormData({
                court_id: booking.court_id || booking.court?.id || '',
                user_id: booking.user_id || booking.customer_id || '',
                date: booking.booking_date || booking.date,
                time_slots: mappedSlots,
                status: booking.status || 'pending',
                payment_status: booking.payment_status || 'pending',
                discount_amount: booking.discount_amount || 0,
                coupon_code: booking.coupon_code || '',
                // Keep the server total — it already has the discount baked in
                total_amount: booking.total_amount || 0,
                team_name: (!booking.user_id && booking.customer_name) ? booking.customer_name : (booking.team_name || '')
            });
            setIsEditingExisting(true);
        }
    }, [booking]);

    useEffect(() => {
        // Only auto-recalculate for NEW bookings, not when editing existing
        // (the edit total already comes from backend with discount applied)
        if (!isEditingExisting && formData.time_slots) {
            const rawTotal = formData.time_slots.reduce((sum, slot) => sum + (parseFloat(slot.price) || 0), 0);
            const total = Math.max(0, rawTotal - (parseFloat(formData.discount_amount) || 0));
            if (total !== parseFloat(formData.total_amount)) {
                setFormData(prev => ({ ...prev, total_amount: total }));
            }
        }
    }, [formData.time_slots, formData.discount_amount, isEditingExisting]);

    const fetchData = async () => {
        try {
            // Fetch each independently so a 403 on one doesn't kill the rest
            const [courtsResult, usersResult, couponsResult] = await Promise.allSettled([
                courtsApi.getAll(),
                usersApi.getAll({ limit: 200 }),
                couponsApi.getActiveCoupons()
            ]);

            if (courtsResult.status === 'fulfilled') {
                setCourts(Array.isArray(courtsResult.value) ? courtsResult.value : []);
            }
            if (usersResult.status === 'fulfilled') {
                const u = usersResult.value;
                setUsers(Array.isArray(u?.items) ? u.items : Array.isArray(u) ? u : []);
            }
            if (couponsResult.status === 'fulfilled') {
                setCoupons(Array.isArray(couponsResult.value) ? couponsResult.value : []);
            } else {
                console.error('Coupons fetch failed:', couponsResult.reason);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleSelectCoupon = (couponCode) => {
        if (!couponCode) {
            // Remove coupon
            const rawTotal = formData.time_slots.reduce((sum, slot) => sum + (parseFloat(slot.price) || 0), 0);
            setFormData(prev => ({ ...prev, coupon_code: '', discount_amount: 0, total_amount: rawTotal }));
            setIsEditingExisting(false);
            setCouponStatus(null);
            return;
        }
        const found = coupons.find(c => c.code === couponCode);
        if (!found) return;
        const rawTotal = formData.time_slots.reduce((sum, slot) => sum + (parseFloat(slot.price) || 0), 0);
        let discountAmt = 0;
        if (found.discount_type === 'percentage') {
            discountAmt = (rawTotal * parseFloat(found.discount_value)) / 100;
            if (found.max_discount) discountAmt = Math.min(discountAmt, parseFloat(found.max_discount));
        } else {
            discountAmt = parseFloat(found.discount_value);
        }
        discountAmt = Math.min(discountAmt, rawTotal);
        const newTotal = Math.max(0, rawTotal - discountAmt);
        setFormData(prev => ({ ...prev, coupon_code: found.code, discount_amount: discountAmt, total_amount: newTotal }));
        setCouponStatus({ valid: true, message: `₹${discountAmt.toFixed(2)} discount applied!` });
        setIsEditingExisting(true);
    };

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setCouponStatus(null);
        try {
            const found = await couponsApi.lookupByCode(code);
            if (!found || !found.code) {
                setCouponStatus({ valid: false, message: 'Coupon not found or inactive.' });
                return;
            }
            // Calculate discount
            const rawTotal = formData.time_slots.reduce((sum, slot) => sum + (parseFloat(slot.price) || 0), 0);
            let discountAmt = 0;
            if (found.discount_type === 'percentage') {
                discountAmt = (rawTotal * parseFloat(found.discount_value)) / 100;
                if (found.max_discount) discountAmt = Math.min(discountAmt, parseFloat(found.max_discount));
            } else {
                discountAmt = parseFloat(found.discount_value);
            }
            discountAmt = Math.min(discountAmt, rawTotal);
            const newTotal = Math.max(0, rawTotal - discountAmt);
            setFormData(prev => ({
                ...prev,
                coupon_code: found.code,
                discount_amount: discountAmt,
                total_amount: newTotal
            }));
            setCouponStatus({ valid: true, message: `Coupon applied! You save \u20b9${discountAmt.toFixed(2)}` });
            setIsEditingExisting(true);
        } catch (err) {
            setCouponStatus({ valid: false, message: 'Coupon not found or inactive.' });
        }
    };

    const handleRemoveCoupon = () => {
        const rawTotal = formData.time_slots.reduce((sum, slot) => sum + (parseFloat(slot.price) || 0), 0);
        setFormData(prev => ({ ...prev, coupon_code: '', discount_amount: 0, total_amount: rawTotal }));
        setCouponInput('');
        setCouponStatus(null);
        setIsEditingExisting(false); // Re-enable auto-recalc
    };

    const handleSlotChange = (index, field, value) => {
        const newSlots = [...formData.time_slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setFormData({ ...formData, time_slots: newSlots });
    };

    const addSlot = () => {
        const lastSlot = formData.time_slots[formData.time_slots.length - 1];
        const newStart = lastSlot ? lastSlot.end : '09:00';
        const [h, m] = newStart.split(':');
        let endH = parseInt(h) + 1;
        const end = `${endH.toString().padStart(2, '0')}:${m}`;

        setFormData({
            ...formData,
            time_slots: [...formData.time_slots, { start: newStart, end: end, price: 0 }]
        });
    };

    const removeSlot = (index) => {
        if (formData.time_slots.length === 1) return;
        const newSlots = formData.time_slots.filter((_, i) => i !== index);
        setFormData({ ...formData, time_slots: newSlots });
    };

    const handleCourtChange = (e) => {
        const newCourtId = e.target.value;
        const selectedCourt = courts.find(c => c.id === newCourtId);

        let newPrice = 0;
        if (selectedCourt) {
            newPrice = parseFloat(selectedCourt.price_per_hour) || 0;
        }

        // Update slots with new price if they are 0 or untouched
        const updatedSlots = formData.time_slots.map(slot => ({
            ...slot,
            price: slot.price == 0 ? newPrice : slot.price
        }));

        setFormData({
            ...formData,
            court_id: newCourtId,
            time_slots: updatedSlots
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.court_id || !formData.user_id) {
            alert('Please select a court and a user');
            return;
        }

        setIsSubmitting(true);
        try {
            const firstSlot = formData.time_slots[0];
            const lastSlot = formData.time_slots[formData.time_slots.length - 1];

            const cleanSlots = formData.time_slots.map(slot => ({
                start: slot.start,
                end: slot.end,
                price: parseFloat(slot.price) || 0
            }));

            const payload = {
                court_id: formData.court_id,
                user_id: formData.user_id,
                booking_date: formData.date,
                start_time: firstSlot.start,
                end_time: lastSlot.end,
                duration_minutes: formData.time_slots.length * 60,
                original_amount: formData.time_slots.reduce((sum, slot) => sum + (parseFloat(slot.price) || 0), 0),
                discount_amount: formData.discount_amount || 0,
                coupon_code: formData.coupon_code || null,
                total_amount: formData.total_amount,
                status: formData.status,
                payment_status: formData.payment_status,
                time_slots: cleanSlots,
                price_per_hour: cleanSlots.length > 0 ? cleanSlots[0].price : 0,
                team_name: formData.team_name
            };

            if (booking) {
                await bookingsApi.update(booking.id, payload);
            } else {
                await bookingsApi.create(payload);
            }
            onBookingAdded();
            if (!isFullPage) onClose();
        } catch (error) {
            console.error('Failed to save booking:', error);
            alert(`Error saving booking: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto px-1 py-1 space-y-5">

                {/* User & Court Selection */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Customer</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <select
                                value={formData.user_id}
                                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                disabled={isViewing}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                                required
                            >
                                <option value="">Select Customer</option>
                                {Array.isArray(users) && users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || (user.profile && user.profile.full_name) || user.first_name || user.phone_number || 'Unknown User'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Customer Name / Team Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                value={formData.team_name || ''}
                                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                                disabled={isViewing}
                                placeholder="Enter name if specific user name is missing"
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium text-lg shadow-sm hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Court</label>
                        <div className="relative group">
                            <Play className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <select
                                value={formData.court_id}
                                onChange={handleCourtChange}
                                disabled={isViewing}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                                required
                            >
                                <option value="">Select Court</option>
                                {courts.map(court => (
                                    <option key={court.id} value={court.id}>{court.name} ({court.branch?.city?.short_code})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Date & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Date</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                disabled={isViewing}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:ring-0 outline-none transition-all font-medium text-lg shadow-sm hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Booking Status</label>
                        <div className="relative group">
                            <Check className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                disabled={isViewing}
                                className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300 text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                            <div className="absolute right-4 top-4 pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Payment Status</label>
                    <div className="relative group">
                        <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                        <select
                            value={formData.payment_status}
                            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                            disabled={isViewing}
                            className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                        >
                            <option value="pending">Unpaid / Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Time Slots */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Time Slots</h3>
                        </div>
                        {!isViewing && (
                            <button
                                type="button"
                                onClick={addSlot}
                                className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-green-200"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Slot
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {formData.time_slots.map((slot, index) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group transition-all hover:border-slate-300 shadow-sm">
                                <div className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-12 sm:col-span-4">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Time</label>
                                        <TimePicker
                                            value={slot.start}
                                            onChange={(val) => !isViewing && handleSlotChange(index, 'start', val)}
                                            disabled={isViewing}
                                        />
                                    </div>
                                    <div className="col-span-12 sm:col-span-4">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">End Time</label>
                                        <TimePicker
                                            value={slot.end}
                                            onChange={(val) => !isViewing && handleSlotChange(index, 'end', val)}
                                            disabled={isViewing}
                                        />
                                    </div>
                                    <div className="col-span-12 sm:col-span-4 flex gap-2 items-center">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Price per Hour</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    value={slot.price}
                                                    onChange={(e) => handleSlotChange(index, 'price', e.target.value)}
                                                    disabled={isViewing}
                                                    className="w-full pl-7 pr-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold focus:ring-0 focus:border-green-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                                                />
                                            </div>
                                        </div>

                                        {!isViewing && formData.time_slots.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSlot(index)}
                                                className="mt-5 p-2.5 bg-white text-red-500 border border-slate-200 rounded-xl hover:bg-red-50 transition-all shadow-sm active:scale-95"
                                                title="Remove Slot"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Coupon Section */}
                    {!isViewing && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mt-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Tag className="h-3 w-3" /> Apply Coupon
                            </label>
                            <select
                                value={formData.coupon_code || ''}
                                onChange={e => handleSelectCoupon(e.target.value)}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-0 focus:border-purple-400 outline-none bg-white text-slate-800"
                            >
                                <option value="">-- No Coupon --</option>
                                {coupons.map(c => (
                                    <option key={c.id} value={c.code}>
                                        {c.code} — {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                                    </option>
                                ))}
                            </select>
                            {couponStatus && (
                                <p className={`mt-1.5 text-xs font-semibold ${couponStatus.valid ? 'text-green-600' : 'text-red-500'}`}>
                                    {couponStatus.message}
                                </p>
                            )}
                            {coupons.length === 0 && (
                                <p className="mt-1 text-[10px] text-slate-400">No active coupons available</p>
                            )}
                        </div>
                    )}

                    {formData.coupon_code && (
                        <div className="flex justify-between items-center bg-purple-50 text-purple-700 p-4 rounded-xl mt-3 border border-purple-100 shadow-sm">
                            <span className="font-medium">Applied Coupon: <b>{formData.coupon_code}</b></span>
                            <span className="text-lg font-bold">- ₹{parseFloat(formData.discount_amount).toLocaleString()}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl mt-3 shadow-lg shadow-slate-900/10">
                        <span className="font-medium text-slate-300">Total Amount</span>
                        <span className="text-2xl font-bold">₹{formData.total_amount.toLocaleString()}</span>
                    </div>
                </div>

            </div>

            {/* Bottom Actions - Safe Area aware */}
            {!isViewing && (
                <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white sticky bottom-0 z-10 px-1 pb-6 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {!isFullPage && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors active:scale-[0.98] transform"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] px-4 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-[0.98] transform"
                    >
                        {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Check className="h-5 w-5" />}
                        {isSubmitting ? 'Saving...' : (booking ? 'Update' : 'Create Booking')}
                    </button>
                </div>
            )}
        </form>
    );

    if (loading) return <div className="p-12 text-center text-slate-400">Loading data...</div>;

    if (isFullPage) {
        return formContent;
    }

    return (
        <div className="h-full">
            {formContent}
        </div>
    );
}
