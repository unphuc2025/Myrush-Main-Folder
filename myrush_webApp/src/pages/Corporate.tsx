import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { FaHandshake, FaUsers, FaTrophy, FaCalendarAlt } from "react-icons/fa";

export const Corporate: React.FC = () => {
    const navigate = useNavigate();

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
            icon: '🤝'
        },
        {
            title: 'Work-Life Balance',
            description: 'Encouraging employees to participate in sports activities not only promotes physical health but also supports mental well-being. It offers a refreshing break from daily work routines and fosters a positive work-life balance.',
            icon: '⚖️'
        },
        {
            title: 'Increased Productivity',
            description: 'Studies show that physically active employees tend to be more focused, energized, and productive. By incorporating sports into your corporate engagement strategy, you can boost employee motivation and drive overall efficiency.',
            icon: '📈'
        },
        {
            title: 'Enhanced Leadership Skills',
            description: 'Sports engagement provides opportunities for individuals to showcase leadership qualities, nurturing potential leaders within the team.',
            icon: '👑'
        },
        {
            title: 'Improved Communication Skills',
            description: 'Through sports, employees learn to communicate effectively on and off the field, enhancing teamwork and problem-solving abilities.',
            icon: '💬'
        },
        {
            title: 'Stress Relief and Well-being',
            description: 'Engaging in physical activities helps reduce stress, anxiety, and burnout, leading to healthier and more focused employees.',
            icon: '😌'
        }
    ];

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
                        src="/Cooredinatepage.png"
                        alt="Corporate Events"
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
                            Corporate Solutions
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl text-white mb-8 leading-[1.1] tracking-[-0.02em] font-black">
                        Unleash Team Spirit and Boost Productivity with Our Dynamic Sports Programs
                    </h1>

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-start justify-start gap-6 mt-12">
                        <Button
                            variant="primary"
                            size="lg"
                            className="text-lg px-8 py-4 min-w-[200px]"
                            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Enquire Now
                        </Button>
                    </div>
                </motion.div>

                {/* Vertical Indicator */}
                <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-6 z-20">
                    <span className="text-[10px] font-black text-white/20 rotate-90 uppercase tracking-[0.5em] mb-12">Scroll</span>
                    <div className="w-[1px] h-20 bg-gradient-to-b from-primary to-transparent" />
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight mb-6">
                            Corporate <span className="text-primary">Services</span>
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Comprehensive solutions for your business needs, from team building to large-scale corporate events.
                        </p>
                    </div>

                    {/* Attractive Card Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mb-16">
                        {/* Large featured card */}
                        <motion.div
                            className="group relative overflow-hidden rounded-3xl bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-500 md:col-span-8"
                            custom={0}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: (i: number) => ({
                                    opacity: 1,
                                    y: 0,
                                    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
                                })
                            }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                        >
                            <div className="relative h-64 md:h-80 overflow-hidden">
                                <img
                                    src={services[0].image}
                                    alt={services[0].title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            </div>
                            <div className="p-8">
                                <h3 className="text-3xl md:text-4xl font-black text-black mb-4 leading-tight">
                                    {services[0].title}
                                </h3>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    {services[0].description}
                                </p>
                            </div>
                        </motion.div>

                        {/* Medium card */}
                        <motion.div
                            className="group relative overflow-hidden rounded-3xl bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-500 md:col-span-4"
                            custom={1}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: (i: number) => ({
                                    opacity: 1,
                                    y: 0,
                                    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
                                })
                            }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                        >
                            <div className="relative h-48 md:h-64 overflow-hidden">
                                <img
                                    src={services[1].image}
                                    alt={services[1].title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl md:text-2xl font-black text-black mb-3 leading-tight">
                                    {services[1].title}
                                </h3>
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                    {services[1].description}
                                </p>
                            </div>
                        </motion.div>

                        {/* Small cards row */}
                        <motion.div
                            className="group relative overflow-hidden rounded-3xl bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-500 md:col-span-4"
                            custom={2}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: (i: number) => ({
                                    opacity: 1,
                                    y: 0,
                                    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
                                })
                            }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={services[2].image}
                                    alt={services[2].title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-black text-black mb-3 leading-tight">
                                    {services[2].title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {services[2].description}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="group relative overflow-hidden rounded-3xl bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-500 md:col-span-4"
                            custom={3}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: (i: number) => ({
                                    opacity: 1,
                                    y: 0,
                                    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
                                })
                            }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={services[3].image}
                                    alt={services[3].title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-black text-black mb-3 leading-tight">
                                    {services[3].title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {services[3].description}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="group relative overflow-hidden rounded-3xl bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-500 md:col-span-4"
                            custom={4}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: (i: number) => ({
                                    opacity: 1,
                                    y: 0,
                                    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
                                })
                            }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={services[4].image}
                                    alt={services[4].title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-black text-black mb-3 leading-tight">
                                    {services[4].title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {services[4].description}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 md:py-32 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-black font-montserrat uppercase leading-tight mb-6">
                            Why Choose Sports Engagement for Your Team?
                        </h2>
                        <div className="text-center mb-12">
                            <h3 className="text-4xl md:text-6xl font-black text-primary mb-8">Employees x Sports</h3>
                            <p className="text-gray-600 text-lg max-w-4xl mx-auto leading-relaxed">
                                Welcome to our Corporate Engagement through Sports page, where we offer exciting and impactful sports programs designed to enhance team cohesion, foster a healthy work-life balance, and maximize employee productivity. We believe that incorporating sports activities into your corporate culture can lead to numerous benefits, including improved teamwork, enhanced communication, and a motivated workforce.
                            </p>
                        </div>
                        <div className="text-center mb-8">
                            <span className="text-2xl font-black text-primary">Make it</span>
                        </div>
                        <h4 className="text-2xl md:text-3xl font-black text-black mb-6">Learn about our services</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-black text-black mb-4 uppercase tracking-wider">
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {benefit.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages Section */}
            <section className="py-20 md:py-32 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,210,106,0.15),transparent)] pointer-events-none z-0" />

                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white font-montserrat uppercase leading-tight mb-6">
                            Package <span className="text-primary">Options</span>
                        </h2>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto">
                            Flexible packages designed to meet your corporate objectives and budget.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">
                                        {pkg.name}
                                    </h3>
                                    <p className="text-primary font-bold text-lg">{pkg.duration}</p>
                                </div>

                                <div className="mb-8">
                                    <ul className="space-y-3">
                                        {pkg.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3 text-white/80">
                                                <span className="text-primary text-lg">✓</span>
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="text-center">
                                    <div className="text-3xl font-black text-primary mb-4">
                                        {pkg.price}
                                    </div>
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Get Started
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Section */}
            <section className="py-20 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-black mb-8">
                        "Corporate Sports Engagement in Action: Watch Our Videos"
                    </h2>
                    <div className="aspect-video bg-gray-200 rounded-3xl flex items-center justify-center">
                        <span className="text-6xl">🎥</span>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-20 md:py-32 bg-gray-100">
                <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-black mb-8">
                        Stay in the loop
                    </h2>
                    <p className="text-gray-600 text-lg mb-12">
                        Sign up to book your court and receive updates.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <Button variant="primary" className="px-8 py-4">
                            SIgn Up
                        </Button>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 md:py-32 bg-white">
                <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-black mb-8 leading-tight">
                            Contact Us.
                        </h2>
                        <p className="text-gray-600 text-lg mb-12 max-w-4xl mx-auto">
                            Interested in elevating your corporate team through the power of sports? Reach out to us by filling out the contact form below. Our dedicated team will promptly respond to your inquiries and tailor the perfect sports engagement program to meet your organization's needs. Let's create a winning experience together
                        </p>

                        <div className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-3xl">
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            placeholder="+91 00000 00000"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Company Name"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select an option</label>
                                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white">
                                        <option>Designation</option>
                                        <option>Your role in the company</option>
                                        <option>CEO/Founder</option>
                                        <option>HR Manager</option>
                                        <option>Team Lead</option>
                                        <option>Employee</option>
                                    </select>
                                </div>
                                <div className="text-center">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="px-12 py-4"
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
