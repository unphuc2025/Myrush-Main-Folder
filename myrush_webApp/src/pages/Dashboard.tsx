import React, { useEffect, useState } from 'react';
// import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { motion, type Variants } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { FaCrown, FaWallet, FaCalendarAlt, FaRunning, FaMapMarkerAlt, FaChevronRight } from 'react-icons/fa';

interface UserProfile {
    id: string;
    full_name?: string;
    first_name?: string;
    email?: string;
}

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiClient.get('/auth/profile');
                setUser(response.data);
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        };
        fetchProfile();
    }, []);

    const displayName = user?.full_name?.split(' ')[0] || user?.first_name || 'Athlete';
    const timeOfDay = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';

    return (
        <div className="min-h-screen bg-gray-50 font-inter pb-24 md:pb-12">
            <TopNav userName={displayName} />

            <div className="pt-28 px-4 md:px-8 max-w-7xl mx-auto">
                {/* 1. PERSONALIZED HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4"
                >
                    <div>
                        <p className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-1">Good {timeOfDay},</p>
                        <h1 className="text-4xl md:text-5xl font-black text-black font-montserrat uppercase tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500">{displayName}</span>
                            <span className="text-primary">.</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/profile/edit')} className="px-5 py-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-gray-200 text-sm font-bold shadow-sm hover:bg-white hover:border-black transition-all">
                            Edit Profile
                        </button>
                    </div>
                </motion.div>

                {/* 2. QUICK STATS ROW */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {/* Loyalty Card */}
                    <motion.div
                        variants={fadeInUp}
                        onClick={() => navigate('/loyalty')}
                        className="glass-card-dark text-white p-6 rounded-3xl relative overflow-hidden cursor-pointer group hover:shadow-glow transition-all"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl -mr-10 -mt-10 animate-pulse"></div>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-yellow-400 text-xl backdrop-blur-md border border-white/5">
                                <FaCrown />
                            </div>
                            <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-black uppercase px-2 py-1 rounded backdrop-blur-sm border border-yellow-500/30">Gold Tier</span>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Rush Points</p>
                            <h3 className="text-3xl font-black font-montserrat group-hover:text-primary transition-colors">2,450</h3>
                        </div>
                    </motion.div>

                    {/* Upcoming Activity Card */}
                    <motion.div
                        variants={fadeInUp}
                        onClick={() => navigate('/bookings')} // Or specific booking details
                        className="glass-card p-6 rounded-3xl cursor-pointer group hover:border-blue-200/50 transition-all"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-xl shadow-inner">
                                <FaCalendarAlt />
                            </div>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-2 py-1 rounded">Next Game</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors">5v5 Football</h4>
                            <p className="text-sm text-gray-500 mb-4">Today, 8:00 PM • Rajajinagar</p>
                            <div className="flex items-center text-xs font-bold uppercase tracking-wider text-primary">
                                View Ticket <FaChevronRight className="ml-1 text-[10px] group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Wallet/Stats Card */}
                    <motion.div
                        variants={fadeInUp}
                        className="glass-card p-6 rounded-3xl"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-xl shadow-inner">
                                <FaWallet />
                            </div>
                            <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase px-2 py-1 rounded">Wallet</span>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Balance</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-black font-montserrat">₹500</h3>
                                <button className="mb-1 text-xs font-bold text-primary underline hover:text-green-700 transition-colors">Top Up</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* 3. MAIN DASHBOARD CONTENT (BENTO) */}
                <h3 className="text-2xl font-black font-montserrat uppercase mb-6 flex items-center gap-3">
                    Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">Hub</span> <div className="h-1 flex-1 bg-gray-200/50 rounded-full backdrop-blur-sm"></div>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[500px]">

                    {/* BOOK NOW (Large) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        onClick={() => navigate('/venues')}
                        className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl bg-black group cursor-pointer shadow-xl"
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070')] bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                            <h3 className="text-3xl md:text-4xl font-black text-white font-montserrat uppercase italic mb-2 drop-shadow-lg">Book<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">A Court</span></h3>
                            <div className="flex justify-between items-end">
                                <p className="text-gray-300 text-sm font-medium w-2/3 shadow-black drop-shadow-md">Ready to play? Find nearest venues instantly.</p>
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black text-xl group-hover:rotate-45 group-hover:scale-110 transition-all duration-300 shadow-glow">
                                    <FaRunning />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* JOIN GAME */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        onClick={() => navigate('/open-play')}
                        className="md:col-span-1 md:row-span-2 bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 relative overflow-hidden group cursor-pointer border border-gray-800 shadow-lg"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                            <FaMapMarkerAlt className="text-6xl text-white" />
                        </div>
                        <div className="h-full flex flex-col justify-end relative z-10">
                            <div className="mb-4">
                                <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2 py-1 rounded backdrop-blur-sm border border-primary/20">Live Now</span>
                            </div>
                            <h3 className="text-2xl font-black text-white font-montserrat uppercase leading-none mb-2">Open<br />Play</h3>
                            <p className="text-gray-400 text-xs font-bold leading-relaxed">Join 12+ games happening nearby.</p>
                        </div>
                    </motion.div>

                    {/* ACADEMY STATUS */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        onClick={() => navigate('/academy')}
                        className="md:col-span-1 md:row-span-1 glass-card rounded-3xl p-6 cursor-pointer hover:shadow-lg transition-all group"
                    >
                        <h3 className="text-lg font-black text-black font-montserrat uppercase mb-1">My Academy</h3>
                        <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-4">● Active Student</p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100/50 flex items-center justify-center text-sm shadow-inner">⚽</div>
                            <div>
                                <p className="text-xs font-bold">Next Session</p>
                                <p className="text-[10px] text-gray-500">Tom, 5 PM</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* STORE OFFER */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        onClick={() => navigate('/store')}
                        className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-primary to-emerald-500 rounded-3xl p-6 relative overflow-hidden cursor-pointer group shadow-glow"
                    >
                        <div className="absolute -right-4 -bottom-4 text-8xl text-black/10 font-black italic group-hover:scale-110 transition-transform">off</div>
                        <div className="relative z-10 text-black">
                            <h3 className="text-xl font-black font-montserrat uppercase leading-none mb-1">Store <br />Sale</h3>
                            <p className="text-sm font-bold opacity-80 mb-2">Up to 50% Off</p>
                            <span className="text-[10px] font-black uppercase border border-black px-2 py-1 rounded hover:bg-black hover:text-primary transition-colors backdrop-blur-sm">Shop Now</span>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

