import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client';
import { profileApi, type ProfileData } from '../api/profile';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaUser, FaTrophy, FaEdit, FaCalendarCheck, FaClock, FaStar, FaChevronRight, FaFutbol, FaCalendarAlt, FaMapMarkerAlt, FaHeart } from 'react-icons/fa';
import { useFavorites } from '../context/FavoritesContext';
import { useNotification } from '../context/NotificationContext';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [user, setUser] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ bookings: 0, gamesPlayed: 0 });
    const [currentView, setCurrentView] = useState<'profile' | 'reviews' | 'favorites'>('profile');
    const { favorites, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [activeMobileSection, setActiveMobileSection] = useState<'profile' | 'reviews' | 'favorites' | null>(null);
    const [searchParams] = useSearchParams();
    const { showAlert } = useNotification();

    // Sync activeMobileSection with query parameter
    useEffect(() => {
        const view = searchParams.get('view');
        if (view === 'reviews') {
            setCurrentView('reviews');
            setActiveMobileSection('reviews');
        } else if (view === 'profile') {
            setCurrentView('profile');
            setActiveMobileSection('profile');
        } else if (view === 'favorites') {
            setCurrentView('favorites');
            setActiveMobileSection('favorites');
        }
    }, [searchParams]);

    const toggleMobileSection = (section: 'profile' | 'reviews' | 'favorites') => {
        setActiveMobileSection(prev => prev === section ? null : section);
        setCurrentView(section);
    };



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
        if (currentView === 'reviews') {
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

            <div className="flex flex-col lg:flex-row pt-16 lg:pt-20">
                <div className="lg:hidden flex-1 p-4 space-y-6 pt-10">
                    {/* 1. Profile Header (Mobile) */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20">
                                {getInitials(user?.full_name)}
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-gray-900">{user?.full_name || 'MyRush Player'}</h1>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{user?.phone_number || 'Athlete'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile/edit')}
                            className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-primary"
                        >
                            <FaEdit size={18} />
                        </button>
                    </div>

                    {/* 2. Quick Stats Row (Mobile) */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Bookings</span>
                            <span className="text-2xl font-black text-gray-900">{stats.bookings}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Played</span>
                            <span className="text-2xl font-black text-gray-900">{stats.gamesPlayed}</span>
                        </div>
                    </div>

                    {/* 3. Accordion Navigation (Mobile) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <span className="w-1 h-4 bg-primary rounded-full"></span>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Account Details</h2>
                        </div>

                        {/* Profile Info Accordion (Mobile) */}
                        <div className="space-y-2">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleMobileSection('profile')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${activeMobileSection === 'profile' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeMobileSection === 'profile' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                                        <FaUser size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">Personal Information</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Manage your name, email & city</p>
                                    </div>
                                </div>
                                <FaChevronRight size={12} className={`transition-transform duration-300 ${activeMobileSection === 'profile' ? 'text-primary rotate-90' : 'text-gray-300'}`} />
                            </motion.button>

                            <AnimatePresence>
                                {activeMobileSection === 'profile' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden px-1"
                                    >
                                        <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-1 space-y-6 shadow-sm">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Full Name</label>
                                                    <p className="text-base font-bold text-gray-900">{user?.full_name || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Phone Number</label>
                                                    <p className="text-base font-bold text-gray-900">{user?.phone_number}</p>
                                                </div>
                                                {user?.email && (
                                                    <div>
                                                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Email</label>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                                                    </div>
                                                )}
                                                {user?.city && (
                                                    <div>
                                                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">City</label>
                                                        <p className="text-sm font-semibold text-gray-900">{user.city}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-gray-50 space-y-4">
                                                <h3 className="text-xs font-black text-gray-900 uppercase">Sports Profile</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {user?.age && (
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-gray-400 block">Age</label>
                                                            <p className="text-sm font-bold text-gray-900">{user.age}</p>
                                                        </div>
                                                    )}
                                                    {user?.gender && (
                                                        <div>
                                                            <label className="text-[9px] uppercase font-bold text-gray-400 block">Gender</label>
                                                            <p className="text-sm font-bold text-gray-900">{user.gender}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {user?.skill_level && (
                                                    <div>
                                                        <label className="text-[9px] uppercase font-bold text-gray-400 mb-2 block">Skill Level</label>
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold border ${getSkillBadgeColor(user.skill_level)}`}>
                                                            <FaTrophy className="mr-1.5" />
                                                            {user.skill_level}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>


                        {/* Ratings Accordion (Mobile) */}
                        <div className="space-y-2">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleMobileSection('reviews')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeMobileSection === 'reviews' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeMobileSection === 'reviews' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                                        <FaStar size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">Rating & Reviews</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Feedback on your games</p>
                                    </div>
                                </div>
                                <FaChevronRight size={12} className={`transition-transform duration-300 ${activeMobileSection === 'reviews' ? 'text-primary rotate-90' : 'text-gray-300'}`} />
                            </motion.button>

                            <AnimatePresence>
                                {activeMobileSection === 'reviews' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden px-1"
                                    >
                                        <div className="bg-white rounded-xl border border-gray-100 p-3 mt-1 shadow-sm">
                                            {reviewsLoading ? (
                                                <div className="py-8 text-center font-bold text-xs text-gray-400 uppercase tracking-widest">Loading...</div>
                                            ) : reviews.length === 0 ? (
                                                <div className="py-10 text-center font-bold text-xs text-gray-300 uppercase tracking-widest leading-relaxed">No reviews submitted yet.<br />Complete games to rate them!</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {reviews.map((rev, i) => (
                                                        <div key={i} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="text-[11px] font-black text-gray-900">{rev.venue_name}</h4>
                                                                <div className="flex text-yellow-400 text-[10px]">{'★'.repeat(rev.review.rating)}</div>
                                                            </div>
                                                            <p className="text-[10px] text-gray-600 italic leading-relaxed">"{rev.review.review_text}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Favorites Accordion (Mobile) */}
                        <div className="space-y-2">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleMobileSection('favorites')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeMobileSection === 'favorites' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeMobileSection === 'favorites' ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                        <FaHeart size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">My Favorites</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Your saved arenas & courts</p>
                                    </div>
                                </div>
                                <FaChevronRight size={12} className={`transition-transform duration-300 ${activeMobileSection === 'favorites' ? 'text-primary rotate-90' : 'text-gray-300'}`} />
                            </motion.button>

                            <AnimatePresence>
                                {activeMobileSection === 'favorites' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden px-1"
                                    >
                                        <div className="bg-white rounded-xl border border-gray-100 p-3 mt-1 shadow-sm">
                                            {favoritesLoading ? (
                                                <div className="py-8 text-center font-bold text-xs text-gray-400 uppercase tracking-widest">Loading...</div>
                                            ) : favorites.length === 0 ? (
                                                <div className="py-10 text-center font-bold text-xs text-gray-300 uppercase tracking-widest leading-relaxed">No favorites yet.<br />Save your favorite arenas for quick access!</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {favorites.map((venue, i) => (
                                                        <div key={i} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div onClick={() => navigate(`/venues/${venue.id}`)} className="cursor-pointer">
                                                                    <h4 className="text-[11px] font-black text-gray-900">{venue.court_name}</h4>
                                                                    <p className="text-[9px] text-gray-500"><FaMapMarkerAlt className="inline-block mr-1 text-[8px]" /> {venue.location}</p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleFavorite(venue.id);
                                                                    }}
                                                                    className="text-red-500 p-1"
                                                                >
                                                                    <FaHeart size={14} />
                                                                </button>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <div className="text-[9px] font-bold text-primary">₹{venue.prices}/hr</div>
                                                                <Button
                                                                    onClick={() => navigate(`/venues/${venue.id}`)}
                                                                    className="bg-zinc-900 text-white text-[8px] px-3 py-1 rounded-lg font-black uppercase"
                                                                >
                                                                    Book Now
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>

                    </div>

                    {/* Settings Area (Bottom Mobile) */}
                    <div className="pt-8 pb-32">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest border border-red-100 shadow-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Desktop Sidebar (Existing Logic) */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="hidden lg:flex relative lg:fixed lg:left-0 lg:top-20 w-80 bg-white border-r border-gray-200 h-[calc(100vh-5rem)] p-6 overflow-y-auto z-10"
                >
                    <div className="space-y-4">
                        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Account Settings</h2>

                        {/* Profile Overview */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-gradient-to-r from-primary to-blue-500 rounded-xl p-4 text-white mb-4 lg:mb-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                                    {getInitials(user?.full_name)}
                                </div>
                                <div>
                                    <h3 className="text-sm lg:text-base font-bold truncate max-w-[150px] lg:max-w-none">{user?.full_name || 'MyRush Player'}</h3>
                                    <p className="text-white/80 text-xs lg:text-sm">{user?.phone_number}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Menu Options */}
                        <div className="space-y-2">
                            <motion.button
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => setCurrentView('profile')}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold flex items-center gap-3 transition-colors ${currentView === 'profile'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                            >
                                <FaUser className="text-base lg:text-lg" />
                                <span className="text-sm lg:text-base">Profile Information</span>
                            </motion.button>


                            <motion.button
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => setCurrentView('reviews')}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium flex items-center gap-3 transition-colors ${currentView === 'reviews'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                            >
                                <FaStar className="text-base lg:text-lg" />
                                <span className="text-sm lg:text-base">Rating & Reviews</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => setCurrentView('favorites')}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium flex items-center gap-3 transition-colors ${currentView === 'favorites'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                            >
                                <FaHeart className="text-base lg:text-lg text-red-500" />
                                <span className="text-sm lg:text-base">My Favorites</span>
                            </motion.button>

                            <hr className="my-4 border-gray-200" />

                            <motion.button
                                whileHover={{ backgroundColor: '#fee2e2' }}
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center gap-3 transition-colors"
                            >
                                <span className="text-base lg:text-lg">🚪</span>
                                <span className="text-sm lg:text-base">Logout</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Content Area - Offset on desktop, hidden on mobile in favor of accordion */}
                <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="hidden lg:block flex-1 lg:ml-80 p-8 lg:overflow-y-auto lg:h-[calc(100vh-5rem)]"
                >
                    <div className="max-w-5xl mx-auto">
                        {currentView === 'profile' ? (
                            <>
                                {/* Profile Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                    <div>
                                        <h1 className="text-2xl lg:text-4xl font-black text-gray-900 mb-1 lg:mb-2 tracking-tight">Profile <span className="text-primary italic">Settings</span></h1>
                                        <p className="text-gray-500 lg:text-gray-600 text-xs md:text-sm lg:text-lg">Manage your account details and preferences</p>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                                        <Button
                                            onClick={() => navigate('/profile/edit')}
                                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-full font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all"
                                        >
                                            <FaEdit />
                                            Edit Profile
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Profile Details Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    {/* Personal Information */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.6 }}
                                        className="bg-white rounded-xl p-6 md:p-8 border-2 border-gray-100 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FaUser size={120} />
                                        </div>
                                        <div className="flex items-center gap-4 mb-8 relative z-10">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-lg text-white text-xl">
                                                <FaUser />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">Personal Info</h2>
                                        </div>

                                        <div className="space-y-6 relative z-10">
                                            <div>
                                                <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1 block">Full Name</label>
                                                <p className="text-xl font-bold text-gray-900">{user?.full_name || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1 block">Phone Number</label>
                                                <p className="text-xl font-bold text-gray-900">{user?.phone_number}</p>
                                            </div>
                                            {(user?.email || user?.city) && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {user?.email && (
                                                        <div>
                                                            <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1 block">Email</label>
                                                            <p className="text-base font-semibold text-gray-900 truncate">{user.email}</p>
                                                        </div>
                                                    )}
                                                    {user?.city && (
                                                        <div>
                                                            <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1 block">City</label>
                                                            <p className="text-base font-semibold text-gray-900">{user.city}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Sports & Preferences */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.6 }}
                                        className="bg-white rounded-xl p-6 md:p-8 border-2 border-gray-100 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FaTrophy size={120} />
                                        </div>
                                        <div className="flex items-center gap-4 mb-8 relative z-10">
                                            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg text-white text-xl">
                                                <FaTrophy />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">Sports Profile</h2>
                                        </div>

                                        <div className="space-y-6 relative z-10">
                                            <div className="grid grid-cols-2 gap-6">
                                                {user?.age && (
                                                    <div>
                                                        <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1 block">Age</label>
                                                        <p className="text-xl font-bold text-gray-900">{user.age}</p>
                                                    </div>
                                                )}
                                                {user?.gender && (
                                                    <div>
                                                        <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1 block">Gender</label>
                                                        <p className="text-xl font-bold text-gray-900">{user.gender}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {user?.skill_level && (
                                                <div>
                                                    <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2 block">Skill Level</label>
                                                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border ${getSkillBadgeColor(user.skill_level)}`}>
                                                        <FaTrophy className="mr-2" />
                                                        {user.skill_level}
                                                    </span>
                                                </div>
                                            )}

                                            {user?.sports && user.sports.length > 0 && (
                                                <div>
                                                    <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2 block">Interests</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.sports.map((sport, index) => (
                                                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                                                                {sport}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Statistics Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.6 }}
                                    className="mb-8"
                                >
                                    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Performance</span>
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="glass-card rounded-xl p-6 hover:shadow-glow transition-all cursor-default">
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Bookings</p>
                                            <div className="flex justify-between items-end">
                                                <p className="text-4xl font-black text-gray-900">{stats.bookings}</p>
                                                <div className="text-blue-500 bg-blue-50 p-2 rounded-lg"><FaCalendarCheck /></div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
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
                                        className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center"
                                    >
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <FaStar className="text-4xl text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                                        <p className="text-gray-600 mb-6">Complete a booking to leave your first review!</p>
                                        <Button
                                            onClick={() => navigate('/bookings')}
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
                                                className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow"
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                                                <FaStar className="text-yellow-500" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-gray-900">Review for Booking #{review.booking_display_id || review.id}</h3>
                                                                <p className="text-gray-600"><FaFutbol className="inline-block mr-1" /> {review.venue_name || 'Venue'}</p>
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
                        ) : null}

                                {currentView === 'favorites' && (
                                    <div className="space-y-6">
                                        {/* Favorites Header */}
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h1 className="text-3xl font-black text-gray-900 mb-2">My Favorites</h1>
                                                <p className="text-gray-600">Quickly book your favorite sports venues</p>
                                            </div>
                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Button
                                                    onClick={() => navigate('/venues')}
                                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 border-2 border-primary"
                                                >
                                                    <span><FaFutbol className="inline-block mr-1" /></span>
                                                    Explore More Venues
                                                </Button>
                                            </motion.div>
                                        </div>

                                        {/* Favorites Content */}
                                        {favoritesLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span className="ml-3 text-gray-600">Loading your favorites...</span>
                                            </div>
                                        ) : favorites.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center"
                                            >
                                                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <FaHeart className="text-4xl text-red-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Favorites Yet</h3>
                                                <p className="text-gray-600 mb-6">Save your favorite venues to find them easily next time!</p>
                                                <Button
                                                    onClick={() => navigate('/venues')}
                                                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold border-2 border-primary"
                                                >
                                                    Explore Venues
                                                </Button>
                                            </motion.div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {favorites.map((venue, index) => (
                                                    <motion.div
                                                        key={venue.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1, duration: 0.6 }}
                                                        whileHover={{ y: -5 }}
                                                        onClick={() => navigate(`/venues/${venue.id}`)}
                                                        className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                                                    >
                                                        <div className="relative h-48">
                                                            <img
                                                                src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2000'}
                                                                alt={venue.court_name}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleFavorite(venue.id);
                                                                }}
                                                                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform z-10"
                                                            >
                                                                <FaHeart size={18} />
                                                            </button>
                                                        </div>
                                                        <div className="p-6">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{venue.court_name}</h3>
                                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                                    <FaStar className="text-yellow-500 text-xs" />
                                                                    <span className="text-xs font-bold text-gray-900">{venue.rating || '5.0'}</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-gray-500 flex items-center gap-2 mb-6">
                                                                <FaMapMarkerAlt className="text-primary" />
                                                                {venue.location}
                                                            </p>
                                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Starting from</span>
                                                                    <span className="text-lg font-black text-gray-900">₹{venue.prices}<span className="text-xs font-normal text-gray-500">/hr</span></span>
                                                                </div>
                                                                <Button
                                                                    onClick={() => navigate(`/venues/${venue.id}`)}
                                                                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-zinc-200"
                                                                >
                                                                    Book Now
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                    </div>
                </motion.div>
            </div>


        </div>
    );
};
