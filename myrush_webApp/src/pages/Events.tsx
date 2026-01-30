import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaCalendarAlt, FaTrophy, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';

interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    prizePool: string;
    entryFee: string;
    status: 'Upcoming' | 'Live' | 'Completed';
    sport: 'Football' | 'Cricket' | 'Badminton';
    type: 'League' | 'Knockout';
    registeredTeams: number;
    maxTeams: number;
}

export const Events: React.FC = () => {
    // const navigate = useNavigate(); // Unused for now
    const [filterSport, setFilterSport] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    const events: Event[] = [
        {
            id: '1',
            title: 'Rush Premier League S4',
            date: 'Aug 15 - Sep 15, 2026',
            time: 'Weekends 6 PM',
            location: 'Rush Arena, Rajajinagar',
            image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076',
            prizePool: '₹1,00,000',
            entryFee: '₹5,000 / Team',
            status: 'Upcoming',
            sport: 'Football',
            type: 'League',
            registeredTeams: 12,
            maxTeams: 16
        },
        {
            id: '2',
            title: 'Corporate Cricket Bash',
            date: 'July 20, 2026',
            time: '9 AM Onwards',
            location: 'Rush Arena, Cooke Town',
            image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000',
            prizePool: '₹50,000',
            entryFee: '₹3,000 / Team',
            status: 'Live',
            sport: 'Cricket',
            type: 'Knockout',
            registeredTeams: 8,
            maxTeams: 8
        },
        {
            id: '3',
            title: 'Badminton Doubles Open',
            date: 'Aug 05, 2026',
            time: '10 AM - 6 PM',
            location: 'Rush Arena, GT Mall',
            image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070',
            prizePool: '₹20,000',
            entryFee: '₹1,000 / Pair',
            status: 'Upcoming',
            sport: 'Badminton',
            type: 'Knockout',
            registeredTeams: 24,
            maxTeams: 32
        }
    ];

    const filteredEvents = events.filter(event => {
        if (filterSport !== 'All' && event.sport !== filterSport) return false;
        if (filterStatus !== 'All' && event.status !== filterStatus) return false;
        return true;
    });

    const categories = ['All', 'Football', 'Cricket', 'Badminton'];
    const statuses = ['All', 'Upcoming', 'Live', 'Completed'];

    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            <TopNav />

            {/* Hero Section */}
            <section className="relative h-[60vh] bg-black overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1920"
                        alt="Events Hero"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-black/40 to-transparent" />
                </div>
                <div className="relative z-10 text-center px-6 mt-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase"
                    >
                        Leagues & Tournaments
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black text-white font-montserrat uppercase tracking-tighter mb-6 leading-[0.9]"
                    >
                        Rise To <br /> <span className="text-primary italic">Glory.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-300 text-lg max-w-2xl mx-auto font-medium"
                    >
                        Compete in top-tier leagues and tournaments. Prove your skills and win big.
                    </motion.p>
                </div>
            </section>

            {/* Filters */}
            <section className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 py-4 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        <span className="text-gray-400 mr-2 flex items-center gap-1 text-sm font-bold uppercase tracking-wider"><FaFilter /> Filter:</span>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterSport(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterSport === cat
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                        <div className="w-[1px] h-6 bg-gray-300 mx-2 hidden md:block" />
                        {statuses.map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === status
                                    ? 'bg-primary text-black'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Events Grid */}
            <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map((event, i) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-100"
                        >
                            {/* Image & Overlay */}
                            <div className="relative h-60 overflow-hidden">
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${event.status === 'Live' ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-black'
                                        }`}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/50 backdrop-blur-md text-white border border-white/20">
                                        {event.sport}
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <h3 className="text-white text-2xl font-black font-montserrat uppercase leading-none drop-shadow-md">
                                        {event.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <FaCalendarAlt className="text-primary" />
                                        <span className="text-sm font-medium">{event.date} • {event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <FaMapMarkerAlt className="text-primary" />
                                        <span className="text-sm font-medium">{event.location}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                                <FaTrophy />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Prize Pool</p>
                                                <p className="text-sm font-bold text-gray-900">{event.prizePool}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Entry Fee</p>
                                            <p className="text-sm font-bold text-gray-900">{event.entryFee}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-gray-500">Registration Status</span>
                                            <span className="text-primary">{event.registeredTeams}/{event.maxTeams} Teams</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${(event.registeredTeams / event.maxTeams) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-glow hover:scale-[1.02] transition-transform"
                                        onClick={() => window.location.href = '#register-modal'} // Placeholder for now
                                    >
                                        View Details & Register
                                    </Button>
                                    <button className="w-full text-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors">
                                        Download Rulebook
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};
