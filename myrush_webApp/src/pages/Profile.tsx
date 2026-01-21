import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../api/client';
import { profileApi } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { TopNav } from '../components/TopNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface UserProfile {
    full_name?: string;
    first_name?: string;
    email?: string;
    phone_number?: string;
    city?: string;
    skill_level?: string;
    sports?: string[];
    age?: number;
    gender?: string;
}

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                // First fetch to get the phone number
                const authResponse = await apiClient.get('/auth/profile');
                const phoneNumber = authResponse.data.phone_number;

                if (phoneNumber) {
                    // Then fetch using phone number
                    const profileResponse = await profileApi.getProfile(phoneNumber);
                    if (profileResponse.success && profileResponse.data) {
                        setUser(profileResponse.data);
                    } else {
                        // Fallback to auth response if phone number fetch fails
                        setUser(authResponse.data);
                    }
                } else {
                    setUser(authResponse.data);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
                // Try fallback with profileApi.getProfile() without phone number
                try {
                    const fallbackResponse = await profileApi.getProfile();
                    if (fallbackResponse.success) {
                        setUser(fallbackResponse.data);
                    }
                } catch (fallbackErr) {
                    console.error('Fallback fetch also failed', fallbackErr);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0.1))]"></div>
            </div>

            {/* Floating Elements */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
            />

            {/* Modern Top Navigation */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-20 bg-white/10 backdrop-blur-xl border-b border-white/20"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => navigate('/dashboard')}
                        >
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">R</span>
                                </div>
                                <span className="text-white font-bold text-lg">MyRush</span>
                            </div>
                        </motion.div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-8">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/dashboard')}
                                className="text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                            >
                                Dashboard
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/venues')}
                                className="text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                            >
                                Venues
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/bookings')}
                                className="text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                            >
                                Bookings
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/profile')}
                                className="text-primary bg-white/10 px-3 py-2 rounded-lg border border-primary/30"
                            >
                                Profile
                            </motion.button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/dashboard')}
                                className="text-white p-2 rounded-lg hover:bg-white/10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            <div className="relative z-10 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-center mb-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                            className="inline-block p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 mb-6"
                        >
                            <span className="text-6xl">👤</span>
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                            {user?.full_name || 'MyRush Player'}
                        </h1>
                        <p className="text-white/70 text-xl">{user?.phone_number}</p>
                        {user?.city && (
                            <p className="text-white/60 text-lg mt-2">{user.city}</p>
                        )}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Info Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="lg:col-span-2"
                        >
                            <Card variant="glass" className="border-white/20 shadow-2xl p-8 h-full">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mr-4">
                                        <span className="text-2xl">📋</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <h3 className="text-white/60 text-sm font-medium mb-1">Full Name</h3>
                                            <p className="text-white text-lg font-semibold">{user?.full_name || 'Not set'}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <h3 className="text-white/60 text-sm font-medium mb-1">Phone Number</h3>
                                            <p className="text-white text-lg font-semibold">{user?.phone_number}</p>
                                        </div>
                                        {user?.email && (
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h3 className="text-white/60 text-sm font-medium mb-1">Email</h3>
                                                <p className="text-white text-lg font-semibold">{user.email}</p>
                                            </div>
                                        )}
                                        {user?.age && (
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h3 className="text-white/60 text-sm font-medium mb-1">Age</h3>
                                                <p className="text-white text-lg font-semibold">{user.age} years</p>
                                            </div>
                                        )}
                                        {user?.gender && (
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h3 className="text-white/60 text-sm font-medium mb-1">Gender</h3>
                                                <p className="text-white text-lg font-semibold">{user.gender}</p>
                                            </div>
                                        )}
                                        {user?.skill_level && (
                                            <div className="bg-white/5 rounded-xl p-4">
                                                <h3 className="text-white/60 text-sm font-medium mb-1">Skill Level</h3>
                                                <p className="text-white text-lg font-semibold">{user.skill_level}</p>
                                            </div>
                                        )}
                                    </div>

                                    {user?.sports && user.sports.length > 0 && (
                                        <div>
                                            <h3 className="text-white/80 text-lg font-semibold mb-4">Favorite Sports</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {user.sports.map((sport, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium"
                                                    >
                                                        {sport}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <Button
                                        onClick={() => navigate('/profile/edit')}
                                        className="w-full py-4 bg-gradient-to-r from-primary to-blue-500 text-black hover:from-white hover:to-gray-100 border-0 shadow-glow font-bold text-lg"
                                    >
                                        Edit Profile
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Stats & Actions Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Card variant="glass" className="border-white/20 shadow-2xl p-6">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-xl">📊</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Statistics</h2>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/20">
                                        <h4 className="text-white/60 text-sm font-medium mb-1">Total Bookings</h4>
                                        <span className="text-3xl font-black text-white">0</span>
                                    </div>
                                    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border border-emerald-500/20">
                                        <h4 className="text-white/60 text-sm font-medium mb-1">Membership</h4>
                                        <span className="text-2xl font-bold text-emerald-400">FREE</span>
                                    </div>
                                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/20">
                                        <h4 className="text-white/60 text-sm font-medium mb-1">Games Played</h4>
                                        <span className="text-2xl font-bold text-white">0</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => navigate('/venues')}
                                        className="w-full py-3 bg-white/10 border border-white/20 text-white hover:bg-white/20"
                                    >
                                        Book a Court
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/bookings')}
                                        className="w-full py-3 bg-white/10 border border-white/20 text-white hover:bg-white/20"
                                    >
                                        View Bookings
                                    </Button>
                                    <Button
                                        onClick={handleLogout}
                                        className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                                    >
                                        Logout
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
