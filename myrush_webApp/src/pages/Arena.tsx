import React from 'react';
import { PublicNav } from '../components/PublicNav';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import ScrollIndicator from '../components/ScrollIndicator';
import { FaMapMarkerAlt, FaClock, FaUsers, FaStar } from "react-icons/fa";
import { venuesApi } from '../api/venues';


const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070', // Soccer
    'https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=2070', // Night turf
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070', // Indoor soccer
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070', // Turf
    'https://images.unsplash.com/photo-1518605348399-f495143aeb29?q=80&w=2070', // Futsal
    'https://images.unsplash.com/photo-1555862124-a4ebae639a62?q=80&w=2070', // Cricket
];

export const Arena: React.FC = () => {
    const navigate = useNavigate();

    // --- Types ---
    interface Venue {
        id: string;
        court_name: string;
        location: string;
        game_type: string;
        prices: string;
        photos: string[];
        description: string;
        branch_name?: string;
        amenities?: Array<{
            id: string;
            name: string;
            description?: string;
            icon?: string;
            icon_url?: string;
        }>;
        rating?: number;
        reviewCount?: number;
    }

    const [venues, setVenues] = React.useState<Venue[]>([]);
    const [loading, setLoading] = React.useState(true);

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

    const amenities = [
        { name: 'Floodlights', icon: '💡', description: 'Professional lighting for night games' },
        { name: 'Changing Rooms', icon: '🚿', description: 'Clean facilities with showers' },
        { name: 'Equipment Rental', icon: '⚽', description: 'Quality balls and gear available' },
        { name: 'Parking', icon: '🚗', description: 'Ample parking space' },
        { name: 'Cafeteria', icon: '☕', description: 'Refreshments and snacks' },
        { name: 'First Aid', icon: '🩹', description: 'Medical assistance available' }
    ];

    React.useEffect(() => {
        const fetchVenues = async () => {
            try {
                // Fetch all venues (no city filter) - Professional arenas across Bengaluru
                const response = await venuesApi.getVenues();

                if (response.success && Array.isArray(response.data)) {
                    // Map API response to local Venue interface
                    const mappedVenues: Venue[] = response.data.map((v: any) => ({
                        id: v.id,
                        court_name: v.court_name,
                        location: v.location,
                        game_type: v.game_type,
                        prices: v.prices,
                        photos: v.photos || [],
                        description: v.description || '',
                        branch_name: v.branch_name,
                        amenities: v.amenities,
                        rating: v.rating || 4.8,
                        reviewCount: v.reviews || 0
                    }));

                    setVenues(mappedVenues);
                }
            } catch (err) {
                console.error("Failed to fetch venues:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVenues();
    }, []);

    const { scrollY } = useScroll();
    const indicatorOpacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-black">
            {/* Sticky Navigation */}
            {/* Sticky Navigation */}
            <PublicNav />

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-start overflow-hidden bg-black px-4 md:px-12 lg:px-32">
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
                        className="inline-flex items-center gap-3 mb-6 md:mb-8 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-xl mx-auto md:mx-0"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] md:text-sm font-bold font-heading text-primary uppercase tracking-[0.2em] whitespace-nowrap">
                            Rush Arena - Call 7624898999
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black font-heading text-white mb-8 md:mb-12 leading-[1.1] tracking-tight uppercase text-center md:text-left px-2">
                        play your <br />
                        <span className="text-primary italic">favourite sport</span> <br />
                        at a rush arena near you.
                    </h1>

                    {/* CTA Section */}
                    <div className="flex flex-row items-center justify-center md:justify-start gap-3 md:gap-6 px-4 md:px-0">
                        <Button
                            variant="primary"
                            size="lg"
                            className="bg-primary text-black hover:bg-primary-hover text-[10px] md:text-base px-2 md:px-10 py-3.5 md:py-4 flex-1 md:flex-none min-w-0 md:min-w-[200px] uppercase tracking-wider font-heading font-bold shadow-glow hover:shadow-glow-strong rounded-xl"
                            onClick={() => navigate('/venues')}
                        >
                            Explore Venues
                        </Button>
                        <button
                            className="border border-white text-white hover:border-primary text-[10px] md:text-base px-2 md:px-6 py-3 md:py-4 flex-1 md:flex-none min-w-0 uppercase tracking-wider font-heading font-black rounded-xl transition-all duration-300 group shadow-glow hover:shadow-glow-strong flex items-center justify-center gap-1.5 md:gap-3"
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            View Facilities
                            <span className="group-hover:translate-x-1 transition-transform duration-300 hidden sm:inline">→</span>
                        </button>
                    </div>
                </motion.div>

                <motion.div style={{ opacity: indicatorOpacity }}>
                    <ScrollIndicator />
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-12 md:py-16 bg-white w-full">
                <div className="w-full px-4 md:px-8">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="!text-4xl md:text-4xl font-extrabold font-heading text-black uppercase leading-tight mb-4 md:mb-6">
                            Premium <span className="text-primary italic">Facilities</span>
                        </h2>
                        <p className="text-sm md:text-lg text-gray-400 font-light uppercase tracking-[0.2em] px-4">
                            Everything you need for the perfect game.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-screen-2xl mx-auto place-items-stretch">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="group relative w-full h-full flex flex-col items-center text-center p-12 rounded-xl bg-gray-50 border border-transparent hover:border-gray-100 hover:shadow-premium active:scale-[0.98] active:bg-gray-100 transition-all duration-500 min-h-[300px] justify-center"
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
            <section className="py-12 md:py-16 bg-gray-50 w-full">
                <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="!text-4xl md:text-5xl font-black text-black font-heading uppercase leading-tight mb-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {loading ? (
                            // Loading state skeleton
                            [1, 2, 3].map((i) => (
                                <div key={i} className="bg-white h-96 animate-pulse" />
                            ))
                        ) : venues.length === 0 ? (
                            <div className="col-span-full text-center py-20">
                                <p className="text-xl text-gray-500">No venues found.</p>
                            </div>
                        ) : (
                            venues.map((venue, index) => (

                                <motion.div
                                    key={venue.id}
                                    className="bg-white overflow-hidden rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-500 group cursor-pointer flex flex-col h-full"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => navigate(`/venues/${venue.id}`)}
                                >
                                    <div className="relative h-64 overflow-hidden shrink-0">
                                        <img
                                            src={venue.photos?.[0] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
                                            alt={venue.court_name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                                            {venue.rating ? venue.rating.toFixed(1) : '4.8'} ⭐
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <h3 className="text-xl font-black text-black mb-2 uppercase tracking-wider">
                                            {venue.court_name}
                                        </h3>
                                        <p className="text-gray-500 mb-4 text-sm">
                                            📍 {venue.location}
                                        </p>
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-primary font-bold">
                                                {venue.game_type || 'Multiple Sports'}
                                            </span>
                                        </div>

                                        <div className="mt-auto">
                                            <Button
                                                variant="primary"
                                                className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/venues/${venue.id}`);
                                                }}
                                            >
                                                Book Now
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section className="py-12 md:py-16 bg-black relative overflow-hidden w-full">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,210,106,0.15),transparent)] pointer-events-none z-0" />

                <div className="w-full max-w-screen-2xl mx-auto relative z-10 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="!text-4xl md:text-5xl font-black text-white font-heading uppercase leading-tight mb-6">
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

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
                        {amenities.map((amenity, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-4 md:p-8 border border-white/10 hover:bg-white/[0.05] hover:border-primary/30 active:bg-white/10 active:scale-[0.98] transition-all duration-500 group cursor-pointer text-center flex flex-col items-center h-full"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="text-3xl md:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-500">
                                    {amenity.icon}
                                </div>
                                <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm mb-2">
                                    {amenity.name}
                                </h3>
                                <p className="text-white/60 text-[10px] md:text-xs leading-relaxed">
                                    {amenity.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA Section */}
            <section id="contact-section" className="relative bg-black overflow-hidden py-24 md:py-32 border-t border-white/10">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 -left-1/4 w-[150%] h-[150%] bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-full blur-[120px]" />
                </div>

                <div className="w-full max-w-screen-2xl mx-auto relative z-10 px-4 md:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
                        {/* Left Column: Text */}
                        <div className="w-full lg:w-5/12 relative z-20">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase">
                                    Reach Us
                                </div>
                                <h2 className="text-6xl md:text-7xl lg:text-8xl font-black font-heading leading-none mb-10 tracking-tighter text-white uppercase italic">
                                    Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">touch.</span>
                                </h2>
                                <p className="text-lg text-white/60 font-medium leading-relaxed max-w-lg">
                                    Get in touch with us at Rush Arena to experience the ultimate sports thrill!
                                    Whether you want to book a slot, inquire about private events, or have any
                                    questions, our friendly team is here to assist you.
                                </p>
                            </motion.div>
                        </div>

                        {/* Right Column: Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="w-full lg:w-6/12 relative z-20"
                        >
                            <form className="space-y-6" onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

                                if (submitBtn) {
                                    submitBtn.disabled = true;
                                    submitBtn.innerText = 'SENDING...';
                                }

                                const data = {
                                    first_name: (form.elements[0] as HTMLInputElement).value,
                                    last_name: (form.elements[1] as HTMLInputElement).value,
                                    email: (form.elements[2] as HTMLInputElement).value,
                                    message: (form.elements[3] as HTMLTextAreaElement).value,
                                };

                                try {
                                    const { apiClient } = await import('../api/client');
                                    const response = await apiClient.post('/contact/submit', {
                                        form_type: 'arena',
                                        name: `${data.first_name} ${data.last_name}`,
                                        email: data.email,
                                        phone: 'N/A', // Arena form doesn't have phone, but backend requires it
                                        message: data.message
                                    });
                                    if (response.data.success) {
                                        alert(response.data.message);
                                        form.reset();
                                    } else {
                                        alert('Message failed to send. Please try again.');
                                    }
                                } catch (err) {
                                    alert('Error sending message. Please try again.');
                                } finally {
                                    if (submitBtn) {
                                        submitBtn.disabled = false;
                                        submitBtn.innerText = 'SEND MESSAGE →';
                                    }
                                }
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="First Name (required)"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Last Name (required)"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="example@email.com"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Message</label>
                                    <textarea
                                        required
                                        rows={1}
                                        placeholder="Your message (required)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm resize-none overflow-hidden"
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = target.scrollHeight + 'px';
                                        }}
                                    />
                                </div>

                                <div className="pt-8">
                                    <button
                                        type="submit"
                                        className="w-full md:w-auto px-12 py-5 bg-primary text-black rounded-xl uppercase tracking-[0.2em] font-black shadow-glow hover:shadow-glow-strong hover:bg-white transition-all active:scale-95 text-lg"
                                    >
                                        Send Message →
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};
