import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { motion, type Variants, useScroll, useTransform } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
// import { Card } from '../components/ui/Card';

interface UserProfile {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number: string;
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
};

const marqueeVariants: Variants = {
    animate: {
        x: [0, -1035],
        transition: {
            x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
            },
        },
    },
};

export const Dashboard: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null);
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.5]);

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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const displayName = user?.full_name?.split(' ')[0] || user?.first_name || 'Player';

    return (
        <div className="min-h-screen bg-gray-50 font-inter pb-24 md:pb-0 overflow-x-hidden">
            <TopNav userName={displayName} onLogout={handleLogout} />

            {/* IMMERSIVE HERO SECTION */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black">
                {/* Parallax Background Image */}
                <motion.div
                    style={{ y: heroY, opacity: heroOpacity }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=3000&auto=format&fit=crop"
                        alt="Football Field Night"
                        className="w-full h-full object-cover opacity-80"
                    />
                </motion.div>

                {/* Hero Content */}
                <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-block mb-4 px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm font-bold text-primary tracking-widest uppercase"
                    >
                        Dashboard
                    </motion.div>

                    <motion.h1
                        className="text-6xl md:text-8xl font-black font-montserrat tracking-tighter text-white mb-6 uppercase leading-tight"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Unleash Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400 drop-shadow-[0_0_25px_rgba(0,210,106,0.6)]">
                            Inner Athlete
                        </span>
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        The ultimate platform to book top-tier venues, join academies, and dominate the league.
                    </motion.p>

                    <motion.div
                        className="flex flex-col md:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/venues')}
                            className="bg-primary text-black hover:bg-white hover:text-black text-lg px-12 py-5 uppercase tracking-wider font-montserrat font-bold shadow-[0_0_20px_rgba(0,210,106,0.4)]"
                        >
                            Start Playing Now
                        </Button>
                        <button
                            onClick={() => navigate('/bookings')}
                            className="px-8 py-5 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition-all backdrop-blur-sm uppercase tracking-wide"
                        >
                            View My Bookings
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* MARQUEE STRIP */}
            <div className="bg-primary overflow-hidden py-3 rotate-1 md:rotate-0 transform origin-left md:origin-center z-30 relative shadow-glow">
                <motion.div
                    className="flex whitespace-nowrap"
                    variants={marqueeVariants}
                    animate="animate"
                >
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-black font-black text-xl md:text-2xl mx-8 uppercase font-montserrat tracking-widest flex items-center gap-4">
                            BOOK • PLAY • COMPETE • WIN • REPEAT •
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* BENTO GRID MENU SECTION */}
            <section className="max-w-7xl mx-auto px-4 py-24 relative">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-black font-montserrat uppercase leading-none mb-2">
                            Explore <span className="text-primary">The Hub</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-lg">Everything you need to level up your game.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

                    {/* BOOK VENUES - Large Feature */}
                    <motion.div
                        className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl bg-black cursor-pointer shadow-2xl"
                        custom={0} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        onClick={() => navigate('/venues')}
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                        <div className="absolute bottom-0 left-0 p-8">
                            <div className="bg-primary text-black text-xs font-bold px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-wider">Most Popular</div>
                            <h3 className="text-4xl font-black text-white font-montserrat mb-2 uppercase italic">Book Venues</h3>
                            <p className="text-gray-300 max-w-xs mb-6 font-medium">Find premium turfs, courts, and fields near you available 24/7.</p>
                            <div className="flex items-center text-white font-bold group-hover:translate-x-2 transition-transform">
                                <span className="bg-white/20 p-3 rounded-full mr-3 backdrop-blur-md">🏟️</span>
                                Find a Court
                            </div>
                        </div>
                    </motion.div>

                    {/* JOIN ACADEMY */}
                    <motion.div
                        className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl bg-white border border-gray-100 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                        custom={1} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        onClick={() => { }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 group-hover:bg-gray-50 transition-colors"></div>
                        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>

                        <div className="relative p-6 h-full flex flex-col justify-between">
                            <div className="bg-gray-100 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
                            <div>
                                <h3 className="text-xl font-bold text-black font-montserrat uppercase">Academy</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Train with pros.</p>
                            </div>
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary">↗</div>
                        </div>
                    </motion.div>

                    {/* PROFILE / STATS */}
                    <motion.div
                        className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl bg-black cursor-pointer shadow-lg"
                        custom={2} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        onClick={() => navigate('/profile')}
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1962')] bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative p-6 h-full flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 rounded-full border-2 border-primary p-1 mb-3">
                                <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center text-2xl">👤</div>
                            </div>
                            <h3 className="text-lg font-bold text-white uppercase">{displayName}</h3>
                            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">View Profile</p>
                        </div>
                    </motion.div>

                    {/* COMPETE / LEAGUES */}
                    <motion.div
                        className="md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-3xl bg-accent cursor-pointer shadow-xl shadow-accent/20"
                        custom={3} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s] duration-[0ms] group-hover:bg-[position:200%_0,0_0] group-hover:duration-[1000ms] group-hover:transition-[background-position]"></div>

                        <div className="relative p-8 flex items-center justify-between h-full">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold bg-white text-accent px-2 py-0.5 rounded uppercase">Coming Soon</span>
                                </div>
                                <h3 className="text-3xl font-black text-white font-montserrat uppercase italic">Leagues & <br />Tournaments</h3>
                            </div>
                            <div className="text-6xl opacity-50 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300">🏆</div>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* STATS STRIP */}
            <section className="bg-white border-y border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
                    {[
                        { value: '50+', label: 'Premium Venues' },
                        { value: '24/7', label: 'Availability' },
                        { value: '10k+', label: 'Game Hours' },
                        { value: '4.9/5', label: 'Player Rating' },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-3xl md:text-5xl font-black text-black font-montserrat mb-2">{stat.value}</span>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-black/90 backdrop-blur-xl border border-white/10 py-4 px-6 rounded-full flex justify-between items-center z-50 shadow-2xl">
                <div className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-primary' : 'text-gray-500'}`} onClick={() => navigate('/')}>
                    <span className="text-xl">🏠</span>
                </div>
                <div className={`flex flex-col items-center gap-1 ${location.pathname === '/venues' ? 'text-primary' : 'text-gray-500'}`} onClick={() => navigate('/venues')}>
                    <span className="text-xl">🏟️</span>
                </div>
                <div className="relative -top-8 bg-primary p-4 rounded-full shadow-glow border-4 border-gray-100" onClick={() => navigate('/venues')}>
                    <span className="text-2xl text-black">⚽</span>
                </div>
                <div className={`flex flex-col items-center gap-1 ${location.pathname === '/bookings' ? 'text-primary' : 'text-gray-500'}`} onClick={() => navigate('/bookings')}>
                    <span className="text-xl">📅</span>
                </div>
                <div className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-primary' : 'text-gray-500'}`} onClick={() => navigate('/profile')}>
                    <span className="text-xl">👤</span>
                </div>
            </nav>
        </div>
    );
};
