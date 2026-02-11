import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { PublicNav } from '../components/PublicNav';

export const Pickleball: React.FC = () => {
    const navigate = useNavigate();

    const locations = [
        {
            name: 'Rush Arena, Cooke Town',
            image: '/venues/cooke-town.webp', // Placeholder, using what I can or generic
            description: 'Located in the heart of Cooke Town, our facility features 3 premium synthetic courts with pro-level lighting and amenities.',
            link: '/venues/cooke-town'
        },
        {
            name: 'Rush Arena, Gachibowli',
            image: '/venues/gachibowli.webp', // Placeholder
            description: 'Experience the best of Pickleball at our state-of-the-art facility in Gachibowli. 4 dedicated courts waiting for you.',
            link: '/venues/gachibowli'
        },
        {
            name: 'Rush Arena, Whitefield',
            image: '/venues/whitefield.webp', // Placeholder
            description: 'Premium courts in Whitefield with ample parking, changing rooms, and a cafe for your post-match relaxation.',
            link: '/venues/whitefield'
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

    return (
        <div className="min-h-screen bg-white selection:bg-primary selection:text-black">
            <PublicNav />

            {/* Hero Section */}
            <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070"
                        alt="Pickleball Action"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
                    <h1 className="text-4xl md:text-6xl font-black text-white font-montserrat uppercase leading-tight mb-8">
                        Join the <span className="text-primary">Pickleball Revolution</span> at<br />Rush Arenas
                    </h1>
                    <Button
                        variant="primary"
                        size="lg"
                        className="bg-primary text-black hover:bg-white hover:text-black text-lg px-12 py-5 uppercase tracking-wider font-montserrat font-black shadow-[0_0_20px_rgba(0,210,106,0.5)] hover:shadow-[0_0_30px_rgba(0,210,106,0.6)]"
                        onClick={() => document.getElementById('locations')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Book A Court
                    </Button>
                </div>
            </section>

            {/* Locations Section */}
            <section id="locations" className="py-12 md:py-16 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight mb-12 text-center">
                        Our Locations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {locations.map((loc, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative overflow-hidden bg-white rounded-3xl shadow-premium hover:shadow-premium-hover transition-all duration-300 flex flex-col"
                            >
                                <div className="h-64 overflow-hidden relative">
                                    {/* Fallback image if local not found, or use Unsplash */}
                                    <img
                                        src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000"
                                        alt={loc.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black text-black uppercase mb-4 font-montserrat">{loc.name}</h3>
                                    <p className="text-gray-600 mb-8 flex-1 leading-relaxed">
                                        {loc.description}
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full border-black text-black hover:bg-black hover:text-white uppercase font-bold tracking-wider py-4"
                                        onClick={() => navigate(loc.link)}
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-12 md:py-16 bg-primary relative overflow-hidden">
                {/* Wavy Background Pattern - simplified with CSS/SVG or just color for now */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight mb-12">
                        FAQs
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {faqs.map((faq, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="mb-6"
                            >
                                <h3 className="text-xl font-black text-black font-montserrat mb-3">
                                    {faq.question}
                                </h3>
                                <p className="text-black/80 font-medium leading-relaxed">
                                    {faq.answer}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-12 md:py-16 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase mb-8">
                            Get in touch.
                        </h2>
                        <p className="text-gray-600 text-lg mb-12 max-w-4xl mx-auto">
                            Got questions? We'd love to hear from you. Fill out the form below and we'll get back to you shortly.
                        </p>

                        <div className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-3xl shadow-sm border border-gray-100">
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="text-left">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="text-left">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                        required
                                    />
                                </div>
                                <div className="text-center pt-4">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="px-12 py-4 uppercase font-black tracking-widest bg-black text-white hover:bg-gray-800"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            alert('Form submitted successfully!');
                                        }}
                                    >
                                        Send
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
