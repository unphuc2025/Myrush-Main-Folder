import React from 'react';
import { FaStethoscope, FaFutbol } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';

export const Services: React.FC = () => {
    const services = [
        { title: 'Sports Physio & Rehab', desc: 'Expert physiotherapy for sports injuries.', icon: <FaStethoscope /> },
        { title: 'Personal Training', desc: '1-on-1 sessions with certified coaches.', icon: '💪' },
        { title: 'Nutrition Consultation', desc: 'Diet plans for peak performance.', icon: '🥗' },
        { title: 'Equipment Rental', desc: 'Rent high-quality gear for your matches.', icon: <FaFutbol /> }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <TopNav />
            <div className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-12 md:16">
                    <h1 className="text-3xl md:text-5xl font-black font-heading uppercase tracking-tight mb-4">
                        Our <span className="text-primary italic">Services</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">Beyond the field. Elevate your game.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 md:p-8 rounded-xl md:rounded-xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center text-center gap-6"
                        >
                            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-4xl shrink-0">
                                {service.icon}
                            </div>
                            <div className="flex flex-col flex-1">
                                <h3 className="text-2xl md:text-3xl font-black font-heading uppercase mb-3 leading-tight">{service.title}</h3>
                                <p className="text-gray-600 text-base md:text-lg font-medium mb-8 leading-relaxed flex-1">{service.desc}</p>
                                <Button variant="secondary" className="w-full py-4 font-bold uppercase tracking-widest text-xs mt-auto">
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
