import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { FaBars, FaTimes } from 'react-icons/fa';

export const PublicNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { label: 'Home', path: '/' },
        { label: 'Academy', path: '/academy' },
        { label: 'Arena', path: '/arena' },
        { label: 'Corporate', path: '/corporate' },
        { label: 'Pickleball', path: '/pickleball' }
    ];

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                width: '100vw',
                zIndex: 9999,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
            }}
        >

            {/* Nav Content — sits on top of background layer */}
            <div
                style={{ position: 'relative', zIndex: 1 }}
                className="w-full px-4 md:px-12 h-16 md:h-20 flex items-center justify-between"
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-2 cursor-pointer h-full"
                    onClick={() => {
                        navigate('/');
                        setIsMobileMenuOpen(false);
                        window.scrollTo(0, 0);
                    }}
                >
                    <img src="/Rush-logo.webp" alt="Rush" className="h-[50px] md:h-28 w-auto object-contain" />
                </div>

                {/* Desktop Nav Items */}
                <div className="hidden md:flex items-center gap-8 px-8 py-3">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className={`relative text-sm font-semibold font-heading uppercase tracking-wider transition-all nav-hover-underline ${isActive ? 'text-primary' : 'text-black hover:text-primary'
                                    }`}
                            >
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="publicNavIndicator"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right: Auth + Mobile Toggle */}
                <div className="flex items-center gap-3 md:gap-4">
                    {isAuthenticated ? (
                        <button
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 transition-all border border-gray-200"
                            onClick={() => navigate('/profile')}
                            title="Go to Profile"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/venues')}
                            className="font-bold bg-primary text-black hover:bg-primary-hover uppercase tracking-wider text-xs md:text-sm px-4 py-2 md:px-6 md:py-2 rounded-[10px] transition-all flex items-center justify-center h-9"
                        >
                            Book Now
                        </Button>
                    )}

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 rounded-xl transition-all flex items-center justify-center w-10 h-10 text-black hover:bg-black/5 active:scale-90"
                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                    >
                        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: 'relative', zIndex: 1 }}
                        className="md:hidden bg-black flex flex-col items-center justify-start pt-12 gap-8 min-h-screen overflow-y-auto pb-12"
                    >
                        {navItems.map((item, index) => (
                            <motion.button
                                key={item.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`text-2xl font-semibold font-heading uppercase tracking-widest ${location.pathname === item.path ? 'text-primary' : 'text-white'
                                    }`}
                            >
                                {item.label}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
