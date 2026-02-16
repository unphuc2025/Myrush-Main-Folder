import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

export const PublicNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 50) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    });

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-colors duration-300 ${isScrolled ? 'bg-black backdrop-blur-xl border-b border-white/5' : 'bg-transparent border-transparent'
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="w-full px-6 h-24 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                    <img src="/Rush-logo.webp" alt="Rush" className="h-24 md:h-28 w-auto" />
                </div>
                <div className="hidden md:flex items-center gap-8 bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/5">
                    {[
                        { label: 'Home', path: '/' },
                        { label: 'Academy', path: '/academy' },
                        { label: 'Arena', path: '/arena' },
                        { label: 'Corporate', path: '/corporate' },
                        { label: 'Pickleball', path: '/pickleball' }
                    ].map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className={`relative text-sm font-bold uppercase tracking-wider transition-all ${isActive ? 'text-primary' : 'text-gray-300 hover:text-primary hover:scale-105'
                                    }`}
                            >
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="publicNavIndicator"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-glow"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
                {isAuthenticated ? (
                    // Profile icon for authenticated users
                    <button
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all hover:shadow-glow border border-white/10"
                        onClick={() => navigate('/profile')}
                        title="Go to Profile"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>
                ) : (
                    // Login/Signup button for unauthenticated users
                    <div className="flex items-center gap-4">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/venues')}
                            className="font-bold bg-primary text-black hover:bg-white hover:text-black uppercase tracking-wider text-sm px-6 py-2 shadow-glow hover:shadow-glow-strong rounded-full transition-all"
                        >
                            Book Now
                        </Button>
                    </div>
                )}
            </div>
        </motion.nav>
    );
};
