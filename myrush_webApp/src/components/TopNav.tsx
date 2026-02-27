import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { featureFlags } from '../config/featureFlags';
import { Button } from './ui/Button';
import { FaUser, FaStar, FaSignOutAlt, FaChevronRight } from 'react-icons/fa';

interface TopNavProps {
    onLogout?: () => void;
    showBackButton?: boolean;
    homeLabel?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onLogout, showBackButton = false, homeLabel = 'Home' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on navigation
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [location.pathname]);

    const getInitials = (name?: string) => {
        if (!name) return 'MP';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300 h-20 md:h-26"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="w-full px-6 h-full flex items-center justify-between relative">
                {showBackButton ? (
                    <button
                        className="flex items-center gap-2 text-black hover:text-primary transition-colors font-medium"
                        onClick={() => navigate(-1)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                ) : (
                    <div className="cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/Rush-logo.webp" alt="MyRush" className="h-[75px] md:h-[95px] w-auto" />
                    </div>
                )}

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                    {[
                        { label: homeLabel, path: '/' },
                        { label: 'Book Court', path: '/venues' },

                        // Feature Flagged Items
                        featureFlags.enableGames && { label: 'Games', path: '/open-play' },
                        { label: 'My Bookings', path: '/bookings' },
                        featureFlags.enableCommunity && { label: 'Community', path: '/community' },
                        featureFlags.enableStore && { label: 'Store', path: '/store' }
                    ].filter((item): item is { label: string; path: string } => Boolean(item)).map((item) => (
                        <button
                            key={item.path}
                            className={`relative text-sm font-semibold font-heading uppercase tracking-wider transition-colors nav-hover-underline ${isActive(item.path) || (item.path === '/' && location.pathname === '/dashboard')
                                ? 'text-primary'
                                : 'text-black hover:text-primary'
                                }`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.label}
                            {(isActive(item.path) || (item.path === '/' && location.pathname === '/dashboard')) && (
                                <motion.div
                                    layoutId="navParams"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-glow"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        // Profile icon for authenticated users - hidden on mobile globally
                        <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
                            <button
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${isDropdownOpen
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                                    : 'bg-primary text-white border-primary/20 hover:scale-110'
                                    }`}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                title="Profile Options"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden"
                                    >
                                        {/* Name Card */}
                                        <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md shadow-primary/20">
                                                    {getInitials(user?.full_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-black text-gray-900 truncate">
                                                        {user?.full_name || 'MyRush Player'}
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-500 truncate">
                                                        {user?.phone_number || 'Athlete'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dropdown Options */}
                                        <div className="p-2">
                                            <button
                                                onClick={() => navigate('/profile')}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        <FaUser size={16} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">Profile Information</span>
                                                </div>
                                                <FaChevronRight size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                                            </button>

                                            <button
                                                onClick={() => navigate('/profile?view=reviews')}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                                                        <FaStar size={16} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">Rating & Reviews</span>
                                                </div>
                                                <FaChevronRight size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                                            </button>

                                            <div className="h-px bg-gray-100 my-2 mx-2" />

                                            <button
                                                onClick={onLogout || logout}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-red-100/50 flex items-center justify-center">
                                                    <FaSignOutAlt size={16} />
                                                </div>
                                                <span className="text-sm font-bold">Logout</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        // Login/Signup button for unauthenticated users
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => navigate('/login')}
                            className="shadow-md hover:shadow-lg"
                        >
                            Login
                        </Button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
};
