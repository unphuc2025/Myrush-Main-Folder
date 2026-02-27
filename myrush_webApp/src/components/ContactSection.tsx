import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { PhoneInput } from './ui/PhoneInput';
import { apiClient } from '../api/client';
import rushEventImg from '../assets/Rush-Event.jpg';

export const ContactSection: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        countryCode: '+91',
        phone: '',
        service: 'Academy'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        const isIndia = formData.countryCode === '+91';
        if (formData.phone.trim()) {
            if (isIndia && !/^[6-9]\d{9}$/.test(formData.phone)) {
                newErrors.phone = 'Invalid Indian phone number (10 digits)';
            } else if (formData.phone.length < 7) {
                newErrors.phone = 'Invalid phone number (too short)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const response = await apiClient.post('/contact/submit', {
                form_type: 'landing',
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone ? `${formData.countryCode}${formData.phone}` : '',
                message: `Interested Service: ${formData.service}`
            });
            if (response.data.success) {
                alert(response.data.message);
                setFormData({ firstName: '', lastName: '', email: '', countryCode: '+91', phone: '', service: 'Academy' });
            } else {
                alert('An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = (name: string) => `w-full bg-white/5 border ${errors[name] ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm`;
    const labelClasses = "block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2";

    return (
        <section className="relative bg-black overflow-hidden flex flex-col pt-24">
            {/* UNCOUCH CTA INTEGRATION */}
            <div className="relative z-10 max-w-screen-2xl mx-auto flex flex-col items-center text-center px-4 md:px-8 mb-24">
                <motion.h2
                    className="text-5xl sm:text-7xl md:text-9xl font-black text-white font-heading italic mb-8 leading-none"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    UNCOUCH.
                </motion.h2>

                <motion.div
                    className="w-full max-w-4xl mx-auto mb-12 rounded-2xl overflow-hidden shadow-glow border border-white/10"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="/venue-assets/Rush Video.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </motion.div>

                <p className="text-gray-400 text-lg md:text-3xl mb-12 font-light max-w-4xl mx-auto leading-relaxed text-center">
                    <span className="text-white font-medium">Start playing today. Join thousands of players in the Rush community today.</span>
                </p>
            </div>

            <div className="flex flex-col md:flex-row pb-20 md:pb-0 relative z-10 border-t border-white/5">
                {/* Left Column: Form Section */}
                <div className="flex-1 relative z-10 px-4 py-16 md:py-24 md:px-8 lg:px-12 flex flex-col justify-center">

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
                            className="text-5xl md:text-6xl lg:text-8xl font-extrabold font-heading leading-none mb-12 tracking-tight text-white uppercase pr-4"
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
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            className={inputClasses('firstName')}
                                            value={formData.firstName}
                                            onChange={(e) => {
                                                setFormData({ ...formData, firstName: e.target.value });
                                                if (errors.firstName) setErrors({ ...errors, firstName: '' });
                                            }}
                                        />
                                        {errors.firstName && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{errors.firstName}</span>}
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            className={inputClasses('lastName')}
                                            value={formData.lastName}
                                            onChange={(e) => {
                                                setFormData({ ...formData, lastName: e.target.value });
                                                if (errors.lastName) setErrors({ ...errors, lastName: '' });
                                            }}
                                        />
                                        {errors.lastName && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{errors.lastName}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className={labelClasses}>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className={inputClasses('email')}
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                />
                                {errors.email && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{errors.email}</span>}
                            </div>

                            {/* Phone Field */}
                            <div className="space-y-2">
                                <PhoneInput
                                    label="Phone Number"
                                    countryCode={formData.countryCode}
                                    phoneNumber={formData.phone}
                                    onCodeChange={(code) => setFormData({ ...formData, countryCode: code })}
                                    onNumberChange={(num) => {
                                        setFormData({ ...formData, phone: num });
                                        if (errors.phone) setErrors({ ...errors, phone: '' });
                                    }}
                                    error={errors.phone}
                                />
                            </div>

                            {/* Service Interest Field */}
                            <div className="space-y-2 relative">
                                <label className={labelClasses}>Service Interest</label>
                                <div className="relative">
                                    <select
                                        className={`${inputClasses('service')} appearance-none cursor-pointer [&>option]:bg-black [&>option]:text-white`}
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
                                    disabled={isSubmitting}
                                    size="lg"
                                    icon={<span className="ml-2">→</span>}
                                    className="w-full md:w-auto px-12 py-5 rounded-xl uppercase tracking-[0.2em] font-black shadow-glow hover:shadow-glow-strong"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
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
            </div>
        </section>
    );
};
