import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaUsers, FaClock, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

interface Game {
    id: number;
    title: string;
    location: string;
    time: string;
    duration: string;
    players: string;
    price: string;
    level: string;
    image: string;
    isNew?: boolean;
}

export const OpenPlay: React.FC = () => {
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [games, setGames] = useState<Game[]>([
        {
            id: 1,
            title: '5v5 Football Night',
            location: 'Rush Arena, Rajajinagar',
            time: 'Today, 8:00 PM',
            duration: '90 Mins',
            players: '8/10 Joined',
            price: '₹200/person',
            level: 'Intermediate',
            image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=3000'
        },
        {
            id: 2,
            title: 'Badminton Doubles Social',
            location: 'Rush Arena, Cooke Town',
            time: 'Tomorrow, 6:00 PM',
            duration: '2 Hours',
            players: '3/4 Joined',
            price: '₹150/person',
            level: 'Beginner Friendly',
            image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070'
        },
        {
            id: 3,
            title: 'Saturday Cricket Match',
            location: 'Rush Arena, GT Mall',
            time: 'Sat, 7:00 AM',
            duration: '3 Hours',
            players: '12/22 Joined',
            price: '₹100/person',
            level: 'All Levels',
            image: 'https://images.unsplash.com/photo-1593341646261-651c911cc648?q=80&w=2070'
        }
    ]);

    const handleCreateGame = (e: React.FormEvent) => {
        e.preventDefault();
        const newGame: Game = {
            id: games.length + 1,
            title: 'New Hosted Game',
            location: 'Rush Arena, Main',
            time: 'Upcoming',
            duration: '60 Mins',
            players: '1/10 Joined',
            price: '₹150/person',
            level: 'Open',
            image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80',
            isNew: true
        };
        setGames([newGame, ...games]);
        setIsHostModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-black relative">
            <TopNav />
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-30 pointer-events-none"></div>

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1920"
                        alt="Open Play"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 text-center max-w-4xl px-6 mt-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-black/50 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase shadow-glow"
                    >
                        Community Games
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-8xl font-black font-heading uppercase tracking-tighter text-white mb-6 leading-tight md:leading-[0.9] drop-shadow-lg"
                    >
                        Find Your <br /> <span className="text-primary italic">Squad.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto drop-shadow-md"
                    >
                        Join pickup games happening around you. No team? No problem.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Button
                            onClick={() => setIsHostModalOpen(true)}
                            variant="primary"
                            className="h-14 px-10 text-black font-bold uppercase tracking-widest shadow-glow hover:shadow-glow-strong hover:scale-105 transition-all rounded-full"
                        >
                            Host a Game
                        </Button>
                    </motion.div>
                </div>
            </section>

            <div className="py-20 px-6 max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black font-heading uppercase text-black">Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">Games</span></h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {games.map((game, i) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.1 }}
                                className={`glass-card rounded-3xl overflow-hidden group cursor-pointer ${game.isNew ? 'ring-2 ring-primary/50 shadow-glow' : ''}`}
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-sm">
                                        <span className="text-xs font-bold text-white">{game.price}</span>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-black px-2 py-0.5 rounded mb-1 inline-block shadow-glow">{game.level}</span>
                                        <h3 className="text-xl font-bold font-heading uppercase text-white drop-shadow-md">{game.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                                            <FaMapMarkerAlt className="text-primary" /> {game.location}
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                                            <FaClock className="text-primary" /> {game.time} ({game.duration})
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                                            <FaUsers className="text-primary" />
                                            <div className="flex-1 bg-gray-200/50 rounded-full h-1.5 backdrop-blur-sm">
                                                <div className="bg-primary h-1.5 rounded-full shadow-glow" style={{ width: '80%' }} />
                                            </div>
                                            <span className="text-black font-bold">{game.players}</span>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-black hover:bg-white hover:text-black border border-black text-white font-bold uppercase tracking-widest h-12 shadow-lg transition-all rounded-xl">
                                        Join Now
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* HOST GAME MODAL */}
            <AnimatePresence>
                {isHostModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 max-w-lg w-full relative overflow-hidden shadow-2xl"
                        >
                            <button
                                onClick={() => setIsHostModalOpen(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                            >
                                <FaTimes size={24} />
                            </button>

                            <h2 className="text-2xl md:text-3xl font-black font-heading uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600">Host a Game</h2>
                            <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-base font-medium">Create a lobby and invite others to join.</p>

                            <form onSubmit={handleCreateGame} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2 mb-2 block">Sport</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Football', 'Badminton', 'Cricket'].map(sport => (
                                            <button type="button" key={sport} className="h-12 border border-black/10 rounded-xl font-bold text-sm hover:border-primary hover:bg-primary/10 focus:border-primary focus:bg-primary/20 transition-all bg-white/50">
                                                {sport}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2 mb-2 block">Date</label>
                                        <input type="date" className="w-full h-12 border border-black/10 bg-white/50 rounded-xl px-4 font-bold text-sm focus:border-primary focus:ring-0 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2 mb-2 block">Time</label>
                                        <input type="time" className="w-full h-12 border border-black/10 bg-white/50 rounded-xl px-4 font-bold text-sm focus:border-primary focus:ring-0 outline-none transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2 mb-2 block">Venue</label>
                                    <select className="w-full h-12 border border-black/10 bg-white/50 rounded-xl px-4 font-bold text-sm focus:border-primary focus:ring-0 outline-none transition-all">
                                        <option>Rush Arena, Rajajinagar</option>
                                        <option>Rush Arena, Cooke Town</option>
                                    </select>
                                </div>

                                <Button type="submit" variant="primary" className="w-full h-14 shadow-glow hover:shadow-glow-strong rounded-xl text-lg font-black transition-all">
                                    Create Lobby
                                </Button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
