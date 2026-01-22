import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../api/client';
import { profileApi, type ProfileData } from '../api/profile';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaTrophy, FaCalendarAlt, FaVenusMars, FaEdit, FaHeart, FaCalendarCheck, FaClock, FaStar, FaGift, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [user, setUser] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ bookings: 0, gamesPlayed: 0 });
    const [currentView, setCurrentView] = useState<'profile' | 'bookings' | 'reviews'>('profile');
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
    const [reviewStates, setReviewStates] = useState<Record<string, { has_reviewed: boolean; review?: { rating: number; review_text: string } }>>({});
    const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

    useEffect(() => {
        const fetchProfileAndStats = async () => {
            try {
                setIsLoading(true);

                // First try to get user info from auth endpoint (which contains the logged-in user's data)
                let userPhoneNumber = null;
                try {
                    const authResponse = await apiClient.get('/auth/profile');
                    userPhoneNumber = authResponse.data.phone_number;
                    console.log('Auth profile phone:', userPhoneNumber);
                } catch (authErr) {
                    console.error('Failed to fetch auth profile', authErr);
                }

                // Fetch user profile data using JWT token (authenticated endpoint)
                const profileResponse = await profileApi.getProfile();
                if (profileResponse.success && profileResponse.data) {
                    console.log('Profile data phone:', profileResponse.data.phone_number);
                    setUser(profileResponse.data);
                } else {
                    // If profile doesn't exist yet, use the phone number from auth
                    setUser({
                        full_name: 'MyRush Player',
                        phone_number: userPhoneNumber || 'Not available',
                    });
                }

                // Fetch user statistics (bookings count)
                try {
                    const bookingsResponse = await apiClient.get('/bookings');
                    setStats(prev => ({ ...prev, bookings: bookingsResponse.data.length || 0 }));
                } catch (statsErr) {
                    console.log('Could not fetch booking stats');
                }

            } catch (err) {
                console.error('Failed to fetch profile', err);
                setUser({
                    full_name: 'MyRush Player',
                    phone_number: 'Not available'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileAndStats();
    }, []);

    const fetchBookings = async () => {
        try {
            setBookingsLoading(true);
            const bookingsResponse = await bookingsApi.getUserBookings();
            if (bookingsResponse.success) {
                // Process bookings to determine their actual status
                const processedBookings = bookingsResponse.data.map((b: any) => {
                    let status = b.status.toLowerCase();
                    if (status !== 'cancelled' && b.end_time) {
                        const bookingTime = new Date(`${b.booking_date}T${b.end_time}`);
                        if (bookingTime < new Date()) {
                            status = 'completed';
                        } else {
                            status = 'upcoming';
                        }
                    }
                    return { ...b, status };
                });

                setBookings(processedBookings);

                // Check review status for completed bookings
                const completedBookings = processedBookings.filter(
                    (b: any) => b.status === 'completed'
                );

                for (const booking of completedBookings) {
                    const reviewRes = await bookingsApi.checkBookingReviewed(booking.id);
                    if (reviewRes.success) {
                        setReviewStates(prev => ({
                            ...prev,
                            [booking.id]: reviewRes.data
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            setBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            setReviewsLoading(true);
            // First get user bookings to get review data
            const bookingsResponse = await bookingsApi.getUserBookings();
            if (bookingsResponse.success) {
                const userReviews: any[] = [];

                for (const booking of bookingsResponse.data) {
                    // Check if this booking has a review
                    const reviewRes = await bookingsApi.checkBookingReviewed(booking.id);
                    if (reviewRes.success && reviewRes.data.has_reviewed) {
                        // Add booking details with review info
                        userReviews.push({
                            ...booking,
                            review: reviewRes.data.review
                        });
                    }
                }

                // Sort reviews by creation date (most recent first)
                userReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setReviews(userReviews);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (currentView === 'bookings') {
            fetchBookings();
        } else if (currentView === 'reviews') {
            fetchReviews();
        }
    }, [currentView]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getInitials = (name?: string) => {
        if (!name) return 'MP';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getSkillBadgeColor = (skill?: string) => {
        switch (skill?.toLowerCase()) {
            case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'advanced': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'professional': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={`text-lg cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'hover:text-yellow-400' : ''}`}
                        onClick={() => interactive && onRate && onRate(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const handleSubmitReview = async (bookingId: string, courtId: string) => {
        if (selectedRating === 0) {
            alert('Please select a rating');
            return;
        }

        const res = await bookingsApi.submitReview(bookingId, courtId, selectedRating, reviewText);
        if (res.success) {
            setReviewStates(prev => ({
                ...prev,
                [bookingId]: {
                    has_reviewed: true,
                    review: { rating: selectedRating, review_text: reviewText }
                }
            }));
            setShowRatingModal(null);
            setSelectedRating(0);
            setReviewText('');
            alert('Review submitted successfully!');

            // Refresh reviews if we're in reviews view
            if (currentView === 'reviews') {
                fetchReviews();
            }
        } else {
            alert('Failed to submit review. Please try again.');
        }
    };

    const toggleBookingExpansion = (bookingId: string) => {
        setExpandedBookingId(prev => prev === bookingId ? null : bookingId);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav />

            <div className="flex pt-20">
                {/* Left Sidebar - Fixed Options */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="fixed left-0 top-20 w-80 bg-white border-r border-gray-200 h-[calc(100vh-5rem)] p-6 overflow-y-auto z-10"
                >
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>

                        {/* Profile Overview */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-gradient-to-r from-primary to-blue-500 rounded-2xl p-4 text-white mb-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                                    {getInitials(user?.full_name)}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">{user?.full_name || 'MyRush Player'}</h3>
                                    <p className="text-white/80 text-sm">{user?.phone_number}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Menu Options */}
                        <div className="space-y-2">
                            <motion.button
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => setCurrentView('profile')}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold flex items-center gap-3 ${currentView === 'profile'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                            >
                                <FaUser className="text-lg" />
                                Profile Information
                            </motion.button>

                            <motion.button
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => setCurrentView('bookings')}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium flex items-center gap-3 ${currentView === 'bookings'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                            >
                                <span className="text-lg">📅</span>
                                My Bookings
                            </motion.button>

                            <motion.button
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => setCurrentView('reviews')}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium flex items-center gap-3 ${currentView === 'reviews'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                            >
                                <FaStar className="text-lg" />
                                Rating & Reviews
                            </motion.button>

                            <hr className="my-4 border-gray-200" />

                            <motion.button
                                whileHover={{ backgroundColor: '#fee2e2' }}
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center gap-3"
                            >
                                <span className="text-lg">🚪</span>
                                Logout
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side - Content (Scrollable) */}
                <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="flex-1 ml-80 p-8 overflow-y-auto h-[calc(100vh-5rem)]"
                >
                    <div className="max-w-4xl">
                        {currentView === 'profile' ? (
                            <>
                                {/* Profile Header */}
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h1 className="text-3xl font-black text-gray-900 mb-2">Profile Information</h1>
                                        <p className="text-gray-600">Manage your account details and preferences</p>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={() => navigate('/profile/edit')}
                                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 border-2 border-primary"
                                        >
                                            <FaEdit />
                                            Edit Profile
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Profile Details Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    {/* Personal Information */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.6 }}
                                        className="bg-white rounded-2xl border-2 border-gray-200 p-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                                <FaUser className="text-primary" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <label className="text-sm font-medium text-gray-500 mb-1 block">Full Name</label>
                                                <p className="text-lg font-semibold text-gray-900">{user?.full_name || 'Not provided'}</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <label className="text-sm font-medium text-gray-500 mb-1 block">Phone Number</label>
                                                <p className="text-lg font-semibold text-gray-900">{user?.phone_number}</p>
                                            </div>

                                            {user?.email && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500 mb-1 block">Email Address</label>
                                                    <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                                                </div>
                                            )}

                                            {user?.city && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500 mb-1 block">City</label>
                                                    <p className="text-lg font-semibold text-gray-900">{user.city}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Sports & Preferences */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.6 }}
                                        className="bg-white rounded-2xl border-2 border-gray-200 p-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                                <FaHeart className="text-primary" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">Sports & Preferences</h2>
                                        </div>

                                        <div className="space-y-4">
                                            {user?.age && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500 mb-1 block">Age</label>
                                                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                        <FaCalendarAlt className="text-primary" />
                                                        {user.age} years old
                                                    </p>
                                                </div>
                                            )}

                                            {user?.gender && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500 mb-1 block">Gender</label>
                                                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                        <FaVenusMars className="text-primary" />
                                                        {user.gender}
                                                    </p>
                                                </div>
                                            )}

                                            {user?.skill_level && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500 mb-1 block">Skill Level</label>
                                                    <p className="text-lg font-semibold">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-sm border-2 ${getSkillBadgeColor(user.skill_level)}`}>
                                                            <FaTrophy className="inline mr-1" />
                                                            {user.skill_level}
                                                        </span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Sports Interests */}
                                {user?.sports && user.sports.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.6 }}
                                        className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-8"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                                <span className="text-lg">🎾</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">Sports Interests</h2>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {user.sports.map((sport, index) => (
                                                <span
                                                    key={index}
                                                    className="px-4 py-2 bg-primary/10 text-primary border-2 border-primary/20 rounded-full text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                                                >
                                                    {sport}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Statistics Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.6 }}
                                    className="bg-white rounded-2xl border-2 border-gray-200 p-6"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                            <span className="text-lg">📊</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Your Statistics</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-600">Total Bookings</p>
                                                    <p className="text-2xl font-bold text-blue-900">{stats.bookings}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-300">
                                                    <span className="text-blue-600 text-xl">📅</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-green-600">Games Played</p>
                                                    <p className="text-2xl font-bold text-green-900">{stats.gamesPlayed}</p>
                                                </div>
                                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center border border-green-300">
                                                    <span className="text-green-600 text-xl">⚽</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border-2 border-purple-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-purple-600">Membership</p>
                                                    <p className="text-lg font-bold text-purple-900">FREE</p>
                                                </div>
                                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-300">
                                                    <span className="text-purple-600 text-xl">⭐</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        ) : (
                            <>
                                {/* Bookings Header */}
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h1 className="text-3xl font-black text-gray-900 mb-2">My Bookings</h1>
                                        <p className="text-gray-600">View and manage your court bookings</p>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={() => navigate('/venues')}
                                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 border-2 border-primary"
                                        >
                                            <span>🏟️</span>
                                            Book New Court
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Booking Tabs */}
                                <div className="flex gap-2 mb-6 border-b border-gray-200">
                                    {['all', 'upcoming', 'completed', 'cancelled'].map(tab => (
                                        <button
                                            key={tab}
                                            className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === tab
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                            onClick={() => setActiveTab(tab as any)}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Bookings Content */}
                                {bookingsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span className="ml-3 text-gray-600">Loading bookings...</span>
                                    </div>
                                ) : currentView === 'reviews' ? (
                                    <div className="space-y-6">
                                        {/* Reviews Header */}
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h1 className="text-3xl font-black text-gray-900 mb-2">Rating & Reviews</h1>
                                                <p className="text-gray-600">View your feedback and ratings</p>
                                            </div>
                                        </div>

                                        {/* Reviews Content */}
                                        {reviewsLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span className="ml-3 text-gray-600">Loading your reviews...</span>
                                            </div>
                                        ) : reviews.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center"
                                            >
                                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <FaStar className="text-4xl text-gray-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                                                <p className="text-gray-600 mb-6">Complete a booking to leave your first review!</p>
                                                <Button
                                                    onClick={() => setCurrentView('bookings')}
                                                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold border-2 border-primary"
                                                >
                                                    View My Bookings
                                                </Button>
                                            </motion.div>
                                        ) : (
                                            <div className="space-y-6">
                                                {reviews.map((review, index) => (
                                                    <motion.div
                                                        key={review.id || index}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1, duration: 0.6 }}
                                                        className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow"
                                                    >
                                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                                                        <FaStar className="text-yellow-500" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-lg font-bold text-gray-900">Review for Booking #{review.booking_display_id || review.id}</h3>
                                                                        <p className="text-gray-600">🏟️ {review.venue_name || 'Venue'}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Rating Display */}
                                                                <div className="mb-4">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                                                                        {renderStars(review.review.rating)}
                                                                        <span className="text-sm text-gray-600 ml-2">
                                                                            {review.review.rating}/5 stars
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Review Text */}
                                                                {review.review.review_text && (
                                                                    <div className="mb-4">
                                                                        <p className="text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                                            "{review.review.review_text}"
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* Booking Details */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <FaCalendarCheck className="text-primary" />
                                                                        <span className="text-gray-600">Date:</span>
                                                                        <span className="font-semibold text-gray-900">{new Date(review.booking_date).toLocaleDateString()}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <FaClock className="text-primary" />
                                                                        <span className="text-gray-600">Time:</span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            {review.time_slots && review.time_slots.length > 0
                                                                                ? `${review.time_slots[0].start_time} - ${review.time_slots[0].end_time}`
                                                                                : 'TBD'
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600">Amount:</span>
                                                                        <span className="font-bold text-primary">₹{review.total_amount || review.price_per_hour || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Filter bookings based on active tab */}
                                        {bookings
                                            .filter(booking => {
                                                if (activeTab === 'all') return true;
                                                return booking.status === activeTab;
                                            })
                                            .map((booking, index) => {
                                                // Check if booking is completed
                                                const isCompleted = booking.status === 'completed' ||
                                                    (booking.end_time && new Date(`${booking.booking_date}T${booking.end_time}`) < new Date());

                                                return (
                                                    <motion.div
                                                        key={booking.id || index}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1, duration: 0.6 }}
                                                        className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow"
                                                    >
                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                                                        <span className="text-xl">🏟️</span>
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-lg font-bold text-gray-900">Booking #{booking.booking_display_id || booking.id}</h3>
                                                                        <p className="text-gray-600">Court booking</p>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <FaCalendarCheck className="text-primary" />
                                                                        <span className="text-gray-600">Date:</span>
                                                                        <span className="font-semibold text-gray-900">{new Date(booking.booking_date).toLocaleDateString()}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <FaClock className="text-primary" />
                                                                        <span className="text-gray-600">Time:</span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            {booking.time_slots && booking.time_slots.length > 0
                                                                                ? `${booking.time_slots[0].start_time} - ${booking.time_slots[0].end_time}`
                                                                                : 'TBD'
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600">Amount:</span>
                                                                        <span className="font-bold text-primary">₹{booking.total_amount || booking.price_per_hour || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-3">
                                                                <div className={`px-3 py-1 rounded-full text-xs font-semibold text-center ${booking.status === 'confirmed'
                                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                                    : booking.status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                                    }`}>
                                                                    {booking.status || 'Unknown'}
                                                                </div>

                                                                <div className="flex flex-col gap-2">
                                                                    <Button
                                                                        onClick={() => toggleBookingExpansion(booking.id)}
                                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-xl font-medium text-sm border-2 border-gray-200 flex items-center justify-center gap-2"
                                                                    >
                                                                        <FaEye className="text-sm" />
                                                                        {expandedBookingId === booking.id ? 'Hide Details' : 'View Details'}
                                                                    </Button>

                                                                    {isCompleted && (
                                                                        <Button
                                                                            onClick={() => setShowRatingModal(booking.id)}
                                                                            className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl font-medium text-sm border-2 border-primary/20 flex items-center justify-center gap-2"
                                                                        >
                                                                            <FaStar className="text-sm" />
                                                                            {reviewStates[booking.id]?.has_reviewed ? 'View Review' : 'Add Review'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Details Section */}
                                                        {expandedBookingId === booking.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                transition={{ duration: 0.3 }}
                                                                className="mt-6 pt-6 border-t border-gray-200"
                                                            >
                                                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                                    <FaEye className="text-primary" />
                                                                    Complete Booking Information
                                                                </h4>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">🏟️ Court Name:</span>
                                                                        <span className="font-semibold text-gray-900">{booking.venue_name || 'N/A'}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">📍 Location:</span>
                                                                        <span className="font-semibold text-gray-900">{booking.venue_location || 'N/A'}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">📅 Booking Date:</span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                                                                weekday: 'long',
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            })}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">🕒 Start Time:</span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            {booking.time_slots && booking.time_slots.length > 0
                                                                                ? booking.time_slots[0].start_time
                                                                                : booking.start_time || 'N/A'
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">🕐 End Time:</span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            {booking.time_slots && booking.time_slots.length > 0
                                                                                ? booking.time_slots[0].end_time
                                                                                : booking.end_time || 'N/A'
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">⏱️ Duration:</span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            {(() => {
                                                                                if (!booking.start_time || !booking.end_time) return 'N/A';
                                                                                const start = new Date(`2000-01-01T${booking.start_time}`);
                                                                                const end = new Date(`2000-01-01T${booking.end_time}`);
                                                                                const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                                                                                return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                                                                            })()}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">💰 Price per Hour:</span>
                                                                        <span className="font-semibold text-gray-900">₹{booking.price_per_hour || 'N/A'}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">💵 Total Amount:</span>
                                                                        <span className="font-bold text-primary">₹{booking.total_amount || 'N/A'}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">🆔 Booking ID:</span>
                                                                        <span className="font-semibold text-gray-900">{booking.booking_display_id || booking.id}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-600 font-medium">📝 Created On:</span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            {new Date(booking.created_at).toLocaleString('en-US', {
                                                                                year: 'numeric',
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Rewards Section */}
                                                                {isCompleted && (
                                                                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center border border-yellow-300">
                                                                                <FaGift className="text-yellow-600" />
                                                                            </div>
                                                                            <div>
                                                                                <h5 className="font-bold text-yellow-800">🎁 Booking Rewards</h5>
                                                                                <p className="text-sm text-yellow-700">You've earned points for completing this booking!</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-2xl border-2 border-gray-200 p-6 max-w-md w-full"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FaStar className="text-yellow-500" />
                                Rate Your Experience
                            </h3>
                            <button
                                onClick={() => {
                                    setShowRatingModal(null);
                                    setSelectedRating(0);
                                    setReviewText('');
                                }}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">How was your experience with this booking?</p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                            <div className="flex justify-center mb-2">
                                {renderStars(selectedRating, true, setSelectedRating)}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (Optional)</label>
                            <textarea
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                                placeholder="Share your experience about the venue, facilities, etc..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowRatingModal(null);
                                    setSelectedRating(0);
                                    setReviewText('');
                                }}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-3 rounded-xl font-medium border-2 border-gray-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    const booking = bookings.find(b => b.id === showRatingModal);
                                    if (booking) {
                                        handleSubmitReview(showRatingModal, booking.court_id || '');
                                    }
                                }}
                                disabled={selectedRating === 0}
                                className={`flex-1 ${selectedRating === 0 ? 'bg-primary/20 text-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white'} px-4 py-3 rounded-xl font-medium border-2 border-primary`}
                            >
                                Submit Review
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
