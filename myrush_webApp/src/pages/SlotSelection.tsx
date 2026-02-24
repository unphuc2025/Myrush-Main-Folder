import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { venuesApi } from '../api/venues';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

interface Slot {
    time: string;
    display_time: string;
    price: number;
    available: boolean;
}

export const SlotSelection: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Parse query params
    const searchParams = new URLSearchParams(location.search);
    const venueId = searchParams.get('venueId');

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    // Month Navigation
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        if (venueId) {
            fetchSlots();
        }
    }, [venueId, selectedDate, currentDate]);

    const fetchSlots = async () => {
        if (!venueId) return;
        setLoading(true);

        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDate.toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const res = await venuesApi.getAvailableSlots(venueId, dateStr);
        if (res.success && res.data) {
            setAvailableSlots(res.data.slots);
        } else {
            setAvailableSlots([]);
        }
        setLoading(false);
    };

    const handleSlotClick = (slot: Slot) => {
        // Toggle selection
        const isSelected = selectedSlots.some(s => s.display_time === slot.display_time);
        if (isSelected) {
            setSelectedSlots(prev => prev.filter(s => s.display_time !== slot.display_time));
        } else {
            setSelectedSlots(prev => [...prev, slot]);
        }
    };

    const handleConfirm = () => {
        if (selectedSlots.length === 0) {
            alert('Please select at least one slot.');
            return;
        }
        // Navigate to booking summary
        // Pass data via state or query params. State is cleaner for complex objects.
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`;

        navigate('/booking/summary', {
            state: {
                venueId,
                date: dateStr,
                selectedSlots,
                totalPrice: selectedSlots.reduce((sum, s) => sum + s.price, 0)
            }
        });
    };

    const generateDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const isPastDate = (day: number) => {
        const today = new Date();
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        today.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans relative text-gray-900">
            <header className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
                >
                    <span className="text-xl">←</span>
                </button>
                <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
                    Select Slots
                </h2>
                <div className="w-10"></div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
                {/* Date Selection */}
                <motion.section
                    className="bg-white p-6 rounded-3xl mb-8 shadow-sm border border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                newDate.setMonth(newDate.getMonth() - 1);
                                setCurrentDate(newDate);
                            }}
                            disabled={currentDate <= new Date()}
                            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors border border-gray-100"
                        >←</button>
                        <span className="text-xl font-bold uppercase tracking-wider">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                newDate.setMonth(newDate.getMonth() + 1);
                                setCurrentDate(newDate);
                            }}
                            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-100"
                        >→</button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {generateDays().map(day => {
                            const disabled = isPastDate(day);
                            const active = selectedDate === day && !disabled;
                            return (
                                <button
                                    key={day}
                                    className={`flex-shrink-0 w-14 h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center ${active
                                        ? 'bg-black text-white scale-110 shadow-lg'
                                        : disabled
                                            ? 'text-gray-300 cursor-not-allowed bg-transparent'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                                        }`}
                                    onClick={() => !disabled && setSelectedDate(day)}
                                    disabled={disabled}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Slots Grid */}
                <motion.section
                    className="bg-white p-6 rounded-3xl mb-8 min-h-[300px] shadow-sm border border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Available Slots</h3>
                        {loading && <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-20 rounded-xl bg-gray-50 animate-pulse" />
                            ))}
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <span className="text-4xl mb-4 opacity-50">🗓️</span>
                            <p>No slots available for this date.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {availableSlots.map(slot => {
                                const isSelected = selectedSlots.some(s => s.display_time === slot.display_time);
                                return (
                                    <button
                                        key={slot.display_time}
                                        onClick={() => handleSlotClick(slot)}
                                        className={`relative p-4 rounded-xl border transition-all text-center group ${isSelected
                                            ? 'bg-primary/10 border-primary text-primary shadow-md'
                                            : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-900 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="text-lg font-bold mb-1">{slot.display_time}</div>
                                        <div className={`text-xs font-medium ${isSelected ? 'text-primary/70' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                            ₹{slot.price}
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-right md:text-left">
                            <span className="block text-gray-400 text-sm uppercase tracking-wider">Total Price</span>
                            <span className="text-3xl font-black text-gray-900">₹{selectedSlots.reduce((sum, s) => sum + s.price, 0)}</span>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full md:w-auto px-12 py-4 text-lg font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-105 transition-transform effect-shine"
                        disabled={selectedSlots.length === 0}
                        onClick={handleConfirm}
                    >
                        Confirm Booking ({selectedSlots.length})
                    </Button>
                </div>
            </footer>
        </div>
    );
};
