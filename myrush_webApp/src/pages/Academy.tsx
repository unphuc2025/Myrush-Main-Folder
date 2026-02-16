import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { PublicNav } from '../components/PublicNav';
import { TopNav } from '../components/TopNav';
import { FaCalendarAlt, FaChartLine, FaCheckCircle, FaUserGraduate, FaClock } from 'react-icons/fa';

export const Academy: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Mock state to simulate user journey: 'marketing' | 'pending' | 'student'
    const [academyState, setAcademyState] = useState<'marketing' | 'pending' | 'student'>('marketing');

    if (!isAuthenticated) {
        return <AcademyLanding navigate={navigate} />;
    }

    // In a real app, this would come from an API based on the user's data
    if (academyState === 'marketing') {
        return <AcademyEnrollmentView onEnroll={() => setAcademyState('pending')} />;
    }

    if (academyState === 'pending') {
        return <AcademyPendingView onUpgrade={() => setAcademyState('student')} />;
    }

    return <AcademyDashboard />;
};

// --- LOGGED IN: ENROLLMENT VIEW (NEW USER) ---
const AcademyEnrollmentView: React.FC<{ onEnroll: () => void }> = ({ onEnroll }) => {
    return (
        <div className="min-h-screen font-inter relative overflow-hidden">
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-30 pointer-events-none"></div>

            <TopNav />
            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-black/5 backdrop-blur-md border border-black/10 text-primary text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                        Complete Your Profile
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black font-montserrat uppercase mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-black to-gray-700">
                        Join the <span className="text-primary italic">Academy</span>
                    </h1>
                    <p className="text-gray-600 text-lg mb-12 max-w-2xl mx-auto font-medium">
                        You're logged in but haven't enrolled yet. Submit your application to getting assigned a coach and batch.
                    </p>

                    <div className="glass-card p-10 rounded-[2.5rem] shadow-xl max-w-xl mx-auto text-left">
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onEnroll(); }}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2">Preferred Sport</label>
                                <select className="w-full h-14 bg-gray-50/50 rounded-xl px-4 font-bold border border-gray-100 focus:border-primary focus:ring-0 transition-all outline-none">
                                    <option>Football</option>
                                    <option>Badminton</option>
                                    <option>Cricket</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2">Experience Level</label>
                                <select className="w-full h-14 bg-gray-50/50 rounded-xl px-4 font-bold border border-gray-100 focus:border-primary focus:ring-0 transition-all outline-none">
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                            <Button className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-glow hover:scale-[1.02] transition-transform" variant="primary">
                                Submit Application
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// --- LOGGED IN: PENDING VIEW ---
const AcademyPendingView: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
    return (
        <div className="min-h-screen font-inter relative overflow-hidden">
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-30 pointer-events-none"></div>

            <TopNav />
            <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-12 rounded-[3rem] shadow-xl flex flex-col items-center"
                >
                    <div className="w-24 h-24 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-4xl mb-8 animate-pulse shadow-inner">
                        <FaClock />
                    </div>
                    <h2 className="text-3xl font-black font-montserrat uppercase mb-4 text-gray-900">Application Pending</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
                        Our coaches are reviewing your profile. You will be assigned a batch shortly.
                    </p>

                    {/* DEMO ONLY BUTTON */}
                    <button
                        onClick={onUpgrade}
                        className="text-xs font-bold text-gray-400 hover:text-primary underline uppercase tracking-widest transition-colors"
                    >
                        [Demo: Coach Approved Me]
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

// --- LOGGED IN VIEW: STUDENT DASHBOARD (Existing) ---
const AcademyDashboard: React.FC = () => {
    return (
        <div className="min-h-screen font-inter relative">
            <div className="fixed inset-0 z-0 mesh-bg opacity-20 pointer-events-none"></div>
            <TopNav />

            {/* Academy Hero */}
            <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1624880357913-a8539238245b?q=80&w=2070"
                        alt="Academy Hero"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 text-center w-full px-6 mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white uppercase tracking-widest"
                    >
                        Student Portal
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black font-montserrat uppercase leading-none text-white mb-6"
                    >
                        My <span className="text-primary italic">Academy</span>
                    </motion.h1>
                </div>
            </section>

            <div className="-mt-20 relative z-20 px-6 max-w-7xl mx-auto pb-20">

                {/* Info Cards */}
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-8 rounded-3xl shadow-sm flex items-start gap-4 hover:shadow-glow transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-sm">
                            <FaUserGraduate />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Batch</p>
                            <h3 className="text-xl font-bold mt-1 text-gray-900">Rajajinagar U-18</h3>
                            <p className="text-sm text-gray-500 mt-1">Coach: Nikhit Fernandes</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-8 rounded-3xl shadow-sm flex items-start gap-4 hover:shadow-glow transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl shadow-sm">
                            <FaCheckCircle />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendance</p>
                            <h3 className="text-xl font-bold mt-1 text-gray-900">85%</h3>
                            <p className="text-sm text-gray-500 mt-1">22/26 Sessions Attended</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-8 rounded-3xl shadow-sm flex items-start gap-4 hover:shadow-glow transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shadow-sm">
                            <FaChartLine />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Performance</p>
                            <h3 className="text-xl font-bold mt-1 text-gray-900">Excellent</h3>
                            <p className="text-sm text-gray-500 mt-1">Top 10% in Speed Tests</p>
                        </div>
                    </motion.div>
                </div>

                {/* Upcoming Classes */}
                <h2 className="text-2xl font-black font-montserrat uppercase mb-6 drop-shadow-sm">Upcoming Sessions</h2>
                <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
                    {[
                        { date: 'Today', time: '5:00 PM - 7:00 PM', topic: 'Technical Drills: Passing', status: 'Upcoming' },
                        { date: 'Friday, Oct 27', time: '5:00 PM - 7:00 PM', topic: 'Practice Match', status: 'Scheduled' },
                        { date: 'Monday, Oct 30', time: '5:00 PM - 7:00 PM', topic: 'Fitness & Agility', status: 'Scheduled' },
                    ].map((session, i) => (
                        <div key={i} className="p-6 border-b border-gray-100 last:border-0 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{session.date}</h4>
                                    <p className="text-sm text-gray-500">{session.time} • {session.topic}</p>
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${session.status === 'Upcoming' ? 'bg-primary/20 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                {session.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- GUEST VIEW: LANDING PAGE ---
const AcademyLanding: React.FC<{ navigate: any }> = ({ navigate }) => {

    const locations = [
        {
            name: 'Rajajinagar',
            address: 'Rush Arena, Rajajinagar',
            days: 'Tue, Thu & Sat',
            timings: '5PM to 7PM'
        },
        {
            name: 'Kasavanahalli (Owners Court)',
            address: 'Rush Arena, Kasavanahalli',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 7PM'
        },
        {
            name: 'Vijaynagar @ GT World Mall',
            address: 'Rush Arena GT Mall',
            days: 'Sat & Sunday',
            timings: '8.30AM to 9.30AM'
        },
        {
            name: 'Hesarghatta Main Road',
            address: 'Rush Arena Hesargatta Main Road',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 7PM'
        },
        {
            name: 'Cooke Town',
            address: 'Rush Arena, Cooke Town',
            days: 'Mon, Wed, Fri',
            timings: '5PM to 6PM'
        },
        {
            name: 'Vidyaranyapura',
            address: 'ToughX Arena',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 7PM'
        },
        {
            name: 'Old Airport Road',
            address: 'Rush Arena, Old Airport Road',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 6PM'
        }
    ];

    const team = [
        { name: 'Nikhit Fernandes', role: 'Director of Football', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/749a3bdc-8950-46a4-b517-b9749f837d46/Coach+Pics.png' },
        { name: 'Harish', role: 'Operations Manager & Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/a0d027b7-c26e-4b2b-8b82-1ca19c15d34a/9.png' },
        { name: 'Dominic', role: 'Coach D Licence', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/4333df17-6d51-4d4d-90c4-0dc24bef7da4/1.png' },
        { name: 'Mark', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/5e29913b-2a1b-484e-b219-6cc543fd9307/6.png' },
        { name: 'Jeremy', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/aa5a2d2b-d1cf-4813-9465-c2601cc67196/2.png' },
        { name: 'Nikita', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/ecfc50cd-3d7f-4759-8a8d-cc5b07c8955b/3.png' },
        { name: 'Manjhi', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/14c088b4-2802-455d-87dd-60f0947cff27/5.png' },
        { name: 'Mugilan', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/a3cc189e-bcb0-4f52-81ca-7807bf2c821d/7.png' },
        { name: 'Abhishek', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/924a1da3-37dd-49ec-848f-a78fc999fb6e/8.jpg' }
    ];

    return (
        <div className="min-h-screen bg-white font-inter relative selection:bg-primary selection:text-black">
            <div className="fixed inset-0 z-0 mesh-bg opacity-10 pointer-events-none"></div>
            {/* Sticky Navigation */}
            {/* Sticky Navigation */}
            <PublicNav />

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-start overflow-hidden bg-black px-6 md:px-12 lg:px-32">
                {/* Background Image with Deep Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-dark-gradient z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop"
                        alt="Football training"
                        className="w-full h-full object-cover opacity-50 scale-105"
                    />
                </div>

                <motion.div
                    className="relative z-20 text-left w-full max-w-7xl"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="inline-flex items-center gap-3 mb-10 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-xl"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-lg md:text-xl font-bold text-primary uppercase tracking-[0.3em]">
                            Speak to us, now - +91-8548946999
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-10 leading-[0.9] tracking-[-0.05em]">
                        Unlock Your Football Potential with <br />
                        <span className="text-primary italic">Rush Academy.</span>
                    </h1>

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-start gap-8">
                        <Button
                            variant="primary"
                            size="lg"
                            className="bg-primary text-black hover:bg-white hover:text-black text-lg px-12 py-5 uppercase tracking-wider font-montserrat font-black shadow-[0_0_20px_rgba(0,210,106,0.5)] hover:shadow-[0_0_30px_rgba(0,210,106,0.6)]"
                            onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Book A Free Trial Class
                        </Button>
                    </div>
                </motion.div>

                {/* Vertical Indicator */}
                <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-6 z-20">
                    <span className="text-[10px] font-black text-white/20 rotate-90 uppercase tracking-[0.5em] mb-12">Scroll</span>
                    <div className="w-[1px] h-20 bg-gradient-to-b from-primary to-transparent" />
                </div>
            </section>



            {/* Why Rush Academy Section */}
            <section id="why-rush" className="py-12 md:py-16 bg-white w-full">
                <div className="w-full max-w-7xl mx-auto px-6">
                    <div className="mb-12">
                        <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight">
                            Why Rush Academy?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 w-full">
                        {[
                            {
                                title: 'Expert Coaching',
                                description: 'At Rush Academy, we pride ourselves on providing top-notch coaching led by experienced and qualified trainers. Our coaches are passionate about nurturing talent, offering personalized guidance, and fostering a positive learning environment, ensuring every player receives the attention they need to develop their soccer skills.',
                                image: '/images/academy/expert-coaching.png'
                            },
                            {
                                title: 'Comprehensive Development',
                                description: 'Joining Rush Academy offers more than just soccer training. We focus on a holistic approach to player development, encompassing physical fitness, tactical understanding, mental resilience, and teamwork. Our goal is to mold well-rounded athletes, both on and off the field, setting them up for success in sports and life.',
                                image: '/images/academy/comprehensive-development.png'
                            },
                            {
                                title: 'State-of-the-Art Facilities',
                                description: 'As a leading soccer academy, we boast state-of-the-art training facilities designed to optimize player performance. From well-maintained pitches to modern amenities, our infrastructure ensures an ideal environment for players to train, grow, and excel in their soccer journey.',
                                image: '/images/academy/facilities.png'
                            },
                            {
                                title: 'Competitive Opportunities',
                                description: 'Rush Academy provides its players with access to competitive leagues and tournaments, both locally and nationally. Participating in such events allows players to showcase their skills, gain valuable match experience, and potentially attract opportunities for higher-level competitions.',
                                image: '/images/academy/competitive-opportunities.png'
                            },
                            {
                                title: 'Inclusive and Supportive Environment',
                                description: 'We embrace diversity and welcome players of all ages, genders, and skill levels. Our academy fosters a supportive and inclusive community where players build lasting friendships, learn valuable life skills, and develop a passion for the beautiful game in a fun and nurturing atmosphere.',
                                image: '/images/academy/inclusive-environment.png'
                            },
                            {
                                title: 'Pathway to Success',
                                description: 'Rush Academy has a proven track record of producing talented players who have gone on to represent professional clubs, college teams, and even national squads. For aspiring young athletes, our academy serves as a stepping stone towards fulfilling their dreams of playing soccer at higher levels and pursuing a career in the sport they love.',
                                image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1949&auto=format&fit=crop'
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="flex flex-col group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="mb-6 overflow-hidden rounded-lg aspect-[4/3]">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-black mb-4">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Locations */}
            <section id="our-locations" className="py-12 md:py-16 bg-black relative overflow-hidden w-full">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,210,106,0.15),transparent)] pointer-events-none z-0" />

                <div className="w-full max-w-7xl mx-auto relative z-10 px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl md:text-5xl font-black text-white font-montserrat uppercase leading-tight mb-6">
                                Our <span className="text-primary italic">Centers</span>
                            </h2>
                            <p className="text-body-lg text-white/40 font-light uppercase tracking-[0.2em]">
                                World-class facilities across Bengaluru.
                            </p>
                        </div>
                        <div className="h-[1px] flex-grow bg-white/10 mb-8 hidden lg:block mx-12"></div>
                        <div className="hidden md:block">
                            <span className="text-display text-white/5 leading-none">02</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {locations.map((location, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 group cursor-pointer flex flex-col h-full relative overflow-hidden"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors" />

                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-2xl">📍</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                                        Open
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide group-hover:text-primary transition-colors">
                                    {location.name}
                                </h3>
                                <p className="text-sm text-gray-400 mb-8 font-medium line-clamp-2">
                                    {location.address}
                                </p>

                                <div className="mt-auto w-full bg-black/40 rounded-xl p-5 border border-white/5 group-hover:border-primary/30 transition-colors">
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Days</span>
                                            <span className="text-sm font-bold text-white">{location.days}</span>
                                        </div>
                                        <div className="w-full h-[1px] bg-white/10" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Timings</span>
                                            <span className="text-sm font-bold text-white">{location.timings}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Coaches */}
            <section id="meet-the-team" className="py-12 md:py-16 bg-gray-50 w-full">
                <div className="w-full max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight mb-6">
                                Meet the <span className="text-primary italic">Academy Team</span>
                            </h2>
                        </div>
                        <div className="h-[1px] flex-grow bg-gray-200 mb-8 hidden lg:block mx-12"></div>
                        <div className="hidden md:block">
                            <span className="text-display text-black opacity-5 leading-none">03</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-24 lg:gap-x-20 lg:gap-y-32">
                        {team.map((member, index) => (
                            <motion.div
                                key={index}
                                className="group flex flex-col items-center"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="relative mb-10 w-full aspect-square max-w-[280px] overflow-hidden rounded-3xl bg-gray-200 shadow-premium group-hover:shadow-premium-hover transition-all duration-500">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-premium">
                                        <span className="text-primary text-xl">★</span>
                                    </div>
                                </div>
                                <h3 className="text-h6 text-black mb-3 uppercase tracking-tighter group-hover:text-primary transition-colors text-center w-full">
                                    {member.name}
                                </h3>
                                <p className="text-sm font-normal tracking-wide text-gray-600 group-hover:text-primary transition-colors text-center w-full">
                                    {member.role}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-12 md:py-16 bg-white w-full">
                <div className="w-full max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight mb-6">
                                Choose your <span className="text-primary italic">plan:</span>
                            </h2>
                        </div>
                        <div className="h-[1px] flex-grow bg-gray-100 mb-8 hidden lg:block mx-12"></div>
                        <div className="hidden md:block">
                            <span className="text-display text-black opacity-5 leading-none">04</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Quarterly Plan */}
                        <motion.div
                            className="relative flex flex-col bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="h-12 bg-primary/30 w-full" />
                            <div className="p-10 flex flex-col items-center text-center flex-grow pt-16">
                                <h3 className="text-xl font-bold underline mb-8">Quarterly</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-black block mb-2">Starting from INR</span>
                                    <span className="text-5xl font-black">8,999</span>
                                </div>
                                <p className="text-sm italic text-gray-500 mb-12">*Depends on location</p>
                                <div className="mt-auto w-full">
                                    <Button
                                        variant="primary"
                                        className="w-full h-14 bg-black text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-sm rounded-lg"
                                        onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Free Trial
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Semi-annually Plan */}
                        <motion.div
                            className="relative flex flex-col bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover scale-105 z-10"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="absolute -top-12 right-0 left-0 flex justify-center z-20">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary rotate-45 transform origin-center" />
                                    <div className="relative bg-primary text-black font-bold px-6 py-8 rounded-full flex items-center justify-center w-24 h-24 shadow-lg">
                                        <span className="flex flex-col items-center text-[10px] uppercase tracking-widest leading-tight">
                                            Popular
                                        </span>
                                        {/* Star shape simulation with CSS clip-path usually better, but keeping simple marker for now or using SVG icon */}
                                        <svg className="absolute inset-0 w-full h-full text-primary -z-10" viewBox="0 0 100 100" fill="currentColor">
                                            <polygon points="50 0 61 35 98 35 68 57 79 91 50 70 21 91 32 57 2 35 39 35" />
                                        </svg>
                                    </div>
                                    {/* Using a star icon from lucide/react-icons would be cleaner if available, simplified badge for now */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary rotate-45" style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }}></div>
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black font-bold text-[10px] uppercase text-center z-20">Popular</span>
                                </div>

                            </div>
                            <div className="h-16 bg-primary/30 w-full mt-4" />
                            <div className="p-10 flex flex-col items-center text-center flex-grow pt-12">
                                <h3 className="text-xl font-bold underline mb-8">Semi-annually</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-black block mb-2">Starting from INR</span>
                                    <span className="text-5xl font-black">14,999</span>
                                </div>
                                <p className="text-sm italic text-gray-500 mb-12">*Depends on location</p>
                                <div className="mt-auto w-full">
                                    <Button
                                        variant="primary"
                                        className="w-full h-14 bg-black text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-sm rounded-lg"
                                        onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Free Trial
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Annual Program */}
                        <motion.div
                            className="relative flex flex-col bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="h-12 bg-primary/30 w-full" />
                            <div className="p-10 flex flex-col items-center text-center flex-grow pt-16">
                                <h3 className="text-xl font-bold underline mb-8">Annual Program</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-black block mb-2">Starting from INR</span>
                                    <span className="text-5xl font-black">25,999</span>
                                </div>
                                <p className="text-sm italic text-gray-500 mb-12">*Depends on location</p>
                                <div className="mt-auto w-full">
                                    <Button
                                        variant="primary"
                                        className="w-full h-14 bg-black text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-sm rounded-lg"
                                        onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Free Trial
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Enrollment Section */}
            <section id="enroll-section" className="py-12 md:py-16 bg-black relative overflow-hidden px-6">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-7xl mx-auto relative z-10 px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
                        <div className="justify-self-start">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-display text-white mb-10 leading-[0.9] tracking-tight">
                                    Start Your <br />
                                    <span className="text-primary italic">Journey</span>
                                </h2>
                                <p className="text-body-lg text-white/40 font-light mb-16 leading-relaxed max-w-lg">
                                    Secure your spot for a free assessment session. Our coaches will evaluate your technical skills and recommend the best pathway.
                                </p>
                                <div className="space-y-10">
                                    {[
                                        { label: 'Trial Session', text: 'Evaluation with UEFA-Pro coaches' },
                                        { label: 'Equipment', text: 'Full training kit provided on site' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-8 items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                                <span className="text-primary font-black">0{i + 1}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-2">{item.label}</h4>
                                                <p className="text-white/40 font-light">{item.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="bg-white/[0.03] backdrop-blur-3xl p-12 rounded-[3rem] border border-white/10 shadow-glow-strong w-full"
                        >
                            <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); alert('Request Received!'); }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-8">Athlete Name</label>
                                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary/50 transition-colors" placeholder="Full Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-8">Age Group</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary/50 transition-colors appearance-none">
                                            <option className="bg-black">U-10</option>
                                            <option className="bg-black">U-14</option>
                                            <option className="bg-black">U-18</option>
                                            <option className="bg-black">Senior</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-8">Contact Email</label>
                                    <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary/50 transition-colors" placeholder="your@email.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-8">Phone Number</label>
                                    <input type="tel" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-primary/50 transition-colors" placeholder="+91 00000 00000" />
                                </div>
                                <div className="flex justify-center">
                                    <Button variant="primary" className="max-w-sm h-16 shadow-glow-strong">
                                        Submit Registration
                                    </Button>
                                </div>
                                <p className="text-center text-[10px] text-white/30 uppercase tracking-[0.2em] font-light">
                                    No credit card required for first eval.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div >
    );
};
