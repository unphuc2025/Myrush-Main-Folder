import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';

import { RushArena3D } from '../components/RushArena3D';
import { PublicNav } from '../components/PublicNav';
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


    const arenas = [
        { name: 'Rush Arena', url: 'https://rush-arena-bcu.talkinglands.studio/' },
        { name: 'Cooke Town', url: 'https://rush-arena-cooke-town.talkinglands.studio' },
        { name: 'GT Mall', url: 'https://rush-arena-gtmall.talkinglands.studio' },
        { name: 'Rajajinagar', url: 'https://rush-arena-rj.talkinglands.studio' }
    ];

    const [currentArena, setCurrentArena] = React.useState(arenas[0]);

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
        <div className="min-h-screen bg-black font-inter overflow-x-hidden selection:bg-primary selection:text-black relative">
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-20 pointer-events-none"></div>

            {/* Sticky Navigation */}
            <PublicNav />

            {/* HERO SECTION */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
                <motion.div style={{ y: heroY }} className="absolute inset-0 z-0 opacity-100">
                    <RushArena3D url={currentArena.url} />
                </motion.div>

                {/* Hero Overlay Gradient - REMOVED for brightness */}
                {/* <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black pointer-events-none z-10" /> */}


                {/* Arena Switcher - Top Right of Hero (below Nav) */}
                <div className="absolute top-32 right-6 z-30 flex flex-col gap-2 pointer-events-auto">
                    <div className="glass-card-dark p-3 rounded-2xl">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2 text-center">Select Arena</div>
                        <div className="flex flex-col gap-1">
                            {arenas.map((arena) => (
                                <button
                                    key={arena.name}
                                    onClick={() => setCurrentArena(arena)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 text-left ${currentArena.name === arena.name
                                        ? 'bg-primary text-black shadow-glow scale-105'
                                        : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    {arena.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


            </section>


            {/* MARQUEE STRIP */}
            <div className="bg-primary/90 backdrop-blur-md overflow-hidden py-4 z-30 relative shadow-glow-strong -rotate-1 scale-105 border-y-4 border-black mt-20">
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
            <section className="py-20 md:py-32 relative z-10">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl md:text-6xl font-black text-white font-montserrat uppercase leading-tight mb-6 drop-shadow-lg">
                            Everything <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Sport.</span>
                        </h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto font-light">
                            From casual games to professional training, we have got you covered.
                        </p>
                    </div>

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {services.map((service, i) => (
                            <motion.div
                                key={i}
                                className="glass-card-dark h-96 cursor-pointer relative overflow-hidden group rounded-3xl"
                                custom={i}
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                onClick={() => navigate(service.link)}
                            >
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                                <div className="absolute inset-0 p-8 flex flex-col justify-between z-20">
                                    <div className="flex justify-between items-start">
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl text-white border border-white/20 shadow-lg group-hover:bg-primary group-hover:text-black transition-colors duration-300">
                                            {service.icon}
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 border border-white/20">
                                            <span className="text-white text-xl">↗</span>
                                        </div>
                                    </div>

                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-3xl md:text-4xl font-black text-white font-montserrat uppercase italic mb-3 leading-tight drop-shadow-md">
                                            {service.title}
                                        </h3>
                                        <p className="text-gray-200 text-base font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
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
                            className="inline-flex items-center gap-2 text-white font-bold uppercase tracking-wider text-sm hover:text-primary transition-colors pb-2 border-b-2 border-transparent hover:border-primary"
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

            {/* FOOTER - Removed, now global */}
        </div>
    );
};
