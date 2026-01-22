import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { FaInstagram, FaYoutube, FaLinkedin, FaTwitter, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
// import { Card } from '../components/ui/Card';

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
        x: [0, -1000],
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

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    // const headersOpacity = useTransform(scrollY, [0, 100], [0, 1]);
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const { isAuthenticated } = useAuth();

    const services = [
        {
            title: 'Rush Arena',
            description: 'World-class facilities across 9 centers. Premium turfs, lighting, and amenities.',
            icon: '🏟️',
            image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070',
            link: '/venues',
            colSpan: 'md:col-span-2'
        },
        {
            title: 'Academy',
            description: "Bengaluru's fastest-growing football academy. Train with the best.",
            icon: '🎓',
            image: 'https://images.unsplash.com/photo-1624880357913-a8539238245b?q=80&w=2070',
            link: '/academy',
            colSpan: 'md:col-span-1'
        },
        {
            title: 'Tournaments',
            description: 'Compete in high-stakes leagues and tournaments.',
            icon: '🏆',
            image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2086',
            link: '/dashboard',
            colSpan: 'md:col-span-1'
        },
        {
            title: 'Corporate',
            description: 'Team building and sports events for businesses.',
            icon: '🤝',
            image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070',
            link: '/dashboard',
            colSpan: 'md:col-span-2'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-inter overflow-x-hidden selection:bg-primary selection:text-black">
            {/* Sticky Navigation */}
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                        <img src="/Rush-logo.webp" alt="Rush" className="h-32 md:h-40 w-auto" />
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {[
                            { label: 'Home', path: '/' },
                            { label: 'Academy', path: '/academy' },
                            { label: 'Arena', path: '/arena' },
                            { label: 'Corporate', path: '/corporate' },
                            { label: 'Events', path: '/dashboard' }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className="text-sm font-bold text-white hover:text-primary uppercase tracking-wider transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {isAuthenticated ? (
                        // Profile icon for authenticated users
                        <button
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all hover:shadow-lg"
                            onClick={() => navigate('/profile')}
                            title="Go to Profile"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </button>
                    ) : (
                        // Login/Signup button for unauthenticated users
                        <Button
                            variant="primary"
                            onClick={() => navigate('/login')}
                            className="font-bold bg-primary text-black hover:bg-white hover:text-black uppercase tracking-wider text-sm px-10 py-3 min-w-[150px] shadow-[0_0_15px_rgba(0,210,106,0.5)] hover:shadow-[0_0_25px_rgba(0,210,106,0.6)]"
                        >
                            Login/Signup
                        </Button>
                    )}
                </div>
            </motion.nav>

            {/* HERO SECTION */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
                <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2035"
                        alt="Hero"
                        className="w-full h-full object-cover opacity-60"
                    />
                </motion.div>

                <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase"
                    >
                        The Ultimate Sports Platform
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-7xl font-black font-montserrat tracking-tighter text-white mb-8 uppercase leading-none"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Play <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Like</span><br />
                        A Pro
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-6"
                    >
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/venues')}
                            className="bg-primary text-black hover:bg-white hover:text-black text-lg px-12 py-5 uppercase tracking-wider font-montserrat font-black shadow-[0_0_20px_rgba(0,210,106,0.5)] hover:shadow-[0_0_30px_rgba(0,210,106,0.6)]"
                        >
                            Book a Court
                        </Button>
                        <Button
                            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black text-lg px-12 py-5 min-w-[240px] uppercase tracking-wider font-montserrat font-black rounded-full transition-all duration-300 flex items-center justify-center gap-3 group"
                        >
                            Explore Venues <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* MARQUEE STRIP */}
            <div className="bg-primary overflow-hidden py-4 z-30 relative shadow-glow -rotate-1 scale-105 border-y-4 border-black mt-20">
                <motion.div
                    className="flex whitespace-nowrap"
                    variants={marqueeVariants}
                    animate="animate"
                >
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-black font-black text-3xl mx-8 uppercase font-montserrat italic tracking-tighter flex items-center gap-4">
                            RUSH ARENA • ACADEMY • TOURNAMENTS • CORPORATE •
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* SERVICES GRID */}
            <section className="py-20 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight mb-6">
                            Everything <span className="text-primary">Sport.</span>
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            From casual games to professional training, we have got you covered.
                        </p>
                    </div>

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {services.map((service, i) => (
                            <motion.div
                                key={i}
                                className="group relative overflow-hidden rounded-3xl bg-black h-96 shadow-2xl cursor-pointer"
                                custom={i}
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                onClick={() => navigate(service.link)}
                            >
                                <div className="absolute inset-0">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl text-white border border-white/20">
                                            {service.icon}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg font-bold text-lg">
                                            ↗
                                        </div>
                                    </div>

                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-2xl md:text-3xl font-black text-white font-montserrat uppercase italic mb-3 leading-tight">
                                            {service.title}
                                        </h3>
                                        <p className="text-white text-base font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                            {service.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/venues')}
                            className="inline-flex items-center gap-2 text-black font-bold uppercase tracking-wider text-sm hover:text-primary transition-colors pb-2 border-b-2 border-transparent hover:border-primary"
                        >
                            View All Facilities
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* CLIENTS SECTION */}
            <section className="py-20 md:py-32 bg-gray-50 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12 text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center"
                    >
                        <h3 className="text-2xl md:text-4xl font-black text-black font-montserrat uppercase tracking-tight mb-4">
                            Trusted by <span className="text-primary">Industry Leaders</span>
                        </h3>
                        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                            Partnering with the world's most innovative companies to elevate sports culture.
                        </p>
                    </motion.div>
                </div>

                {/* Gradient Masks for Premium Feel */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

                <div className="flex flex-col gap-16 relative z-10 w-full">
                    {/* Row 1: Scrolling Left */}
                    <motion.div
                        className="flex gap-20 items-center px-10 min-w-max"
                        animate={{ x: [0, -2000] }}
                        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
                    >
                        {[...Array(4)].map((_, setIndex) => (
                            [
                                { name: 'WeWork', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/2d0b91a9-133a-49ba-b4d9-66daa96deb3b/we_avatar_qr.bca8f0cdca8104e6ac293e4b95862f8c.png?format=300w' },
                                { name: 'Amazon', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/a3016f65-d5c7-4462-80d7-377435224838/Amazon-logo-meaning.jpg?format=500w' },
                                { name: 'AIFF', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/5a575ade-272e-4e66-a038-641d381953fd/All_India_Football_Federation_logo.png' },
                                { name: 'Kotak', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/d338c19b-08f1-490c-8d2a-583817365eed/1200px-Kotak_Mutual_Fund_logo.svg+%282%29.png' },
                                { name: 'Hosachiguru', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/93e041cc-f9c3-4965-a3b6-0203a31f936d/Hosachiguru.png' },
                            ].map((client, i) => (
                                <div key={`row1-${setIndex}-${i}`} className="opacity-80 hover:opacity-100 transition-opacity duration-300">
                                    <img
                                        src={client.logo}
                                        alt={client.name}
                                        className="h-16 w-auto object-contain mix-blend-multiply transition-all duration-300"
                                    />
                                </div>
                            ))
                        ))}
                    </motion.div>

                    {/* Row 2: Scrolling Right */}
                    <motion.div
                        className="flex gap-20 items-center px-10 min-w-max"
                        initial={{ x: -2000 }}
                        animate={{ x: 0 }}
                        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
                    >
                        {[...Array(4)].map((_, setIndex) => (
                            [
                                { name: 'Bengaluru FC', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/d742993b-fd42-424b-986d-291fb798d44a/Bengaluru_FC_logo.svg+%281%29.png' },
                                { name: 'SILA', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/d2c6d315-f797-4251-a279-4b3c59d3740d/SILA+Logo+Grey.png' },
                                { name: 'Applied', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/afe2353e-b057-435f-b0f4-026b5145efe7/Appliedlogo_blue_102021%5B1953674%5D.png' },
                                { name: 'Torpedoes', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/628119dc-b0cd-43f0-b35b-bbad924c35c3/Bengaluru_Torpedoes_pvl_team_logo-2.png' },
                            ].map((client, i) => (
                                <div key={`row2-${setIndex}-${i}`} className="opacity-80 hover:opacity-100 transition-opacity duration-300">
                                    <img
                                        src={client.logo}
                                        alt={client.name}
                                        className="h-16 w-auto object-contain mix-blend-multiply transition-all duration-300"
                                    />
                                </div>
                            ))
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* UNCOUCH CTA */}
            <section className="py-100 bg-black text-center px-4 relative overflow-hidden flex flex-col justify-center items-center min-h-[70vh]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
                <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center">
                    <motion.h2
                        className="text-6xl md:text-9xl font-black text-white font-montserrat italic mb-8 leading-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        UNCOUCH.
                    </motion.h2>
                    <p className="text-gray-400 text-2xl md:text-3xl mb-12 font-light max-w-4xl mx-auto leading-relaxed text-center">
                        Stop watching from the sidelines.<br />
                        <span className="text-white font-medium">Start playing today. Join thousands of players in the Rush community today.</span>
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        className="text-2xl px-16 py-8 min-w-[320px] rounded-full font-black shadow-glow hover:scale-105 transition-transform"
                        onClick={() => navigate('/login')}
                    >
                        Join the Movement
                    </Button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-black border-t border-white/10 py-20 md:py-32 w-full px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-white">
                        <div className="col-span-1 md:col-span-2">
                            <img src="/Rush-logo.webp" alt="Rush" className="h-20 mb-6 object-contain" />
                            <p className="max-w-xl mb-8 text-base leading-relaxed text-white">
                                The premier destination for sports enthusiasts. Book world-class venues, join elite academies, and compete in high-stakes tournaments.
                            </p>
                            <div className="flex gap-6">
                                <a href="#" className="text-white hover:text-primary transition-colors transform hover:scale-110 duration-200">
                                    <FaInstagram size={20} />
                                </a>
                                <a href="#" className="text-white hover:text-red-500 transition-colors transform hover:scale-110 duration-200">
                                    <FaYoutube size={20} />
                                </a>
                                <a href="#" className="text-white hover:text-blue-500 transition-colors transform hover:scale-110 duration-200">
                                    <FaLinkedin size={20} />
                                </a>
                                <a href="#" className="text-white hover:text-blue-400 transition-colors transform hover:scale-110 duration-200">
                                    <FaTwitter size={20} />
                                </a>
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <h4 className="text-white font-bold uppercase tracking-wider mb-8 text-lg">Explore</h4>
                            <ul className="space-y-4 text-base">
                                {['Academy', 'Arena', 'Corporate', 'Tournaments', 'Events', 'Careers'].map(item => (
                                    <li key={item}><a href="#" className="hover:text-primary transition-colors block text-white">{item}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <h4 className="text-white font-bold uppercase tracking-wider mb-8 text-lg">Contact</h4>
                            <p className="mb-4 text-base leading-relaxed text-white"># 643/2, 12th Main Rd,<br />Rajajinagar, Bengaluru</p>
                            <p className="mb-4 hover:text-primary cursor-pointer transition-colors text-white">harsha@myrush.in</p>
                            <p className="text-white font-bold text-xl">+91 7624898999</p>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white">
                        <p className="font-medium tracking-wide">© 2026 Addrush Sports Private Limited.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <a href="#" className="hover:text-gray-400 transition-colors uppercase tracking-wider font-medium">Privacy Policy</a>
                            <a href="#" className="hover:text-gray-400 transition-colors uppercase tracking-wider font-medium">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
