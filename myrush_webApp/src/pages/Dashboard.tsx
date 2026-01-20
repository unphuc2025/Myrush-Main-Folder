import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import './Dashboard.css';

interface UserProfile {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number: string;
}

// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.15,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    })
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12
        }
    }
};

export const Dashboard: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiClient.get('/auth/profile');
                setUser(response.data);
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const displayName = user?.full_name?.split(' ')[0] || user?.first_name || 'Player';

    return (
        <div className="dashboard-modern">
            <TopNav userName={displayName} onLogout={handleLogout} />

            {/* Hero Section */}
            <section className="hero-modern">
                <div className="hero-bg-modern">
                    <div className="hero-gradient"></div>
                </div>

                <div className="hero-content-modern">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        For All Things <span className="highlight-green">Sport.</span>
                    </motion.h1>

                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        Book venues, join academies, compete in events — your ultimate sports platform.
                    </motion.p>

                    <motion.button
                        className="cta-btn-modern"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 12px 30px rgba(0, 210, 106, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/venues')}
                    >
                        Book a Court
                    </motion.button>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="stats-section">
                <motion.div
                    className="stats-grid"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    {[
                        { value: '50+', label: 'Venues', icon: '🏟️' },
                        { value: '500+', label: 'Games Hosted', icon: '⚽' },
                        { value: '1000+', label: 'Active Players', icon: '👥' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            className="stat-card"
                            variants={fadeInUp}
                            custom={i}
                            whileHover={{ y: -8 }}
                        >
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Services Section */}
            <section className="services-section-modern">
                <motion.div
                    className="section-header-modern"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2>Explore <span className="highlight-green">Rush</span></h2>
                    <p>Everything you need for your sporting journey</p>
                </motion.div>

                <motion.div
                    className="services-grid"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    {[
                        {
                            title: 'Book Venues',
                            desc: 'Premium turfs and courts available 24/7',
                            icon: '🏟️',
                            link: '/venues',
                            color: '#00D26A'
                        },
                        {
                            title: 'Join Academy',
                            desc: 'Train with professional coaches',
                            icon: '🎓',
                            color: '#FF6B6B'
                        },
                        {
                            title: 'Compete',
                            desc: 'Tournaments and leagues year-round',
                            icon: '🏆',
                            color: '#FFD93D'
                        },
                        {
                            title: 'Corporate Events',
                            desc: 'Team building and sports days',
                            icon: '🤝',
                            color: '#6C5CE7'
                        }
                    ].map((service, i) => (
                        <motion.div
                            key={i}
                            className="service-card"
                            variants={fadeInUp}
                            custom={i}
                            whileHover={{
                                y: -12,
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
                                transition: { duration: 0.3 }
                            }}
                            onClick={() => service.link && navigate(service.link)}
                            style={{ cursor: service.link ? 'pointer' : 'default' }}
                        >
                            <div className="service-icon-wrapper">
                                <div className="service-icon" style={{ background: `${service.color}15` }}>
                                    <span>{service.icon}</span>
                                </div>
                            </div>
                            <h3>{service.title}</h3>
                            <p>{service.desc}</p>
                            {service.link && <div className="service-arrow">→</div>}
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-bottom-nav">
                <div className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
                    <span>🏠</span>
                    <span className="label">Home</span>
                </div>
                <div className={`mobile-nav-item ${location.pathname === '/venues' ? 'active' : ''}`} onClick={() => navigate('/venues')}>
                    <span>🏟️</span>
                    <span className="label">Venues</span>
                </div>
                <div className={`mobile-nav-item ${location.pathname === '/bookings' ? 'active' : ''}`} onClick={() => navigate('/bookings')}>
                    <span>📅</span>
                    <span className="label">Bookings</span>
                </div>
                <div className={`mobile-nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
                    <span>👤</span>
                    <span className="label">Profile</span>
                </div>
            </nav>
        </div>
    );
};
