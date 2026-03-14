import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { 
    FaRunning, 
    FaSwimmingPool, 
    FaBasketballBall, 
    FaFutbol, 
    FaWheelchair, 
    FaMapMarkerAlt, 
    FaChevronRight, 
    FaTrophy,
    FaClock,
    FaCheckCircle,
    FaQuoteLeft
} from 'react-icons/fa';

interface UserProfile {
    id: string;
    full_name?: string;
    first_name?: string;
    email?: string;
}

export const Home: React.FC = () => {
    const { isAuthenticated, openAuthModal, user: authUser } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            const fetchProfile = async () => {
                try {
                    const response = await apiClient.get('/auth/profile');
                    setUser(response.data);
                } catch (err) {
                    console.error('Failed to fetch profile', err);
                }
            };
            fetchProfile();
        } else {
            openAuthModal();
        }
    }, [isAuthenticated, openAuthModal]);

    const facilityGroups = [
        { 
            category: 'Track & Field', 
            icon: <FaRunning />, 
            items: '400m Synthetic Track', 
            desc: 'A professional-grade track popular for walking, running, and athletic meets.' 
        },
        { 
            category: 'Aquatics', 
            icon: <FaSwimmingPool />, 
            items: 'Public Swimming Pool', 
            desc: 'A well-maintained, clean public pool facility for all ages.' 
        },
        { 
            category: 'Court Sports', 
            icon: <FaBasketballBall />, 
            items: 'Badminton, Basketball, Tennis', 
            desc: 'Dedicated courts for elite performance in tennis, basketball, and badminton.' 
        },
        { 
            category: 'Indoor & More', 
            icon: <FaTrophy />, 
            items: 'Table Tennis & Indoor Games', 
            desc: 'Professional table tennis facilities and various indoor sports setups.' 
        },
        { 
            category: 'Playgrounds', 
            icon: <FaFutbol />, 
            items: 'Football, Hockey, Volleyball', 
            desc: 'Spacious grounds for football, hockey, volleyball, and handball.' 
        },
        { 
            category: 'Accessibility', 
            icon: <FaWheelchair />, 
            items: 'Inclusive Design', 
            desc: 'Wheelchair-accessible entrances and dedicated parking for absolute inclusivity.' 
        },
    ];

    const liveSlots = [
        { sport: 'Badminton', court: 'Court 1', time: '04:00 PM', status: 'Available' },
        { sport: 'Swimming', court: 'Lane 3', time: '05:30 PM', status: 'Available' },
        { sport: 'Tennis', court: 'Center Court', time: '07:00 AM', status: 'Available' },
        { sport: 'Track', court: '100m Start', time: 'Anytime', status: 'Open' },
    ];

    const displayName = user?.full_name?.split(' ')[0] || user?.first_name || authUser?.full_name?.split(' ')[0] || 'Athlete';

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-black shadow-glow mx-auto mb-8">
                        <span className="font-black text-3xl tracking-tighter">DSA</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase font-heading leading-tight">
                        District Sports <span className="text-primary italic">Association.</span>
                    </h1>
                    <p className="text-gray-400 mb-10 leading-relaxed uppercase tracking-widest text-xs font-bold">
                        Gulbarga District Administration • Sports Department
                    </p>
                    <button 
                        onClick={() => openAuthModal()}
                        className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-full hover:scale-[1.02] transition-all shadow-glow flex items-center justify-center gap-3"
                    >
                        Login / Sign Up <FaChevronRight className="text-sm" />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black selection:bg-primary selection:text-black">
            <TopNav />
            
            {/* HERO SECTION */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden border-b-[12px] border-black bg-zinc-100">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/hero.png" 
                        alt="District Sports Association Gulbarga" 
                        className="w-full h-full object-cover scale-100 animate-slow-zoom opacity-100"
                    />
                    {/* Subtle bottom fade to ensure section transition is clean */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/40 via-transparent to-transparent"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 pt-20">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl"
                    >
                        <div className="flex flex-col gap-2 mb-8">
                            <span className="bg-primary text-black px-4 py-1.5 self-start font-black uppercase tracking-[0.2em] text-xs skew-x-[-15deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="inline-block skew-x-[15deg]">Welcome, {displayName}</span>
                            </span>
                            <h1 className="text-6xl md:text-[7rem] font-black font-heading leading-[0.85] uppercase tracking-tighter text-black drop-shadow-[0_2px_2px_rgba(255,255,255,0.5)]">
                                District Sports <br />
                                Association <br />
                                <span className="text-primary italic">Gulbarga.</span>
                            </h1>
                            <p className="mt-6 text-zinc-900 font-black uppercase tracking-[0.2em] text-sm md:text-lg max-w-2xl border-l-8 border-black pl-6">
                                The apex body for sports excellence and <br /> athletic development in the district.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <button 
                                onClick={() => navigate('/venues')}
                                className="px-12 py-6 bg-black text-white font-black uppercase tracking-widest rounded-none hover:bg-primary hover:text-black transition-all shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none"
                            >
                                Explorer Venues <FaMapMarkerAlt className="text-lg" />
                            </button>
                            <button 
                                onClick={() => navigate('/memberships')}
                                className="px-12 py-6 bg-white border-4 border-black text-black font-black uppercase tracking-widest rounded-none hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                Joint Academy
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* MINISTER'S VISION SECTION */}
            <section className="py-24 bg-black text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 skew-x-[-15deg] translate-x-1/2"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-12 mb-12">
                            <span className="text-primary font-black uppercase tracking-[0.5em] text-xs pb-4 border-b-2 border-primary inline-block">Minister's Vision</span>
                        </div>
                        
                        <div className="lg:col-span-5">
                            <motion.div 
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="relative aspect-[4/5] bg-zinc-900 border-4 border-primary p-2 overflow-hidden shadow-[20px_20px_0px_0px_rgba(163,230,53,0.1)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
                                <div className="absolute bottom-8 left-8 z-20">
                                    <h3 className="text-3xl font-black uppercase leading-none mb-2">Shri Priyank Kharge</h3>
                                    <p className="text-primary font-black uppercase text-[10px] tracking-widest italic">Hon. Minister for Rural Development, <br /> Panchayati Raj & IT/BT, Govt. of Karnataka</p>
                                </div>
                                <img 
                                    src="/minister.jpg" 
                                    alt="Shri Priyank Kharge" 
                                    className="w-full h-full object-cover hover:scale-105 transition-all duration-700"
                                />
                            </motion.div>
                        </div>

                        <div className="lg:col-span-7 space-y-10">
                            <FaQuoteLeft className="text-primary text-6xl opacity-30" />
                            <h2 className="text-4xl md:text-6xl font-black uppercase leading-tight tracking-tighter">
                                Sports enrichment is the cornerstone of <span className="text-primary italic">Youth Empowerment.</span>
                            </h2>
                            <p className="text-zinc-400 text-xl font-medium leading-relaxed max-w-2xl">
                                "Our mission is to transform Gulbarga into a hub for athletic brilliance. By investing in world-class infrastructure like CP Stadium, we are ensuring that every child has the platform to compete, succeed, and bring glory to Karnataka."
                            </p>
                            <div className="h-1 w-32 bg-primary"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LIVE SLOTS & CP STADIUM HIGHLIGHT */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-5">
                            <span className="text-primary font-black uppercase tracking-[0.3em] text-sm">Managing Venue</span>
                            <h2 className="text-6xl font-black uppercase italic tracking-tighter mt-4 mb-8">
                                Chandrasekhar <br /> Patil Stadium.
                            </h2>
                            <p className="text-zinc-500 font-medium text-lg leading-relaxed mb-10">
                                As the primary multi-purpose facility managed by the DSA, CP Stadium features a 400m synthetic track, Olympic-standard swimming pool, and professional basketball courts.
                            </p>
                            <button 
                                onClick={() => navigate('/venues')}
                                className="flex items-center gap-4 group text-black"
                            >
                                <div className="w-14 h-14 bg-black flex items-center justify-center text-primary text-xl group-hover:bg-primary group-hover:text-black transition-all">
                                    <FaChevronRight />
                                </div>
                                <span className="font-black uppercase tracking-widest border-b-4 border-black group-hover:border-primary transition-all pb-1">View Full Schedule</span>
                            </button>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="bg-black p-10 border-8 border-primary relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10 text-[10rem] font-black text-white pointer-events-none">LIVE</div>
                                <h3 className="text-primary font-black uppercase italic text-2xl mb-8 flex items-center gap-4">
                                    <FaClock /> Immediate Availability
                                </h3>
                                <div className="space-y-4">
                                    {liveSlots.map((slot, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 hover:border-primary transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="text-4xl text-zinc-700 group-hover:text-primary transition-colors">
                                                    {slot.sport === 'Badminton' && <FaBasketballBall />}
                                                    {slot.sport === 'Swimming' && <FaSwimmingPool />}
                                                    {slot.sport === 'Tennis' && <FaTrophy />}
                                                    {slot.sport === 'Track' && <FaRunning />}
                                                </div>
                                                <div>
                                                    <div className="text-white font-black uppercase text-lg">{slot.sport}</div>
                                                    <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{slot.court}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-primary font-black uppercase italic text-xl">{slot.time}</div>
                                                <div className="text-[10px] uppercase font-bold text-zinc-500 flex items-center justify-end gap-2">
                                                    <FaCheckCircle className="text-green-500" /> {slot.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FACILITIES GRID SECTION */}
            <section id="facilities" className="py-24 bg-slate-50 relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div>
                            <span className="text-primary font-black uppercase tracking-[0.3em] text-sm">District Infrastructure</span>
                            <h2 className="text-5xl md:text-7xl font-black uppercase mt-2 font-heading tracking-tighter">
                                Core <span className="italic">Facilities.</span>
                            </h2>
                        </div>
                        <div className="h-2 w-32 bg-black hidden md:block"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-4 border-black">
                        {facilityGroups.map((group, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative border-black border-[2px]"
                            >
                                <div className="relative p-10 bg-white hover:bg-black transition-all flex flex-col h-full group">
                                    <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-black text-3xl mb-8 group-hover:bg-primary transition-all skew-x-[-10deg]">
                                        <div className="skew-x-[10deg]">{group.icon}</div>
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-black group-hover:text-white">{group.category}</h3>
                                    <p className="text-primary text-xs font-black uppercase tracking-[0.2em] mb-6">{group.items}</p>
                                    <p className="text-zinc-600 text-sm leading-relaxed font-medium group-hover:text-zinc-400">{group.desc}</p>
                                    
                                    <div className="mt-auto pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-1 bg-primary"></div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-24 relative px-6 bg-white">
                <div className="container mx-auto">
                    <div className="relative overflow-hidden bg-primary p-12 md:p-24 text-center border-[12px] border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <h2 className="text-6xl md:text-9xl font-black text-black uppercase mb-10 leading-none tracking-tighter italic">
                                Ready to <br />Compete?
                            </h2>
                            <p className="text-black font-black max-w-2xl mx-auto mb-12 text-xl uppercase tracking-tight">
                                Join the hub for fitness enthusiasts in Gulbarga. From casual laps to national-level training.
                            </p>
                            <button 
                                onClick={() => navigate('/venues')}
                                className="bg-black text-white px-16 py-8 rounded-none font-black uppercase tracking-[0.2em] text-lg hover:bg-zinc-900 hover:text-primary transition-all shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center gap-4 mx-auto active:translate-x-1 active:translate-y-1 active:shadow-none"
                            >
                                Book Your Session <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};
