import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { FaMapMarkerAlt, FaClock, FaUsers, FaStar } from "react-icons/fa";

export const Arena: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <FaMapMarkerAlt />,
            title: 'Prime Locations',
            description: 'Strategically located across Bengaluru with easy access and parking facilities.'
        },
        {
            icon: <FaClock />,
            title: '24/7 Access',
            description: 'Round-the-clock availability for flexible scheduling and spontaneous play.'
        },
        {
            icon: <FaUsers />,
            title: 'Premium Facilities',
            description: 'State-of-the-art turfs with professional lighting, changing rooms, and equipment.'
        },
        {
            icon: <FaStar />,
            title: 'Professional Standard',
            description: 'FIFA-approved surfaces and amenities that meet international sports standards.'
        }
    ];

    const venues = [
        {
            name: 'Koramangala Arena',
            location: '100 Feet Road, Koramangala',
            courts: 3,
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070',
            features: ['Floodlights', 'Changing Rooms', 'Parking']
        },
        {
            name: 'Indiranagar Stadium',
            location: 'HAL 2nd Stage, Indiranagar',
            courts: 2,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076',
            features: ['Professional Turf', 'Cafeteria', 'Equipment Rental']
        },
        {
            name: 'Whitefield Complex',
            location: 'ITPL Main Road, Whitefield',
            courts: 4,
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070',
            features: ['Multiple Courts', 'Training Area', 'Shower Facilities']
        }
    ];

    const amenities = [
        { name: 'Floodlights', icon: '💡', description: 'Professional lighting for night games' },
        { name: 'Changing Rooms', icon: '🚿', description: 'Clean facilities with showers' },
        { name: 'Equipment Rental', icon: '⚽', description: 'Quality balls and gear available' },
        { name: 'Parking', icon: '🚗', description: 'Ample parking space' },
        { name: 'Cafeteria', icon: '☕', description: 'Refreshments and snacks' },
        { name: 'First Aid', icon: '🩹', description: 'Medical assistance available' }
    ];

    return (
        <div className="min-h-screen bg-white font-inter">
            {/* Sticky Navigation */}
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
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
                                className={`text-sm font-bold uppercase tracking-wider transition-colors ${window.location.pathname === item.path ? 'text-primary' : 'text-white hover:text-primary'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/login')}
                        className="font-bold bg-primary text-black hover:bg-white hover:text-black uppercase tracking-wider text-sm px-10 py-3 min-w-[150px] shadow-[0_0_15px_rgba(0,210,106,0.5)] hover:shadow-[0_0_25px_rgba(0,210,106,0.6)]"
                    >
                        Book Now
                    </Button>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-start overflow-hidden bg-black px-6 md:px-12 lg:px-32">
                {/* Background Image with Deep Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-dark-gradient z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070"
                        alt="Rush Arena"
                        className="w-full h-full object-cover opacity-60 scale-105"
                    />
                </div>

                <motion.div
                    className="relative z-20 text-left w-full max-w-7xl py-32"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="inline-flex items-center gap-3 mb-8 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-xl"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-caption text-primary uppercase tracking-[0.3em]">
                            World-Class Facilities
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="text-6xl md:text-8xl lg:text-display text-white mb-8 leading-[0.8] tracking-[-0.05em]">
                        Experience <br />
                        <span className="text-primary italic">Professional</span> Play
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg md:text-xl lg:text-body-lg text-white/60 mb-12 max-w-2xl leading-[1.8] font-light tracking-wide">
                        Discover Bengaluru's premier sports arenas. Professional-grade facilities, expert maintenance, and unforgettable experiences await.
                    </p>

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-start justify-start gap-6">
                        <Button
                            variant="primary"
                            size="lg"
                            className="text-lg px-8 py-4 min-w-[200px]"
                            onClick={() => navigate('/venues')}
                        >
                            Explore Venues
                        </Button>
                        <button
                            className="text-sm font-black text-white uppercase tracking-[0.2em] transition-all py-4 px-8 group flex items-center gap-3 border-2 border-white/20 hover:bg-white/10 hover:border-white/40 rounded-xl"
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            View Facilities
                            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </button>
                    </div>
                </motion.div>

                {/* Vertical Indicator */}
                <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-6 z-20">
                    <span className="text-[10px] font-black text-white/20 rotate-90 uppercase tracking-[0.5em] mb-12">Scroll</span>
                    <div className="w-[1px] h-20 bg-gradient-to-b from-primary to-transparent" />
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-40 bg-white w-full">
                <div className="w-full px-6 md:px-12">
                    <div className="text-center mb-24">
                        <h2 className="text-h2 text-black mb-6 leading-[1.1]">
                            Premium <span className="text-primary italic">Facilities</span>
                        </h2>
                        <p className="text-body-lg text-gray-400 font-light uppercase tracking-[0.2em]">
                            Everything you need for the perfect game.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-[1920px] mx-auto place-items-stretch">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="group relative w-full h-full flex flex-col items-center text-center p-12 rounded-[3rem] bg-gray-50 border border-transparent hover:border-gray-100 hover:shadow-premium transition-all duration-500 min-h-[300px] justify-center"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="text-5xl text-black mb-8 transform group-hover:scale-110 group-hover:text-primary transition-all duration-500">
                                    {feature.icon}
                                </div>
                                <h3 className="text-h4 text-black mb-6 uppercase tracking-wider leading-tight">
                                    {feature.title}
                                </h3>
                                <div className="h-1 w-12 bg-gray-200 mb-6 group-hover:bg-primary group-hover:w-20 transition-all duration-500 rounded-full" />
                                <p className="text-body text-gray-500 leading-relaxed font-light">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Venues Showcase */}
            <section className="py-40 bg-gray-50 w-full">
                <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-40 gap-12">
                        <div className="max-w-3xl">
                            <h2 className="text-h2 text-black mb-10 leading-[1.1]">
                                Our <span className="text-primary italic">Venues</span>
                            </h2>
                            <p className="text-body-lg text-gray-400 font-light uppercase tracking-[0.2em]">
                                Professional arenas across Bengaluru.
                            </p>
                        </div>
                        <div className="h-[1px] flex-grow bg-gray-200 mb-8 hidden lg:block mx-12"></div>
                        <div className="hidden md:block">
                            <span className="text-display text-black opacity-5 leading-none">02</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                        {venues.map((venue, index) => (
                            <motion.div
                                key={index}
                                className="bg-white rounded-3xl overflow-hidden shadow-premium hover:shadow-premium-hover transition-all duration-500 group cursor-pointer"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate('/venues')}
                            >
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={venue.image}
                                        alt={venue.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                                        {venue.rating} ⭐
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-xl font-black text-black mb-2 uppercase tracking-wider">
                                        {venue.name}
                                    </h3>
                                    <p className="text-gray-500 mb-4 text-sm">
                                        📍 {venue.location}
                                    </p>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-primary font-bold">
                                            {venue.courts} Courts Available
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {venue.features.map((feature, i) => (
                                            <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section className="py-40 bg-black relative overflow-hidden w-full">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,210,106,0.15),transparent)] pointer-events-none z-0" />

                <div className="w-full max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-40 gap-12">
                        <div className="max-w-3xl">
                            <h2 className="text-h2 text-white mb-10 leading-[1.1]">
                                Complete <span className="text-primary italic">Amenities</span>
                            </h2>
                            <p className="text-body-lg text-white/40 font-light uppercase tracking-[0.2em]">
                                Everything for your comfort and performance.
                            </p>
                        </div>
                        <div className="h-[1px] flex-grow bg-white/10 mb-8 hidden lg:block mx-12"></div>
                        <div className="hidden md:block">
                            <span className="text-display text-white/5 leading-none">03</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {amenities.map((amenity, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:bg-white/[0.05] hover:border-primary/30 transition-all duration-500 group cursor-pointer text-center"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500">
                                    {amenity.icon}
                                </div>
                                <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-2">
                                    {amenity.name}
                                </h3>
                                <p className="text-white/60 text-xs leading-relaxed">
                                    {amenity.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-40 bg-white w-full">
                <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <h2 className="text-h2 text-black mb-10 leading-[1.1]">
                            Ready to <span className="text-primary italic">Play?</span>
                        </h2>
                        <p className="text-body-lg text-gray-400 font-light mb-12 max-w-2xl mx-auto">
                            Book your court now and experience professional-grade facilities at your convenience.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => navigate('/venues')}
                                className="min-w-[200px]"
                            >
                                Book Now
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate('/academy')}
                                className="min-w-[200px]"
                            >
                                Join Academy
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};
