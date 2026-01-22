import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { profileApi, type ProfileData, type City, type GameType } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaTrophy, FaCalendarAlt, FaVenusMars, FaHandPaper, FaHeartbeat, FaGamepad } from 'react-icons/fa';

export const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Profile fields matching mobile app
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [cityId, setCityId] = useState<string | null>(null);
    const [gender, setGender] = useState('');
    const [handedness, setHandedness] = useState('Right-handed');
    const [skillLevel, setSkillLevel] = useState('');
    const [selectedSports, setSelectedSports] = useState<string[]>([]);
    const [playingStyle, setPlayingStyle] = useState('All-court');

    // Data loading states
    const [cities, setCities] = useState<City[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dropdown states
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);

    // Options matching mobile app
    const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    const handednessOptions = ['Right-handed', 'Left-handed', 'Ambidextrous'];
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
    const playingStyles = ['Dinker', 'Banger', 'All-court', 'Net Player', 'Baseline'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load cities, game types, and current profile
            const [citiesRes, gameTypesRes, profileRes] = await Promise.all([
                profileApi.getCities(),
                profileApi.getGameTypes(),
                profileApi.getProfile()
            ]);

            if (citiesRes.success && citiesRes.data) {
                setCities(citiesRes.data);
            }

            if (gameTypesRes.success && gameTypesRes.data) {
                setGameTypes(gameTypesRes.data);
            }

            if (profileRes.success && profileRes.data) {
                const data = profileRes.data;
                setPhoneNumber(data.phone_number || '');
                setFullName(data.full_name || '');
                setAge(data.age ? data.age.toString() : '');
                setSelectedCity(data.city || '');
                setCityId(data.city_id || null);
                setGender(data.gender || '');
                setHandedness(data.handedness || 'Right-handed');
                setSkillLevel(data.skill_level || '');
                setSelectedSports(data.sports || []);
                setPlayingStyle(data.playing_style || 'All-court');
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSportSelection = (sportName: string) => {
        setSelectedSports(prev =>
            prev.includes(sportName)
                ? prev.filter(s => s !== sportName)
                : [...prev, sportName]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !age.trim() || !selectedCity.trim()) {
            alert('Please fill in your full name, age, and city.');
            return;
        }

        setSaving(true);
        try {
            const profileData: Partial<ProfileData> = {
                full_name: fullName.trim(),
                age: parseInt(age, 10) || undefined,
                city: selectedCity,
                city_id: cityId || undefined,
                gender: gender || undefined,
                handedness: handedness || undefined,
                skill_level: skillLevel || undefined,
                sports: selectedSports,
                playing_style: playingStyle || undefined,
            };

            const res = await profileApi.createOrUpdateProfile(profileData);

            if (res.success) {
                alert('Profile Updated Successfully!');
                navigate('/profile');
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('An error occurred while saving. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const renderChip = (label: string, isSelected: boolean, onClick: () => void) => (
        <motion.button
            type="button"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {label}
        </motion.button>
    );

    if (loading) {
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <TopNav />

            <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Edit Profile</h1>
                    <p className="text-gray-600">Personalize your player profile</p>
                </motion.div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Basic Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FaUser className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Phone Number (Read-only) */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaPhone className="text-primary" />
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        readOnly
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <span className="text-gray-400">🔒</span>
                                    </div>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaUser className="text-primary" />
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            {/* Age */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaCalendarAlt className="text-primary" />
                                    Age *
                                </label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter your age"
                                    min="1"
                                    max="120"
                                    required
                                />
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-primary" />
                                    City/Town *
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
                                            {selectedCity || 'Select your city'}
                                        </span>
                                        <span className="text-gray-400">▼</span>
                                    </button>

                                    {isCityDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                                        >
                                            {cities.map(city => (
                                                <button
                                                    key={city.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCity(city.name);
                                                        setCityId(city.id);
                                                        setIsCityDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                                                >
                                                    {city.name}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Gender */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FaVenusMars className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Gender</h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {genders.map(g => renderChip(g, gender === g, () => setGender(g)))}
                        </div>
                    </motion.div>

                    {/* Handedness */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FaHandPaper className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Handedness</h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {handednessOptions.map(h => renderChip(h, handedness === h, () => setHandedness(h)))}
                        </div>
                    </motion.div>

                    {/* Skill Level */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FaTrophy className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Skill Level</h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {skillLevels.map(s => renderChip(s, skillLevel === s, () => setSkillLevel(s)))}
                        </div>
                    </motion.div>

                    {/* Favorite Sports */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FaHeartbeat className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Favorite Sports</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <span className={selectedSports.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                                        {selectedSports.length > 0 ? selectedSports.join(', ') : 'Select your favorite sports'}
                                    </span>
                                    <span className="text-gray-400">▼</span>
                                </button>

                                {isSportsDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                                    >
                                        {gameTypes.map(gameType => (
                                            <button
                                                key={gameType.id}
                                                type="button"
                                                onClick={() => toggleSportSelection(gameType.name)}
                                                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                                            >
                                                <span className="text-gray-900">{gameType.name}</span>
                                                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${selectedSports.includes(gameType.name)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-gray-300'
                                                    }`}>
                                                    {selectedSports.includes(gameType.name) && (
                                                        <span className="text-white text-xs">✓</span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Playing Style */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FaGamepad className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Playing Style</h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {playingStyles.map(p => renderChip(p, playingStyle === p, () => setPlayingStyle(p)))}
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span>Save Changes</span>
                                </>
                            )}
                        </Button>
                    </motion.div>
                </form>
            </div>
        </div>
    );
};
