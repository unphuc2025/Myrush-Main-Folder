import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt } from 'react-icons/fa';
import './Dashboard.css';

interface Booking {
    id: string;
    venue_name: string;
    date: string;
    time: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    price: string;
}

// Mock Data
const MOCK_BOOKINGS: Booking[] = [
    { id: '1', venue_name: 'Rush Arena', date: 'Oct 24, 2024', time: '6:00 PM - 7:00 PM', status: 'upcoming', price: '₹1200' },
    { id: '2', venue_name: 'Smash Court', date: 'Oct 20, 2024', time: '8:00 PM - 9:00 PM', status: 'completed', price: '₹900' },
];

export const Bookings: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [bookings] = useState<Booking[]>(MOCK_BOOKINGS);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="premium-dashboard">
            {/* Navbar Reuse */}
            <motion.nav
                className="premium-nav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src="/Rush-logo.webp" alt="MyRush" className="nav-logo-img" />
                </div>
                <div className="nav-menu">
                    <button className="nav-link" onClick={() => navigate('/')}>Home</button>
                    <button className="nav-link active">Bookings</button>
                    <button className="nav-link" onClick={() => navigate('/profile')}>Profile</button>
                </div>
                <button className="logout-btn-minimal" onClick={handleLogout}>LOGOUT</button>
            </motion.nav>

            <div style={{ paddingTop: '120px', maxWidth: '1000px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--color-black)' }}
                >
                    YOUR BOOKINGS
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ color: 'var(--text-muted)', marginBottom: '40px' }}
                >
                    Manage your upcoming games and history.
                </motion.p>

                <div style={{ display: 'grid', gap: '20px' }}>
                    {bookings.map((booking, i) => (
                        <motion.div
                            key={booking.id}
                            className="premium-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            whileHover={{ y: -2 }}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '25px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    background: 'rgba(0, 210, 106, 0.1)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    color: 'var(--color-primary, #00D26A)'
                                }}>
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '5px' }}>{booking.venue_name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{booking.date} • {booking.time}</p>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    background: booking.status === 'upcoming' ? 'var(--color-lime)' : '#eee',
                                    color: booking.status === 'upcoming' ? 'white' : '#888',
                                    marginBottom: '5px'
                                }}>
                                    {booking.status.toUpperCase()}
                                </span>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-black)' }}>{booking.price}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div style={{ height: '100px' }}></div>
        </div>
    );
};
