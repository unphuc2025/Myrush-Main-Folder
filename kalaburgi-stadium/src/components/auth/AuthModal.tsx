import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { FaTimes } from 'react-icons/fa';
import { AuthFlow } from './AuthFlow';

export const AuthModal: React.FC = () => {
    const { isAuthModalOpen, closeAuthModal } = useAuth();

    return (
        <AnimatePresence>
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                        className="absolute inset-0 bg-black/80"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px] md:min-h-[600px]"
                    >
                        {/* Left Side: Image */}
                        <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-gray-100">
                            <img 
                                src="/assets/auth/login-bg.png" 
                                alt="Athletic Excellence" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback if image fails
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2035";
                                }}
                            />
                            {/* Text positioned bottom left */}
                            <div className="absolute bottom-4 left-6 md:left-8 md:bottom-6 z-10 text-left">
                                <h2 className="text-4xl md:text-5xl font-black leading-tight uppercase font-heading tracking-tight drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                                    <span className="text-primary">Unlock Your</span> <br /> 
                                    <span className="text-black drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">Full Potential</span>
                                </h2>
                            </div>
                        </div>

                        {/* Right Side: Content */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 relative flex flex-col justify-center">
                            {/* Close Button */}
                            <button 
                                onClick={closeAuthModal}
                                className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                            >
                                <FaTimes size={24} />
                            </button>

                            {/* Brand Logo (Optional) */}
                            <div className="mb-12 md:hidden">
                                <img src="/Rush-logo.webp" alt="Rush" className="h-12 w-auto object-contain" />
                            </div>

                            <AuthFlow />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
