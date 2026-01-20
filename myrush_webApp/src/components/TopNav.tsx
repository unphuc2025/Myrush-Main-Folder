import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './TopNav.css';

interface TopNavProps {
    userName?: string;
    onLogout?: () => void;
    showBackButton?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({ userName, onLogout, showBackButton = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <motion.nav
            className="top-nav-shared"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="top-nav-container">
                {showBackButton ? (
                    <button className="nav-back-btn" onClick={() => navigate(-1)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                ) : (
                    <div className="nav-logo" onClick={() => navigate('/')}>
                        <img src="/Rush-logo.webp" alt="MyRush" className="nav-logo-img" />
                    </div>
                )}

                <div className="nav-links">
                    <button
                        className={`nav-link ${isActive('/') || isActive('/dashboard') ? 'active' : ''}`}
                        onClick={() => navigate('/')}
                    >
                        Home
                    </button>
                    <button
                        className={`nav-link ${isActive('/venues') ? 'active' : ''}`}
                        onClick={() => navigate('/venues')}
                    >
                        Venues
                    </button>
                    <button
                        className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}
                        onClick={() => navigate('/bookings')}
                    >
                        Bookings
                    </button>
                    <button
                        className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                        onClick={() => navigate('/profile')}
                    >
                        Profile
                    </button>
                </div>

                <div className="nav-user-section">
                    {userName && <span className="nav-user-name">Hello, {userName}</span>}
                    {onLogout && (
                        <button className="nav-logout-btn" onClick={onLogout}>
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
};
