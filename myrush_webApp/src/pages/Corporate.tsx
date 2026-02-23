import React from 'react';
import { PublicNav } from '../components/PublicNav';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';


export const Corporate: React.FC = () => {

    const services = [
        {
            image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076',
            title: 'Corporate Tournaments',
            description: 'Organized competitive events that bring teams together in friendly rivalries.'
        },
        {
            image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070',
            title: 'Sports Days and Retreats',
            description: 'Full-day sports activities and team-building retreats for memorable experiences.'
        },
        {
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070',
            title: 'Wellness Challenges',
            description: 'Health-focused programs promoting physical fitness and mental well-being.'
        },
        {
            image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070',
            title: 'Sports Clinics and Workshops',
            description: 'Expert-led training sessions and skill development workshops.'
        },
        {
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070',
            title: 'Merchandising Opportunities',
            description: 'Branded sports merchandise and team apparel customization.'
        }
    ];

    const benefits = [
        {
            title: 'Team Building Redefined',
            description: 'Our sports programs go beyond typical team-building exercises. Engaging in friendly competition and sports challenges helps break down barriers, strengthen bonds, and create a cohesive team environment.',
            image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1000' // Runner/Athlete
        },
        {
            title: 'Work-Life Balance',
            description: 'Encouraging employees to participate in sports activities not only promotes physical health but also supports mental well-being. It offers a refreshing break from daily work routines and fosters a positive work-life balance.',
            image: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=1000' // Nature/Free
        },
        {
            title: 'Increased Productivity',
            description: 'Studies show that physically active employees tend to be more focused, energized, and productive. By incorporating sports into your corporate engagement strategy, you can boost employee motivation and drive overall efficiency.',
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000' // Office
        },
        {
            title: 'Enhanced Leadership Skills',
            description: 'Sports engagement provides opportunities for individuals to showcase leadership qualities, nurturing potential leaders within the team.',
            image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1000' // Sports action
        },
        {
            title: 'Improved Communication Skills',
            description: 'Through sports, employees learn to communicate effectively on and off the field, enhancing teamwork and problem-solving abilities.',
            image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000' // Discussion/Classroom like
        },
        {
            title: 'Stress Relief and Well-being',
            description: 'Engaging in physical activities helps reduce stress, anxiety, and burnout, leading to healthier and more focused employees.',
            image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000' // Badminton/Stress relief
        }
    ];

    // ... (keep intervening code) ...

    {/* Benefits Section */ }
    <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
                <h2 className="text-2xl md:text-4xl font-extrabold text-black font-outfit uppercase leading-tight mb-6">
                    Why Choose Sports Engagement for Your Team?
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => (
                    <motion.div
                        key={index}
                        className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="h-64 overflow-hidden">
                            <img
                                src={benefit.image}
                                alt={benefit.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-black text-black mb-4 uppercase tracking-wider">
                                {benefit.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
    const packages = [
        {
            name: 'Team Building Package',
            duration: 'Half Day',
            features: ['Sports Activities', 'Professional Facilitation', 'Equipment & Safety', 'Refreshments'],
            price: '₹15,000'
        },
        {
            name: 'Corporate Tournament',
            duration: 'Full Day',
            features: ['Multiple Sports', 'Custom Brackets', 'Live Scoring', 'Awards Ceremony'],
            price: '₹50,000'
        },
        {
            name: 'Executive Retreat',
            duration: '2 Days',
            features: ['Leadership Workshops', 'Team Challenges', 'Accommodation', 'Custom Activities'],
            price: '₹1,25,000'
        }
    ];

    return (
        <div className="min-h-screen bg-white font-inter selection:bg-primary selection:text-black">
            {/* Sticky Navigation */}
            {/* Sticky Navigation */}
            <PublicNav />

            {/* Hero Section */}
            <section className="relative h-[75vh] min-h-[600px] flex items-center justify-start overflow-hidden bg-black px-6 md:px-12 lg:px-32">
                {/* Background Image with Deep Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    <img
                        src="/Cooredinatepage.png"
                        alt="Corporate Events"
                        className="w-full h-full object-cover opacity-70 scale-100"
                    />
                </div>

                <motion.div
                    className="relative z-20 text-left w-full max-w-5xl py-32"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="inline-flex items-center gap-3 mb-8 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-xl"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] font-outfit">
                            Corporate Excellence
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="text-3xl md:text-5xl lg:text-7xl text-white mb-8 leading-[1.05] tracking-tight font-extrabold font-outfit uppercase">
                        Empower <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Your Team</span><br />
                        Through Sports
                    </h1>

                    <p className="text-white/70 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-light">
                        Elevate productivity, foster collaboration, and build lasting bonds with our bespoke corporate sports engagement solutions.
                    </p>

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-start justify-start gap-6">
                        <Button
                            variant="primary"
                            size="lg"
                            className="bg-primary text-black hover:bg-primary-hover text-lg px-12 py-5 uppercase tracking-wider font-outfit font-black shadow-glow hover:shadow-glow-strong rounded-xl"
                            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Enquire Now
                        </Button>
                        <button
                            className="border-white text-white hover:border-primary text-base px-8 py-5 min-w-[200px] uppercase tracking-wider font-montserrat font-black rounded-xl transition-all duration-300 group flex items-center justify-center gap-3 border-2 hover:bg-white/5 shadow-glow hover:shadow-glow-strong"
                            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            View Services
                            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </button>
                    </div>
                </motion.div>

                {/* Vertical Indicator */}
                <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-6 z-20">
                    <span className="text-[10px] font-extrabold font-outfit text-white/20 rotate-90 uppercase tracking-[0.5em] mb-12">Scroll</span>
                    <div className="w-[1px] h-20 bg-gradient-to-b from-primary to-transparent" />
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-20 text-center">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                        >
                            Our Expertise
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl font-extrabold text-black font-outfit uppercase leading-none mb-8">
                            Premium <span className="text-primary italic">Services</span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                            Comprehensive sports solutions designed to transform your corporate culture through activity and engagement.
                        </p>
                    </div>

                    {/* Attractive Card Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
                        {/* Large featured card */}
                        <motion.div
                            className="group relative overflow-hidden rounded-[2.5rem] bg-gray-50 shadow-premium hover:shadow-premium-hover transition-all duration-700 md:col-span-12 lg:col-span-8 border border-gray-100"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="grid md:grid-cols-2 h-full">
                                <div className="relative h-72 md:h-full overflow-hidden">
                                    <img
                                        src={services[0].image}
                                        alt={services[0].title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                                </div>
                                <div className="p-10 flex flex-col justify-center">
                                    <h3 className="text-3xl md:text-4xl font-black text-black mb-6 leading-tight font-outfit uppercase">
                                        {services[0].title}
                                    </h3>
                                    <p className="text-gray-500 text-lg leading-relaxed">
                                        {services[0].description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Medium card */}
                        <motion.div
                            className="group relative overflow-hidden rounded-[2.5rem] bg-black text-white shadow-premium hover:shadow-premium-hover transition-all duration-700 md:col-span-6 lg:col-span-4 border border-white/5"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={services[1].image}
                                    alt={services[1].title}
                                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            </div>
                            <div className="p-10">
                                <h3 className="text-2xl font-black text-white mb-4 leading-tight font-outfit uppercase">
                                    {services[1].title}
                                </h3>
                                <p className="text-white/60 text-base leading-relaxed mb-6">
                                    {services[1].description}
                                </p>
                            </div>
                        </motion.div>

                        {/* Row of cards */}
                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {services.slice(2).map((service, idx) => (
                                <motion.div
                                    key={idx}
                                    className="group relative overflow-hidden rounded-[2rem] bg-gray-50 shadow-premium hover:shadow-premium-hover transition-all duration-500 border border-gray-100 flex flex-col"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        <img
                                            src={service.image}
                                            alt={service.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="p-8">
                                        <h3 className="text-xl font-black text-black mb-4 leading-tight font-outfit uppercase tracking-tight">
                                            {service.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            {service.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 md:py-32 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div className="max-w-3xl">
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                            >
                                Value Proposition
                            </motion.span>
                            <h2 className="text-4xl md:text-6xl font-black text-black font-outfit uppercase leading-none">
                                Why Choose <span className="text-primary italic">MyRush?</span>
                            </h2>
                        </div>
                        <p className="text-gray-500 text-lg max-w-sm font-light">
                            We don't just organize sports; we build stronger, healthier, and more connected teams.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                className="group relative overflow-hidden bg-white rounded-[2rem] shadow-premium hover:shadow-premium-hover transition-all duration-500 flex flex-col h-full border border-gray-100"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="h-56 overflow-hidden shrink-0 relative">
                                    <img
                                        src={benefit.image}
                                        alt={benefit.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                </div>
                                <div className="p-10 text-left flex-1 flex flex-col bg-white">
                                    <h3 className="text-xl font-black text-black mb-4 uppercase tracking-tight font-outfit">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed font-light">
                                        {benefit.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages Section */}
            <section className="py-24 md:py-32 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,210,106,0.1),transparent)] pointer-events-none z-0" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                        >
                            Pricing Models
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl font-black text-white font-outfit uppercase leading-none mb-8">
                            Curated <span className="text-primary italic">Packages</span>
                        </h2>
                        <p className="text-white/40 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                            Bespoke investment options designed to align with your corporate goals and ensure maximum ROI on human capital.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {packages.map((pkg, index) => (
                            <motion.div
                                key={index}
                                className={`relative rounded-[2.5rem] p-10 transition-all duration-500 flex flex-col ${index === 1
                                    ? 'bg-primary border-4 border-primary shadow-[0_40px_80px_-15px_rgba(0,210,106,0.4)] scale-105 z-10'
                                    : 'bg-white/5 backdrop-blur-3xl border border-white/10 hover:border-primary/40'
                                    }`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {index === 1 && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2.5 rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <div className="text-center mb-10">
                                    <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight font-outfit ${index === 1 ? 'text-black' : 'text-white'}`}>
                                        {pkg.name}
                                    </h3>
                                    <p className={`font-bold text-sm tracking-widest uppercase ${index === 1 ? 'text-black/60' : 'text-primary'}`}>
                                        {pkg.duration}
                                    </p>
                                </div>

                                <div className="mb-12 flex-1">
                                    <ul className="space-y-4">
                                        {pkg.features.map((feature, i) => (
                                            <li key={i} className={`flex items-center gap-4 ${index === 1 ? 'text-black/80' : 'text-white/70'}`}>
                                                <span className={`text-lg ${index === 1 ? 'text-black' : 'text-primary'}`}>★</span>
                                                <span className="text-sm font-medium">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="text-center">
                                    <div className={`text-4xl font-black mb-8 font-outfit ${index === 1 ? 'text-black' : 'text-white'}`}>
                                        {pkg.price}
                                    </div>
                                    <Button
                                        variant={index === 1 ? 'secondary' : 'primary'}
                                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-none ${index === 1
                                            ? 'bg-black text-white hover:bg-black/90'
                                            : ''
                                            }`}
                                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Enquire Now
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Section */}
            <section className="py-24 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                        >
                            Visual Experience
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl font-black text-black font-outfit uppercase leading-none mb-8">
                            Sports <span className="text-primary italic">In Action</span>
                        </h2>
                    </div>
                    <motion.div
                        className="aspect-video bg-gray-100 rounded-[3rem] overflow-hidden shadow-2xl relative group cursor-pointer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <img
                            src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2074"
                            alt="Video Placeholder"
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-black text-3xl shadow-glow animate-pulse">
                                ▶
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-24 md:py-32 bg-gray-50 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-black mb-8 font-outfit uppercase leading-none">
                        Stay <span className="text-primary italic">Connected</span>
                    </h2>
                    <p className="text-gray-500 text-lg mb-12 font-light">
                        Join our exclusive corporate circle and receive insights on team wellness and sports management.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your work email"
                            className="w-full px-8 py-5 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-lg"
                        />
                        <Button variant="primary" className="px-10 py-5 rounded-2xl w-full sm:w-auto">
                            Join Now
                        </Button>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-24 md:py-40 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div>
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                            >
                                Start a Conversation
                            </motion.span>
                            <h2 className="text-5xl md:text-7xl font-black text-black mb-10 leading-none font-outfit uppercase">
                                Let's <span className="text-primary italic">Talk</span> Business
                            </h2>
                            <p className="text-gray-500 text-xl mb-12 font-light leading-relaxed">
                                Our bespoke programs are tailored to your unique workforce. Let us find the perfect balance of competition and collaboration for your team.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl">☏</div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Call Us</p>
                                        <p className="text-xl font-bold text-black font-outfit">+91 99000 00000</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl">✉</div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Email Us</p>
                                        <p className="text-xl font-bold text-black font-outfit">corporate@myrush.in</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-10 md:p-14 rounded-[3rem] shadow-premium border border-gray-100 relative">
                            <form className="space-y-8 text-left relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">First Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-white border border-gray-100 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-300"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Last Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-white border border-gray-100 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-300"
                                            placeholder="Doe"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Work Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-6 py-4 bg-white border border-gray-100 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-300"
                                            placeholder="john@company.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Message</label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-6 py-4 bg-white border border-gray-100 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-300 resize-none"
                                            placeholder="Tell us about your requirements..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full rounded-2xl py-5 font-black uppercase tracking-widest shadow-glow"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            alert('Thanks! We will be in touch shortly.');
                                        }}
                                    >
                                        Submit Request
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
