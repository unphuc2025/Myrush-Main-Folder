import React from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';

export const Services: React.FC = () => {
    const services = [
        { title: 'Sports Physio & Rehab', desc: 'Expert physiotherapy for sports injuries.', icon: '🩺' },
        { title: 'Personal Training', desc: '1-on-1 sessions with certified coaches.', icon: '💪' },
        { title: 'Nutrition Consultation', desc: 'Diet plans for peak performance.', icon: '🥗' },
        { title: 'Equipment Rental', desc: 'Rent high-quality gear for your matches.', icon: '⚽' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            <TopNav />
            <div className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black font-montserrat uppercase tracking-tight mb-4">
                        Our <span className="text-primary italic">Services</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Beyond the field. Elevate your game.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {services.map((service, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex items-start gap-6"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                                {service.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold uppercase mb-2">{service.title}</h3>
                                <p className="text-gray-500 mb-6">{service.desc}</p>
                                <Button variant="secondary" className="px-6 font-bold uppercase tracking-widest text-xs">
                                    Book Now
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
