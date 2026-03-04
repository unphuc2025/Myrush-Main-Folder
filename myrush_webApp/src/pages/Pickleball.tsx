import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { FaCalendarCheck } from 'react-icons/fa';
import { PublicNav } from '../components/PublicNav';
import ScrollIndicator from '../components/ScrollIndicator';
import pickleballHero from '../assets/image copy.png';


const LocationCard: React.FC<{ loc: any, idx: number, navigate: any }> = ({ loc, idx, navigate }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative flex flex-col bg-white rounded-xl shadow-premium hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 h-full"
        >
            <div className="h-72 overflow-hidden relative">
                <div className="absolute inset-0 bg-gray-200" />
                <img
                    src={loc.image}
                    onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070"
                    }}
                    alt={loc.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (loc.mapUrl) window.open(loc.mapUrl, '_blank');
                    }}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 p-2 rounded-full opacity-100 transition-all duration-300 shadow-lg cursor-pointer hover:bg-white/40 z-30"
                >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-lg">
                        ↗
                    </div>
                </div>
            </div>

            <div className="p-8 flex flex-col flex-grow relative">
                <div className="mb-6 flex-grow">
                    <h3 className="text-xl font-bold text-black group-hover:text-primary transition-colors duration-300 mb-2">
                        {loc.name}
                    </h3>
                    <div className="w-12 h-1 bg-gray-100 rounded-full mb-6 group-hover:bg-primary group-hover:w-20 transition-all duration-300" />
                    
                    <div className="relative">
                        <p className={`leading-relaxed transition-all duration-300 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                            {loc.description}
                        </p>
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-primary hover:text-primary/80 font-bold text-xs uppercase tracking-widest mt-2 transition-colors inline-flex items-center gap-1 group/btn"
                        >
                            {isExpanded ? 'Read Less' : 'Read More'}
                            <span className="text-lg leading-none group-hover/btn:translate-x-0.5 transition-transform">{isExpanded ? '−' : '+'}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                        <Button
                            variant="primary"
                            className="w-full h-14 bg-black text-white font-bold uppercase tracking-widest text-sm rounded-lg shadow-lg transition-all duration-300 transform"
                            onClick={() => navigate('/venues?sport=Pickleball')}
                        >
                        Book This Venue
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export const Pickleball: React.FC = () => {
    const navigate = useNavigate();

    const locations = [
        {
            name: 'Rush Arena, Cooke Town',
            image: '/venue-assets/cooke-town.webp',
            description: "Located at the heart of East Bengaluru, our facility at Rush Arena Cooke Town is excited to introduce four state-of-the-art pickleball courts, launching in September '24. Designed with top-quality surfaces and professional lighting, our courts provide the perfect setting for both casual play and competitive matches. Whether you're a seasoned player or new to the sport, our dedicated pickleball area offers a premier experience for all enthusiasts. Join us from 6 AM to 11 PM and enjoy the thrill of the game in a welcoming and vibrant environment.",
            link: '/venues/cooke-town',
            mapUrl: 'https://maps.app.goo.gl/4e8L2MFg7EXm6Hh38'
        },
        {
            name: 'Rush Arena, Divyasree Omega, Kondapur, Hyderabad',
            image: '/venue-assets/gachibowli.webp',
            description: "Located in the bustling area of Kondapur, Rush Arena Divyasree Omega is proud to offer top-tier pickleball courts designed for enthusiasts of all levels. Our facility boasts high-quality surfaces and professional lighting, ensuring an exceptional playing experience whether you're here for a casual game or competitive play. With a welcoming atmosphere and modern amenities, Rush Arena Divyasree Omega is the perfect destination for pickleball enthusiasts in Hyderabad. Join us to experience the excitement and camaraderie of this fast-growing sport in a state-of-the-art environment.",
            link: '/venues/gachibowli',
            mapUrl: 'https://maps.app.goo.gl/vNDSnKjxMYzu3WL2A'
        },
        {
            name: 'Rush Arena Tambaram, Chennai',
            image: '/venue-assets/whitefield.webp',
            description: "Located in the lively neighborhood of Tambaram, Chennai, Rush Arena offers a premier pickleball experience. Our facility features state-of-the-art pickleball courts with top-quality surfaces and professional lighting, providing an ideal setting for players of all skill levels. Whether you're looking to enjoy a casual game or engage in competitive play, our courts are designed to deliver an exceptional experience. Rush Arena Tambaram is a welcoming and vibrant space, perfect for pickleball enthusiasts in Chennai. Join us and be part of the exciting pickleball community in the city.",
            link: '/venues/whitefield',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rush+Arena+Tambaram+Chennai'
        }
    ];

    const faqs = [
        {
            question: "What amenities are available at Rush Sports pickleball arenas?",
            answer: "Our pickleball arenas feature high-quality courts with professional lighting, ventilation, and non-slip surfacing. We also offer equipment rentals, changing rooms, and rest areas."
        },
        {
            question: "Can I host private events or tournaments at the pickleball arenas?",
            answer: "Absolutely! Our facilities are perfect for hosting private events, corporate tournaments, and parties. Contact us to book the entire arena."
        },
        {
            question: "Do I need to book a court in advance?",
            answer: "While walk-ins are welcome, we highly recommend booking a court in advance to guarantee availability, especially during peak hours. You can easily book online."
        },
        {
            question: "What are the operating hours for the pickleball arenas?",
            answer: "The operating hours vary depending on the venue. Please check specific location details or contact our customer service for accurate timing information."
        },
        {
            question: "Do I need to bring my own equipment?",
            answer: "We offer equipment rental for paddles and balls. However, you are welcome to bring your own professional gear if you prefer."
        }
    ];

    const { scrollY } = useScroll();
    const indicatorOpacity = useTransform(scrollY, [0, 300], [1, 0]);

    // Form State
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Invalid email address';
        }

        if (!formData.message.trim()) errors.message = 'Message is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmittingForm(true);

        try {
            const response = await apiClient.post('/contact/submit', {
                form_type: 'pickleball',
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: 'N/A',
                message: formData.message
            });

            if (response.data.success) {
                alert(response.data.message);
                setFormData({ firstName: '', lastName: '', email: '', message: '' });
                setFormErrors({});
            } else {
                alert('Error sending message. Please try again.');
            }
        } catch (err) {
            alert('Error sending message. Please try again.');
        } finally {
            setIsSubmittingForm(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-black">
            <PublicNav />

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={pickleballHero}
                        alt="Pickleball Action"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="relative z-10 text-center max-w-5xl mx-auto px-4 md:px-6 flex flex-col items-center">
                    <h1 className="!text-[48px] md:!text-5xl lg:!text-7xl text-white font-extrabold font-heading uppercase leading-[1.05] tracking-tighter mb-8 md:mb-12">
                        Join the <br className="block md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Pickleball Revolution</span>
                        <br className="block md:hidden" /> at <br className="hidden md:block" />Rush Arenas
                    </h1>
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1 sm:flex-none !border-2 !border-transparent text-[10px] sm:text-sm md:text-base px-2 sm:px-8 py-3 md:py-4 min-w-0 sm:min-w-[200px] uppercase tracking-wider font-heading font-bold transition-all duration-300 shadow-glow whitespace-nowrap group"
                            icon={<FaCalendarCheck className="hidden sm:inline group-hover:scale-110 transition-transform" />}
                            onClick={() => navigate('/venues?sport=Pickleball')}
                        >
                        Book a Court
                    </Button>
                </div>

                <motion.div style={{ opacity: indicatorOpacity }}>
                    <ScrollIndicator />
                </motion.div>
            </section>

            {/* Locations Section */}
            <section id="locations" className="py-12 md:py-16 bg-white">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
                    <h2 className="text-3xl md:text-5xl font-black font-heading text-black uppercase leading-tight mb-8 md:mb-12 text-center">
                        Our Locations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {locations.map((loc, idx) => (
                            <LocationCard key={idx} loc={loc} idx={idx} navigate={navigate} />
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-12 md:py-16 bg-primary/5 relative overflow-hidden">
                {/* Wavy Background Pattern - simplified with CSS/SVG or just color for now */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black font-heading text-black uppercase leading-tight mb-8 md:mb-12">
                        FAQs
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 md:gap-y-8">
                        {faqs.map((faq, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="mb-6"
                            >
                                <h4 className="text-black">
                                    {faq.question}
                                </h4>
                                <p className="text-black/70 mb-8 leading-relaxed flex-1">
                                    {faq.answer}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-12 md:py-16 bg-white">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-black font-heading text-black uppercase leading-tight mb-8 md:mb-12">
                            Get in touch.
                        </h2>
                        <p className="max-w-4xl mx-auto">
                            Got questions? We'd love to hear from you. Fill out the form below and we'll get back to you shortly.
                        </p>

                        <div className="max-w-4xl mx-auto bg-gray-50 p-10 rounded-xl shadow-sm border border-gray-100">
                            <form className="space-y-6" onSubmit={handleFormSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="text-left">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Arjun"
                                            value={formData.firstName}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^[A-Za-z\s]*$/.test(value)) {
                                                    setFormData({ ...formData, firstName: value });
                                                    if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                                                }
                                            }}
                                            className={`w-full px-4 py-3 bg-white border ${formErrors.firstName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-300`}
                                        />
                                        {formErrors.firstName && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{formErrors.firstName}</span>}
                                    </div>
                                    <div className="text-left">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sharma"
                                            value={formData.lastName}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^[A-Za-z\s]*$/.test(value)) {
                                                    setFormData({ ...formData, lastName: value });
                                                    if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                                                }
                                            }}
                                            className={`w-full px-4 py-3 bg-white border ${formErrors.lastName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-300`}
                                        />
                                        {formErrors.lastName && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{formErrors.lastName}</span>}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({ ...formData, email: e.target.value });
                                            if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                                        }}
                                        className={`w-full px-4 py-3 bg-white border ${formErrors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-300`}
                                    />
                                    {formErrors.email && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{formErrors.email}</span>}
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Tell us about your query, booking request, or anything else..."
                                        value={formData.message}
                                        onChange={(e) => {
                                            setFormData({ ...formData, message: e.target.value });
                                            if (formErrors.message) setFormErrors({ ...formErrors, message: '' });
                                        }}
                                        className={`w-full px-4 py-3 bg-white border ${formErrors.message ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-300`}
                                    />
                                    {formErrors.message && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{formErrors.message}</span>}
                                </div>
                                <div className="text-center pt-2">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        type="submit"
                                        disabled={isSubmittingForm}
                                        className="w-full md:w-auto px-12 py-5 bg-primary text-black rounded-xl uppercase tracking-[0.2em] font-black shadow-glow transition-all active:scale-95 text-lg flex items-center justify-center min-w-[200px]"
                                    >
                                        {isSubmittingForm ? (
                                            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            'Send Message'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};
