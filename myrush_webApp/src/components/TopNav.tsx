import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { featureFlags } from '../config/featureFlags';
import { Button } from './ui/Button';

interface TopNavProps {
    onLogout?: () => void;
    showBackButton?: boolean;
    homeLabel?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onLogout, showBackButton = false, homeLabel = 'Home' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout } = useAuth();

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
                        // Profile icon for authenticated users
                        <div className="flex items-center gap-3">
                            <button
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all hover:shadow-md border border-gray-100"
                                onClick={() => navigate('/profile')}
                                title="Go to Profile"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </button>
                            <button
                                className="hidden md:block bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-[7.5px] text-sm font-bold transition-all hover:shadow-md"
                                onClick={onLogout || logout}
                            >
                                Logout
                            </button>
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
