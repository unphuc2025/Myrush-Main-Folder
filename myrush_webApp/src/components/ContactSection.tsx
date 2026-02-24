import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import rushEventImg from '../assets/Rush-Event.jpg';

export const ContactSection: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        service: 'Academy'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Thank you for reaching out! We will get back to you soon.');
    };

    const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm";
    const labelClasses = "block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2";

    return (
        <section className="relative bg-black overflow-hidden min-h-screen flex flex-col md:flex-row border-t border-white/10 pb-20 md:pb-0">
            {/* Left Column: Form Section */}
            <div className="flex-1 relative z-10 px-6 py-16 md:py-24 md:px-16 lg:px-24 flex flex-col justify-center">

                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 -left-1/4 w-[150%] h-[150%] bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-[10px] font-bold text-primary tracking-[0.2em] uppercase"
                    >
                        Get In Touch
                    </motion.div>

                    <motion.h2
                        className="text-5xl md:text-6xl lg:text-8xl font-black font-heading leading-none mb-12 tracking-tighter text-white uppercase italic"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        CONTACT <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">US</span>
                    </motion.h2>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className={labelClasses}>Full Name</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    required
                                    className={inputClasses}
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    required
                                    className={inputClasses}
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className={labelClasses}>Email Address</label>
                            <input
                                type="email"
                                placeholder="example@email.com"
                                required
                                className={inputClasses}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                            <label className={labelClasses}>Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+91 00000 00000"
                                className={inputClasses}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        {/* Service Interest Field */}
                        <div className="space-y-2 relative">
                            <label className={labelClasses}>Service Interest</label>
                            <div className="relative">
                                <select
                                    className={`${inputClasses} appearance-none cursor-pointer [&>option]:bg-black [&>option]:text-white`}
                                    value={formData.service}
                                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                >
                                    <option value="Academy">Rush Academy</option>
                                    <option value="Arena">Rush Arena</option>
                                    <option value="Corporate">Corporate Events</option>
                                    <option value="Events">Private Events</option>
                                    <option value="Tournaments">Tournaments</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                icon={<span className="ml-2">→</span>}
                                className="w-full md:w-auto px-12 py-5 rounded-full uppercase tracking-[0.2em] font-black shadow-glow hover:shadow-glow-strong"
                            >
                                Send Message
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Column: Image */}
            <div className="hidden md:block flex-1 relative min-h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent z-10" />
                <img
                    src={rushEventImg}
                    alt="Rush Event"
                    className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                />
            </div>
        </section>
    );
};
