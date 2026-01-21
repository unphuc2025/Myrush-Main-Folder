import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { FaChalkboardUser, FaTimeline, FaBuilding } from "react-icons/fa6";

export const Academy: React.FC = () => {
    const navigate = useNavigate();
    const benefits = [
        {
            icon: <FaChalkboardUser />,
            title: 'Elite Coaching',
            description: 'Train with AFC and UEFA licensed coaches who bring international experience to your game development.'
        },
        {
            icon: <FaTimeline />,
            title: 'Pro Pathway',
            description: 'Direct connections to professional clubs and scouts, providing players a clear route to the professional stage.'
        },
        {
            icon: <FaBuilding />,
            title: 'World-Class Facility',
            description: 'Access to premium FIFA-standard turfs and state-of-the-art training equipment across Bengaluru.'
        }
    ];

    const locations = [
        { name: 'Koramangala', address: '100 Feet Road, Koramangala 4th Block' },
        { name: 'Indiranagar', address: 'HAL 2nd Stage, Indiranagar' },
        { name: 'Whitefield', address: 'ITPL Main Road, Whitefield' },
        { name: 'Jayanagar', address: '9th Block, Jayanagar' },
        { name: 'Hebbal', address: 'Outer Ring Road, Hebbal' },
        { name: 'Electronic City', address: 'Phase 1, Electronic City' }
    ];

    const team = [
        { name: 'Arjun Menon', role: 'Head Coach', image: 'https://i.pravatar.cc/150?img=12' },
        { name: 'Priya Sharma', role: 'U-12 Lead', image: 'https://i.pravatar.cc/150?img=5' },
        { name: 'Rahul Verma', role: 'U-16 Lead', image: 'https://i.pravatar.cc/150?img=13' },
        { name: 'Sneha Patel', role: 'Fitness Coach', image: 'https://i.pravatar.cc/150?img=9' },
        { name: 'Vikram Singh', role: 'Goalkeeping', image: 'https://i.pravatar.cc/150?img=14' },
        { name: 'Ananya Reddy', role: 'Tactical Analyst', image: 'https://i.pravatar.cc/150?img=10' },
        { name: 'Karthik Kumar', role: 'U-14 Lead', image: 'https://i.pravatar.cc/150?img=15' },
        { name: 'Meera Iyer', role: 'Psychologist', image: 'https://i.pravatar.cc/150?img=16' }
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
                        <span className="text-caption text-primary uppercase tracking-[0.3em]">
                            Bengaluru's Premier Academy
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="text-display text-white mb-10 leading-[0.8] tracking-[-0.05em]">
                        Unleash Your <br />
                        <span className="text-primary italic">Potential</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-body-lg text-white/60 mb-16 max-w-2xl leading-[1.8] font-light tracking-wide">
                        Join the fastest-growing community of elite athletes in India.
                        Professional coaching, world-class facilities, and a dedicated pathway to international excellence.
                    </p>

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-start gap-8">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto min-w-[240px] h-16 text-lg"
                            onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Book a Free Trial
                        </Button>
                        <button
                            className="w-full sm:w-auto text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all py-6 px-10 group flex items-center gap-4 border border-white/10 hover:bg-white/5 hover:border-white/20 rounded-xl"
                            onClick={() => document.getElementById('why-rush')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Our Programs
                            <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                        </button>
                    </div>
                </motion.div>

                {/* Vertical Indicator */}
                <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-6 z-20">
                    <span className="text-[10px] font-black text-white/20 rotate-90 uppercase tracking-[0.5em] mb-12">Scroll</span>
                    <div className="w-[1px] h-20 bg-gradient-to-b from-primary to-transparent" />
                </div>
            </section>



            {/* Why Rush Advantage */}
            <section id="why-rush" className="py-40 bg-white w-full">
                <div className="w-full px-6 md:px-12">
                    <div className="text-center mb-24">
                        <h2 className="text-h2 text-black mb-6 leading-[1.1]">
                            The <span className="text-primary italic">Rush</span> Advantage
                        </h2>
                        <p className="text-body-lg text-gray-400 font-light uppercase tracking-[0.2em]">
                            We don't just train players, we build future champions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[1920px] mx-auto place-items-stretch">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                className="group relative w-full h-full flex flex-col items-center text-center p-16 rounded-[4rem] bg-gray-50 border border-transparent hover:border-gray-100 hover:shadow-premium transition-all duration-500 min-h-[600px] justify-center"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="text-7xl text-black mb-10 transform group-hover:scale-110 group-hover:text-primary transition-all duration-500">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-h3 text-black mb-8 uppercase tracking-wider leading-tight">
                                    {benefit.title}
                                </h3>
                                <div className="h-1.5 w-16 bg-gray-200 mb-10 group-hover:bg-primary group-hover:w-32 transition-all duration-500 rounded-full" />
                                <p className="text-body-lg text-gray-500 leading-relaxed font-light">
                                    {benefit.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Locations */}
            <section id="our-locations" className="py-40 bg-black relative overflow-hidden w-full">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,210,106,0.15),transparent)] pointer-events-none z-0" />

                <div className="w-full max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-40 gap-12">
                        <div className="max-w-3xl">
                            <h2 className="text-h2 text-white mb-10 leading-[1.1]">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
                        {locations.map((location, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-12 border border-white/10 hover:bg-white/[0.05] hover:border-primary/30 transition-all duration-500 group cursor-pointer min-h-[20px] flex flex-col items-center text-center"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <span className="text-3xl text-primary">📍</span>
                                </div>
                                <h3 className="text-h4 text-white mb-4 uppercase tracking-wider group-hover:text-primary transition-colors">
                                    {location.name}
                                </h3>
                                <p className="text-body text-white/40 mb-8 font-light leading-relaxed flex-grow">
                                    {location.address}
                                </p>
                                <div className="flex items-center gap-4 text-primary font-black uppercase tracking-[0.2em] text-[10px] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 mt-auto">
                                    View on Map
                                    <span>→</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Coaches */}
            <section id="meet-the-team" className="py-40 bg-gray-50 w-full">
                <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-40 gap-12">
                        <div className="max-w-3xl">
                            <h2 className="text-h2 text-black mb-10 leading-[1.1]">
                                Elite <span className="text-primary italic">Mentors</span>
                            </h2>
                            <p className="text-body-lg text-gray-400 font-light uppercase tracking-[0.2em]">
                                Technical excellence guided by professional experience.
                            </p>
                        </div>
                        <div className="h-[1px] flex-grow bg-gray-200 mb-8 hidden lg:block mx-12"></div>
                        <div className="hidden md:block">
                            <span className="text-display text-black opacity-5 leading-none">03</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-24 lg:gap-x-20 lg:gap-y-32">
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
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 group-hover:text-black transition-colors text-center w-full">
                                    {member.role}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-40 bg-white w-full">
                <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-40 gap-12">
                        <div className="max-w-3xl">
                            <h2 className="text-h2 text-black mb-10 leading-[1.1]">
                                Strategic <span className="text-primary italic">Investment</span>
                            </h2>
                            <p className="text-body-lg text-gray-400 font-light uppercase tracking-[0.2em]">
                                Flexible programs for every stage of development.
                            </p>
                        </div>
                        <div className="h-[1px] flex-grow bg-gray-100 mb-8 hidden lg:block mx-12"></div>
                        <div className="hidden md:block">
                            <span className="text-display text-black opacity-5 leading-none">04</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 pl-12">
                        {[
                            { name: 'Starter', price: '₹4,500', period: '/month', features: ['3 Sessions/Week', 'Standard Kit', 'Quarterly Reports'], featured: false },
                            { name: 'Pro Academy', price: '₹7,500', period: '/month', features: ['5 Sessions/Week', 'Full Pro Kit', 'Monthly Tech Analysis', 'Scouting Access'], featured: true },
                            { name: 'Elite Pathway', price: '₹12,000', period: '/month', features: ['Daily Sessions', 'Personal Mentor', 'International Tours', 'Direct Pro Trials'], featured: false }
                        ].map((plan, index) => (
                            <motion.div
                                key={index}
                                className={`relative p-12 rounded-[2.5rem] border flex flex-col ${plan.featured ? 'bg-black text-white border-black shadow-glow-strong' : 'bg-white text-black border-gray-100 shadow-premium'}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {plan.featured && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] py-3 px-8 rounded-full shadow-glow">
                                        Most Enrolled
                                    </div>
                                )}
                                <h3 className="text-caption text-primary uppercase tracking-[0.4em] mb-8 text-center">{plan.name}</h3>
                                <div className="mb-12 text-center">
                                    <span className="text-h2 font-black leading-none">{plan.price}</span>
                                    <span className={`text-caption uppercase tracking-widest ml-2 ${plan.featured ? 'text-white/40' : 'text-gray-400'}`}>{plan.period}</span>
                                </div>
                                <div className={`h-[1px] w-full mb-12 ${plan.featured ? 'bg-white/10' : 'bg-gray-100'}`} />
                                <ul className="space-y-6 mb-12 flex-grow">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-4 text-body font-light opacity-80">
                                            <span className="text-primary text-xl shrink-0 mt-1">✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-center mt-auto">
                                    <Button
                                        variant={plan.featured ? 'primary' : 'outline'}
                                        className="max-w-xl h-16"
                                        onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Choose Plan
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enrollment Section */}
            <section id="enroll-section" className="py-48 bg-black relative overflow-hidden px-6">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
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
