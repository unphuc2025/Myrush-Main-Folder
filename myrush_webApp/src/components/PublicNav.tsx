import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { FaBars, FaTimes } from 'react-icons/fa';
import { featureFlags } from '../config/featureFlags';

export const PublicNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { label: 'Home', path: '/' },
        featureFlags.enableGames && { label: 'Games', path: '/open-play' },
        { label: 'Academy', path: '/academy' },
        { label: 'Arena', path: '/arena' },
        { label: 'Corporate', path: '/corporate' },
        { label: 'Pickleball', path: '/pickleball' },
        featureFlags.enableCommunity && { label: 'Community', path: '/community' },
        featureFlags.enableStore && { label: 'Store', path: '/store' },
    ].filter((item): item is { label: string; path: string } => Boolean(item));

    const isActive = (path: string) => location.pathname === path;

    return (
        <motion.nav
            initial={false}
            animate={{
                backgroundColor: scrolled ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)',
                backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
                boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : '0 0 0 rgba(0,0,0,0)',
                borderBottomColor: scrolled ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0)',
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-0 left-0 right-0 z-[9999] h-20 md:h-26 flex items-center border-b"
        >
            <div className="w-full px-4 md:px-12 h-full flex items-center justify-between relative">
                <div
                    className="flex items-center gap-2 cursor-pointer h-full"
                    onClick={() => {
                        navigate('/');
                        setIsMobileMenuOpen(false);
                        window.scrollTo(0, 0);
                    }}
                >
                    {scrolled ? (
                        <img src="/Rush-logo.webp" alt="Rush" className="h-[75px] md:h-[95px] w-auto object-contain" />
                    ) : (
                        <img src="/Rush-logo-white.webp" alt="Rush" className="h-[75px] md:h-[95px] w-auto object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/Rush-logo.webp';
                            }}
                        />
                    )}
                </div>

                <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`relative text-sm font-bold font-heading uppercase tracking-wider transition-all nav-hover-underline ${isActive(item.path)
                                ? 'text-primary'
                                : scrolled
                                    ? 'text-black hover:text-primary'
                                    : 'text-white hover:text-primary'
                                }`}
                        >
                            {item.label}
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="publicNavIndicator"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all hover:shadow-md ${scrolled ? 'bg-gray-100' : 'bg-white/20'
                                    }`}
                                onClick={() => navigate('/profile')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={scrolled ? 'black' : 'white'} strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </button>
                            <button
                                onClick={logout}
                                className={`px-4 py-2 rounded-[7.5px] text-sm font-bold transition-all hover:shadow-md ${scrolled ? 'bg-gray-100 text-black' : 'bg-white/20 text-white'
                                    }`}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/venues')}
                            className="font-bold bg-primary text-black hover:bg-primary-hover uppercase tracking-wider text-xs md:text-sm px-4 py-2 md:px-6 md:py-2"
                        >
                            Book Now
                        </Button>
                    )}

                    <button
                        className={`md:hidden p-2 rounded-xl transition-all ${scrolled ? 'text-black hover:bg-black/5' : 'text-white hover:bg-white/5'
                            }`}
                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                    >
                        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center gap-8 md:hidden"
                    >
                        <button className="absolute top-6 right-6 text-white p-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <FaTimes size={24} />
                        </button>

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
                                className={`text-2xl font-semibold font-heading uppercase tracking-widest ${isActive(item.path) ? 'text-primary' : 'text-white'
                                    }`}
                            >
                                {item.label}
                            </motion.button>
                        ))}

                        {!isAuthenticated && (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    navigate('/login');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="mt-4 px-12 py-4 text-lg font-bold"
                            >
                                Login
                            </Button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};