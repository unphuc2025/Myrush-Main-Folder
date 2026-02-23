import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { PublicNav } from '../components/PublicNav';

export const Pickleball: React.FC = () => {

    const locations = [
        {
            name: 'Rush Arena, Cooke Town',
            image: '/venue-assets/cooke-town.webp', // Placeholder, using what I can or generic
            description: "Located at the heart of East Bengaluru, our facility at Rush Arena Cooke Town is excited to introduce four state-of-the-art pickleball courts, launching in September '24. Designed with top-quality surfaces and professional lighting, our courts provide the perfect setting for both casual play and competitive matches. Whether you're a seasoned player or new to the sport, our dedicated pickleball area offers a premier experience for all enthusiasts. Join us from 6 AM to 11 PM and enjoy the thrill of the game in a welcoming and vibrant environment.",
            link: '/venues/cooke-town'
        },
        {
            name: 'Rush Arena, Divyasree Omega, Kondapur, Hyderabad',
            image: '/venue-assets/gachibowli.webp', // Placeholder
            description: "Located in the bustling area of Kondapur, Rush Arena Divyasree Omega is proud to offer top-tier pickleball courts designed for enthusiasts of all levels. Our facility boasts high-quality surfaces and professional lighting, ensuring an exceptional playing experience whether you're here for a casual game or competitive play. With a welcoming atmosphere and modern amenities, Rush Arena Divyasree Omega is the perfect destination for pickleball enthusiasts in Hyderabad. Join us to experience the excitement and camaraderie of this fast-growing sport in a state-of-the-art environment.",
            link: '/venues/gachibowli'
        },
        {
            name: 'Rush Arena Tambaram, Chennai',
            image: '/venue-assets/whitefield.webp', // Placeholder
            description: "Located in the lively neighborhood of Tambaram, Chennai, Rush Arena offers a premier pickleball experience. Our facility features state-of-the-art pickleball courts with top-quality surfaces and professional lighting, providing an ideal setting for players of all skill levels. Whether you're looking to enjoy a casual game or engage in competitive play, our courts are designed to deliver an exceptional experience. Rush Arena Tambaram is a welcoming and vibrant space, perfect for pickleball enthusiasts in Chennai. Join us and be part of the exciting pickleball community in the city.",
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
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white font-outfit uppercase leading-tight mb-8">
                        Join the <span className="text-primary">Pickleball Revolution</span> at<br />Rush Arenas
                    </h1>
                    <Button
                        variant="primary"
                        size="lg"
                        className="bg-primary text-black hover:bg-primary-hover text-lg px-12 py-5 uppercase tracking-wider font-outfit font-extrabold shadow-[0_0_20px_rgba(0,210,106,0.5)] hover:shadow-[0_0_30px_rgba(0,210,106,0.6)]"
                        onClick={() => document.getElementById('locations')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Book A Court
                    </Button>
                </div>
            </section>

            {/* Locations Section */}
            <section id="locations" className="py-12 md:py-16 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-black font-outfit uppercase leading-tight mb-12 text-center">
                        Our Locations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {locations.map((loc, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative flex flex-col bg-white rounded-[2rem] shadow-premium hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100"
                            >
                                <div className="h-72 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                    <img
                                        src={loc.image}
                                        onError={(e) => {
                                            // Fallback if image fails to load
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070"
                                        }}
                                        alt={loc.name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                                    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-lg">
                                            ↗
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-grow relative">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-extrabold text-black uppercase font-outfit leading-tight mb-4 group-hover:text-primary transition-colors duration-300">
                                            {loc.name}
                                        </h3>
                                        <div className="w-12 h-1 bg-gray-100 rounded-full mb-6 group-hover:bg-primary group-hover:w-20 transition-all duration-300" />
                                        <p className="text-gray-600 leading-relaxed text-sm md:text-base font-medium">
                                            {loc.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-gray-100">
                                        <Button
                                            variant="primary"
                                            className="w-full h-14 bg-black text-white hover:bg-primary hover:text-black font-bold uppercase tracking-widest text-sm rounded-xl shadow-lg hover:shadow-primary/50 transition-all duration-300 transform group-hover:-translate-y-1"
                                        >
                                            Book This Venue
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-12 md:py-16 bg-primary/5 relative overflow-hidden">
                {/* Wavy Background Pattern - simplified with CSS/SVG or just color for now */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-black font-outfit uppercase leading-tight mb-12">
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
                                <h3 className="text-xl font-extrabold text-black font-outfit mb-3">
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
                        <h2 className="text-2xl md:text-4xl font-extrabold text-black font-outfit uppercase mb-8">
                            Get in touch.
                        </h2>
                        <p className="text-gray-600 text-lg mb-12 max-w-4xl mx-auto">
                            Got questions? We'd love to hear from you. Fill out the form below and we'll get back to you shortly.
                        </p>

                        <div className="max-w-4xl mx-auto bg-gray-50 p-10 rounded-3xl shadow-sm border border-gray-100">
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="text-left">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Arjun"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                            required
                                        />
                                    </div>
                                    <div className="text-left">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sharma"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                        required
                                    />
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Tell us about your query, booking request, or anything else..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-300"
                                        required
                                    />
                                </div>
                                <div className="text-center pt-2">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full py-4 uppercase font-extrabold tracking-widest bg-black text-white hover:bg-primary hover:text-black transition-all duration-300 font-outfit"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            alert('Form submitted successfully!');
                                        }}
                                    >
                                        Send Message
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
