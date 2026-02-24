import React, { useEffect, useState } from 'react';
// import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { FaCalendarAlt, FaRunning, FaChevronRight } from 'react-icons/fa';

interface UserProfile {
    id: string;
    full_name?: string;
    first_name?: string;
    email?: string;
}

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
        <div className="min-h-screen bg-gray-50 font-sans pb-24 md:pb-12">
            <TopNav userName={displayName} />

            <div className="pt-20 md:pt-24 px-4 md:px-8 max-w-7xl mx-auto">
                {/* 1. PERSONALIZED HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4"
                >
                    <div>
                        <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px] md:text-sm mb-1">Good {timeOfDay},</p>
                        <h1 className="text-3xl md:text-5xl font-black text-black font-heading uppercase tracking-tight">
                            <span className="text-gray-900">{displayName}</span>
                            <span className="text-primary">.</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/profile/edit')} className="px-5 py-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-gray-200 text-sm font-bold shadow-sm hover:bg-white hover:border-black transition-all">
                            Edit Profile
                        </button>
                    </div>
                </motion.div>

                {/* 2. MAIN DASHBOARD CONTENT (Vertical Stack) */}
                <div className="flex flex-col gap-8">

                    {/* BOOK NOW (Hero Card - Full Width) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        onClick={() => navigate('/venues')}
                        className="relative overflow-hidden rounded-3xl bg-black group cursor-pointer shadow-2xl h-[280px] md:h-[320px] w-full"
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070')] bg-cover bg-center opacity-70 group-hover:scale-105 transition-transform duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 z-10">
                            <h3 className="text-3xl md:text-6xl font-black text-white font-heading uppercase italic mb-4 drop-shadow-xl leading-none">
                                Book<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">Your Court</span>
                            </h3>
                            <button className="bg-white text-black font-bold uppercase tracking-widest text-[10px] md:text-sm px-6 md:px-8 py-3 md:py-4 rounded-full w-fit hover:bg-black hover:text-white transition-all shadow-glow flex items-center gap-2">
                                Find Venues <FaRunning className="text-base md:text-lg" />
                            </button>
                        </div>
                    </motion.div>

                    {/* UPCOMING ACTIVITY (Wide List Card) */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 px-2 flex items-center gap-2">
                            <FaCalendarAlt className="text-primary" />
                            Your Activity
                        </h3>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            onClick={() => navigate('/bookings')}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 text-xl border border-gray-100 group-hover:border-primary/30 group-hover:text-primary transition-all">
                                        <FaCalendarAlt />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">My Bookings</h4>
                                        <p className="text-sm text-gray-500">View upcoming games and past history</p>
                                    </div>
                                </div>
                                <div className="flex items-center text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors bg-gray-50 px-4 py-2 rounded-xl self-start md:self-center">
                                    View All <FaChevronRight className="ml-2 text-xs" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};
