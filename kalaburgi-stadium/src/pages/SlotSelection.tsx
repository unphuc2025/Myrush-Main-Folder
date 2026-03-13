import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { venuesApi } from '../api/venues';
import { motion } from 'framer-motion';
import { FaCalendarAlt } from 'react-icons/fa';

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
        if (selectedSlots.length < 2) {
            alert('Minimum booking duration is 1 hour (2 slots).');
            return;
        }
        // Navigate to booking summary
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
        <div className="min-h-screen bg-zinc-100 font-sans relative text-black">
            <header className="relative z-10 bg-black border-b-4 border-black mb-8">
                <div className="container mx-auto px-6 py-8 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 border-4 border-white bg-black hover:bg-white hover:text-black flex items-center justify-center transition-all text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                    <span className="text-xl">←</span>
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-none">
                        SELECT <span className="text-primary italic">SLOTS</span>
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-2">Mission Timing</span>
                </div>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-6 pb-48">
                {/* Date Selection */}
                <motion.section
                    className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4 italic">
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                newDate.setMonth(newDate.getMonth() - 1);
                                setCurrentDate(newDate);
                            }}
                            disabled={currentDate <= new Date()}
                            className="bg-zinc-100 border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-20"
                        >PREV</button>
                        <span className="text-2xl font-black uppercase tracking-tighter italic">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                newDate.setMonth(newDate.getMonth() + 1);
                                setCurrentDate(newDate);
                            }}
                            className="bg-zinc-100 border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-primary transition-colors"
                        >NEXT</button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                        {generateDays().map(day => {
                            const disabled = isPastDate(day);
                            const active = selectedDate === day && !disabled;
                            return (
                                <button
                                    key={day}
                                    className={`flex-shrink-0 w-16 h-16 border-4 border-black font-black text-xl transition-all flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${active
                                        ? 'bg-primary text-black scale-110 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                                        : disabled
                                            ? 'text-zinc-300 border-zinc-200 cursor-not-allowed bg-transparent shadow-none'
                                            : 'bg-white hover:bg-primary text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
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
                    className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] min-h-[400px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-black italic">
                        <h3 className="text-2xl font-black text-black uppercase tracking-tighter">Available Windows</h3>
                        {loading && <div className="animate-spin h-6 w-6 border-4 border-black border-t-primary" />}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-24 bg-zinc-100 border-4 border-black border-dashed opacity-50" />
                            ))}
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-zinc-300">
                            <span className="text-8xl mb-6 opacity-10"><FaCalendarAlt /></span>
                            <p className="font-black uppercase tracking-widest text-xs">No windows available for selection.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {availableSlots.map(slot => {
                                const isSelected = selectedSlots.some(s => s.display_time === slot.display_time);
                                return (
                                    <button
                                        key={slot.display_time}
                                        onClick={() => handleSlotClick(slot)}
                                        className={`relative p-6 border-4 border-black transition-all text-center group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${isSelected
                                            ? 'bg-primary text-black'
                                            : 'bg-white hover:bg-zinc-50 text-black'
                                            }`}
                                    >
                                        <div className="text-2xl font-black italic tracking-tighter mb-2">{slot.display_time}</div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-black' : 'text-zinc-500'}`}>
                                            ₹{slot.price}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-8 bg-white border-t-8 border-black z-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-10">
                        <div className="text-left">
                            <span className="block text-zinc-400 text-[8px] font-black uppercase tracking-[0.4em] mb-2 leading-none">Total Investment</span>
                            <span className="text-5xl font-black text-black italic tracking-tighter leading-none">₹{selectedSlots.reduce((sum, s) => sum + s.price, 0)}</span>
                        </div>
                        <div className="bg-black text-white px-4 py-2 border-l-4 border-primary">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Slots Locked: {selectedSlots.length}</span>
                        </div>
                    </div>
                    <button
                        className="w-full md:w-auto bg-black text-white px-16 py-6 text-xl font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] hover:bg-primary hover:text-black transition-all disabled:opacity-20 active:translate-x-1 active:translate-y-1 active:shadow-none"
                        disabled={selectedSlots.length === 0}
                        onClick={handleConfirm}
                    >
                        CONFIRM MISSION
                    </button>
                </div>
            </footer>
        </div>
    );
};
