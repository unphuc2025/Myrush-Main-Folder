import React, { useState, useRef, useEffect } from 'react';
import { VenueDetailCard } from './chatbot/VenueDetailCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeadset, FaPaperPlane, FaTimes, FaMinus, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaRobot } from 'react-icons/fa';
import type { Message, QuickReply, BookingState } from '../types/ChatbotTypes';
import { CITIES, SPORTS } from '../types/ChatbotTypes';
import { venuesApi } from '../api/venues';
import { useNavigate } from 'react-router-dom';
import { getGeminiResponse } from '../services/GeminiService';
import { featureFlags } from '../config/featureFlags';

export const Chatbot: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: crypto.randomUUID(),
            text: "Hello! I'm from the MyRush Support Team. How can I help you regarding your booking or game today?",
            sender: 'bot',
            timestamp: new Date(),
            type: 'text'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [bookingState, setBookingState] = useState<BookingState>({ step: 'idle' });
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isLoading]);

    const addBotMessage = (text: string, type: Message['type'] = 'text', options?: QuickReply[], data?: any) => {
        const newMessage: Message = {
            id: crypto.randomUUID(),
            text,
            sender: 'bot',
            timestamp: new Date(),
            type,
            options,
            data
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const addUserMessage = (text: string) => {
        const newMessage: Message = {
            id: crypto.randomUUID(),
            text,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleOptionClick = async (option: QuickReply) => {
        addUserMessage(option.label);

        if (option.action === 'book_venue' && option.data?.venueId) {
            // Fetch details first to ensure we have the name
            const res = await venuesApi.getVenueById(option.data.venueId);
            if (res.success) {
                handleVenueSelection(res.data);
            }
            return;
        }

        switch (option.action) {
            case 'start_booking':
                setBookingState({ step: 'selecting_city' });
                addBotMessage('Great! Let\'s get you playing. Which city are you in?', 'options',
                    CITIES.map(c => ({ label: c, value: c, action: 'select_city' }))
                );
                break;
            case 'view_bookings':
                navigate('/bookings');
                setIsOpen(false);
                break;
            case 'contact_support':
                addBotMessage('You can reach us at harsha@myrush.in or call +91 7624898999.');
                break;
            case 'select_city':
                setBookingState(prev => ({ ...prev, city: option.value, step: 'selecting_sport' }));
                addBotMessage(`You selected ${option.value}. What sport do you want to play?`, 'options',
                    SPORTS.map(s => ({ label: s, value: s, action: 'select_sport' }))
                );
                break;
            case 'select_sport':
                handleSportSelection(option.value);
                break;
            case 'select_date':
                handleDateSelection(option.value);
                break;
        }
    };

    const handleSportSelection = async (sport: string, cityOverride?: string) => {
        const cityIndex = cityOverride || bookingState.city;

        if (!cityIndex) {
            setBookingState(prev => ({ ...prev, sport, step: 'selecting_city' }));
            addBotMessage('Which city are you looking for?', 'options',
                CITIES.map(c => ({ label: c, value: c, action: 'select_city' }))
            );
            return;
        }

        setBookingState(prev => ({ ...prev, city: cityIndex, sport, step: 'selecting_venue' }));
        setIsLoading(true);
        const res = await venuesApi.getVenues({ city: cityIndex, game_type: sport });
        setIsLoading(false);

        if (res.success && res.data && res.data.length > 0) {
            addBotMessage(`Here are some ${sport} venues in ${cityIndex}:`, 'venues', undefined, res.data.slice(0, 5));
        } else {
            addBotMessage(`Sorry, I couldn't find any ${sport} venues in ${cityIndex}. Please try another sport or city.`);
            setBookingState(prev => ({ ...prev, step: 'selecting_sport' }));
        }
    };

    const handleVenueSelection = (venue: any) => {
        setBookingState(prev => ({ ...prev, venue, step: 'selecting_date' }));
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateOptions = [
            { label: 'Today', value: today.toISOString().split('T')[0], action: 'select_date' },
            { label: 'Tomorrow', value: tomorrow.toISOString().split('T')[0], action: 'select_date' }
        ];

        addBotMessage(`You chose ${venue.court_name || venue.name}. When do you want to play?`, 'options', dateOptions);
    };

    const handleDateSelection = async (date: string) => {
        setBookingState(prev => ({ ...prev, date, step: 'selecting_slot' }));
        setIsLoading(true);
        const res = await venuesApi.getVenueSlots(bookingState.venue.id, date, bookingState.sport);
        setIsLoading(false);

        if (res.success && res.data && res.data.slots && res.data.slots.length > 0) {
            const available = res.data.slots.filter((s: any) => s.available).slice(0, 12);
            if (available.length > 0) {
                addBotMessage(`Here are available slots for ${new Date(date).toDateString()}:`, 'slots', undefined, available);
            } else {
                addBotMessage('Sorry, no slots available for this date. Please choose another date.');
            }
        } else {
            addBotMessage('Could not fetch slots. Please try again.');
        }
    };

    const handleSlotSelection = (slot: any) => {
        setBookingState(prev => ({ ...prev, slot, step: 'confirming' }));
        addBotMessage('Please review your booking details:', 'summary', undefined, {
            venue: bookingState.venue,
            date: bookingState.date,
            slot: slot
        });
    };

    const confirmBooking = () => {
        if (!bookingState.venue || !bookingState.date || !bookingState.slot) return;

        const locationState = {
            venueId: bookingState.venue.id,
            venueName: bookingState.venue.name || bookingState.venue.court_name,
            venueImage: bookingState.venue.image_url || bookingState.venue.photos?.[0],
            date: bookingState.date,
            selectedSlots: [{
                time: bookingState.slot.time,
                display_time: bookingState.slot.display_time,
                price: bookingState.slot.price,
                court_id: bookingState.slot.court_id,
                court_name: bookingState.slot.court_name
            }],
            selectedSport: bookingState.sport || bookingState.venue.game_types?.[0] || 'Multi-Sport',
            totalPrice: bookingState.slot.price,
            numPlayers: 1
        };

        navigate('/booking/summary', { state: locationState });
        setIsOpen(false);
        setBookingState({ step: 'idle' });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        const userText = inputText;
        addUserMessage(userText);
        setInputText('');
        setIsLoading(true);

        const conversationHistory = messages.map(msg => ({
            text: msg.text,
            sender: msg.sender
        }));

        try {
            const aiResponse = await getGeminiResponse(userText, conversationHistory);
            setIsLoading(false);

            // 1. Send text response
            addBotMessage(aiResponse.response);

            // 2. Handle Search Action
            if (aiResponse.action?.type === 'search' && aiResponse.searchResults) {
                if (aiResponse.searchResults.length > 0) {
                    const params = aiResponse.action.parameters;
                    setBookingState({
                        step: 'showing_venues',
                        city: params.city,
                        sport: params.sport
                    });
                    addBotMessage(`Found ${aiResponse.searchResults.length} options:`, 'venues', undefined, aiResponse.searchResults);
                } else {
                    addBotMessage('I couldn\'t find any venues matching that search. Try something else?');
                }
            }

            // 3. Handle Venue Details
            if (aiResponse.venueDetails) {
                addBotMessage('Here are the details:', 'venue_detail', undefined, { venue: aiResponse.venueDetails });
                addBotMessage('Would you like to book a slot here?', 'options', [
                    { label: 'Yes, book now', value: 'book_now', action: 'book_venue', data: { venueId: aiResponse.venueDetails.id } },
                    { label: 'Search others', value: 'search_more', action: 'start_booking' }
                ]);
            }

            // 4. Handle Navigation/Intent
            if (aiResponse.intent === 'view_bookings') {
                navigate('/bookings');
                setIsOpen(false);
            }

        } catch (error) {
            console.error("Chat Error:", error);
            setIsLoading(false);
            addBotMessage("Sorry, I'm having trouble connecting right now. Please try again in a moment.");
        }
    };

    if (!featureFlags.enableChatbot) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden border border-gray-100 font-sans"
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 flex justify-between items-center text-white shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <FaHeadset size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Rush Support</h3>
                                    <p className="text-xs text-white/80 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FaMinus size={14} /></button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FaTimes size={14} /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl mb-1 ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>

                                    {msg.type === 'options' && msg.options && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.options.map((opt, idx) => (
                                                <button key={idx} onClick={() => handleOptionClick(opt)} className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-full hover:bg-primary hover:text-white transition-colors">
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {msg.type === 'venues' && msg.data && (
                                        <div className="flex gap-4 overflow-x-auto w-full pb-4 pt-2 -mx-2 px-2 snap-x">
                                            {msg.data.map((venue: any) => (
                                                <div key={venue.id} className="min-w-[200px] w-[200px] bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden snap-center flex-shrink-0">
                                                    <div className="h-24 bg-gray-200 relative">
                                                        <img src={venue.image_url || venue.photos?.[0]} alt={venue.name} className="w-full h-full object-cover" />
                                                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">{venue.game_types?.[0] || venue.game_type}</span>
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="font-bold text-sm truncate">{venue.name || venue.court_name}</h4>
                                                        <p className="text-xs text-gray-500 mb-2 truncate">📍 {venue.area}, {venue.city}</p>
                                                        <button onClick={() => handleVenueSelection(venue)} className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90 transition-all active:scale-95">Select Venue</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {msg.type === 'slots' && msg.data && (
                                        <div className="grid grid-cols-3 gap-2 mt-2 w-full max-w-[280px]">
                                            {msg.data.map((slot: any) => (
                                                <button key={slot.time} onClick={() => handleSlotSelection(slot)} className="bg-white border border-gray-200 rounded-lg p-2 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                                                    <div className="text-xs font-bold text-gray-800">{slot.display_time}</div>
                                                    <div className="text-[10px] text-gray-500">₹{slot.price}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {msg.type === 'venue_detail' && msg.data?.venue && (
                                        <VenueDetailCard
                                            venue={msg.data.venue}
                                            onBookClick={() => handleVenueSelection(msg.data.venue)}
                                        />
                                    )}

                                    {msg.type === 'summary' && msg.data && (
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 mt-2 w-full max-w-[280px] shadow-sm">
                                            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-2">Booking Summary</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-primary text-xs" /><span className="font-medium">{msg.data.venue.name || msg.data.venue.court_name}</span></div>
                                                <div className="flex items-center gap-2"><FaCalendarAlt className="text-primary text-xs" /><span>{new Date(msg.data.date).toLocaleDateString()}</span></div>
                                                <div className="flex items-center gap-2"><FaClock className="text-primary text-xs" /><span>{msg.data.slot.display_time}</span></div>
                                                <div className="flex justify-between font-bold pt-2 border-t border-gray-100 mt-2"><span>Total</span><span className="text-primary">₹{msg.data.slot.price}</span></div>
                                                <button onClick={confirmBooking} className="w-full bg-black text-white font-bold py-2 rounded-lg mt-2 hover:bg-gray-800 transition-all active:scale-95">Confirm Booking</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1 focus-within:border-primary transition-all shadow-sm focus-within:shadow-md"
                            >
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Ask anything about venues..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 !outline-none text-sm py-3 placeholder:text-gray-400"
                                />
                                <button type="submit" disabled={!inputText.trim() || isLoading} className={`p-2.5 rounded-full transition-all ${inputText.trim() ? 'bg-primary text-white shadow-md hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><FaPaperPlane size={14} /></button>
                            </form>
                            <div className="text-center mt-2 flex items-center justify-center gap-1.5">
                                <FaRobot className="text-primary/50" size={10} />
                                <p className="text-[10px] text-gray-400 font-medium">Enhanced by MyRush Gemini AI</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle */}
            <motion.button
                className="fixed bottom-6 right-6 z-[9999] bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center justify-center group"
                onClick={() => setIsOpen(!isOpen)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><FaTimes size={24} /></motion.div>
                        : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><FaHeadset size={28} /></motion.div>}
                </AnimatePresence>
                {!isOpen && <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold ml-0 group-hover:ml-2">Chat with AI</span>}
            </motion.button>
        </>
    );
};
