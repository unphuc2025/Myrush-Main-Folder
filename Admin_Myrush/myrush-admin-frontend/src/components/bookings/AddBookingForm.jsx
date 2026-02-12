import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, User, CreditCard, Check, Play, MapPin, IndianRupee } from 'lucide-react';
import { courtsApi, usersApi, bookingsApi } from '../../services/adminApi';

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

export default function AddBookingForm({ onClose, onBookingAdded, booking = null, isFullPage = false }) {
    const [courts, setCourts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        court_id: '',
        user_id: '',
        date: new Date().toISOString().split('T')[0],
        time_slots: [{ start: '09:00', end: '10:00', price: 0 }],
        status: 'pending',
        payment_status: 'pending',
        total_amount: 0
    });

    useEffect(() => {
        fetchData();
        if (booking) {
            // Robustly map time slots ensuring we have start/end keys
            const mappedSlots = (booking.time_slots && booking.time_slots.length > 0)
                ? booking.time_slots.map(slot => ({
                    start: slot.start || slot.start_time || slot.startTime,
                    end: slot.end || slot.end_time || slot.endTime,
                    price: slot.price || slot.price_per_slot || 0
                }))
                : [{
                    start: booking.start_time,
                    end: booking.end_time,
                    price: booking.price_per_hour || 0
                }];

            setFormData({
                court_id: booking.court_id || booking.court?.id || '',
                user_id: booking.user_id || booking.customer_id || '',
                date: booking.booking_date,
                time_slots: mappedSlots,
                status: booking.status,
                payment_status: booking.payment_status,
                total_amount: booking.total_amount,
                team_name: booking.team_name || '' // Populate team name for editing
            });
        }
    }, [booking]);

    useEffect(() => {
        // Recalculate total amount when slots change
        if (formData.time_slots) {
            const total = formData.time_slots.reduce((sum, slot) => sum + (parseFloat(slot.price) || 0), 0);
            if (total !== parseFloat(formData.total_amount)) {
                setFormData(prev => ({ ...prev, total_amount: total }));
            }
        }
    }, [formData.time_slots]);

    const fetchData = async () => {
        try {
            const [courtsData, usersData] = await Promise.all([
                courtsApi.getAll(),
                usersApi.getAll()
            ]);
            setCourts(Array.isArray(courtsData) ? courtsData : []);
            // usersApi.getAll returns { items: [], total: ... }
            setUsers(usersData.items && Array.isArray(usersData.items) ? usersData.items : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setCourts([]);
            setUsers([]);
        } finally {
            setLoading(false);
        }
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
                total_amount: formData.total_amount,
                status: formData.status,
                payment_status: formData.payment_status,
                time_slots: cleanSlots,
                price_per_hour: cleanSlots.length > 0 ? cleanSlots[0].price : 0,
                team_name: formData.team_name // Include manual name override
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

    const FormContent = () => (
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
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300"
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
                                placeholder="Enter name if specific user name is missing"
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium text-lg shadow-sm hover:border-slate-300"
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
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Date</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:ring-0 outline-none transition-all font-medium text-lg shadow-sm hover:border-slate-300"
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
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300 text-slate-900"
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
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
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300"
                        >
                            <option value="pending">Unpaid / Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Time Slots */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Time Slots</h3>
                        <button
                            type="button"
                            onClick={addSlot}
                            className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Plus className="h-3 w-3" /> Add Slot
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.time_slots.map((slot, index) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative group">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start</label>
                                        <TimePicker
                                            value={slot.start}
                                            onChange={(val) => handleSlotChange(index, 'start', val)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End</label>
                                        <TimePicker
                                            value={slot.end}
                                            onChange={(val) => handleSlotChange(index, 'end', val)}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            value={slot.price}
                                            onChange={(e) => handleSlotChange(index, 'price', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                </div>

                                {formData.time_slots.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSlot(index)}
                                        className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 border border-slate-200 rounded-full hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl mt-4 shadow-lg shadow-slate-900/10">
                        <span className="font-medium text-slate-300">Total Amount</span>
                        <span className="text-2xl font-bold">₹{formData.total_amount.toLocaleString()}</span>
                    </div>
                </div>

            </div>

            {/* Bottom Actions - Safe Area aware */}
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
        </form>
    );

    if (loading) return <div className="p-12 text-center text-slate-400">Loading data...</div>;

    if (isFullPage) {
        return <FormContent />;
    }

    return (
        <div className="h-full">
            <FormContent />
        </div>
    );
}
