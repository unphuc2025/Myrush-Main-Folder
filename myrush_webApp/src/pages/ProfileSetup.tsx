import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { profileApi } from '../api/profile';
import type { City, GameType } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

export const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, logout } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [city, setCity] = useState('');
    const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
    const [gender, setGender] = useState('');
    const [handedness, setHandedness] = useState('Right-handed');
    const [skillLevel, setSkillLevel] = useState('');
    const [selectedSports, setSelectedSports] = useState<string[]>([]);
    const [playingStyle, setPlayingStyle] = useState('All-court');
    const [isSaving, setIsSaving] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const phone = location.state?.phone;

    useEffect(() => {
        if (phone) {
            setPhoneNumber(phone);
        }
    }, [phone]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingData(true);
                const [citiesRes, gameTypesRes, profileRes] = await Promise.all([
                    profileApi.getCities(),
                    profileApi.getGameTypes(),
                    profileApi.getProfile(),
                ]);

                if (citiesRes.success) {
                    setCities(citiesRes.data);
                }
                if (gameTypesRes.success) {
                    setGameTypes(gameTypesRes.data);
                }
                if (profileRes.success && profileRes.data) {
                    // Pre-populate form with existing profile data
                    const profile = profileRes.data;
                    setFullName(profile.full_name || '');
                    setAge(profile.age ? profile.age.toString() : '');
                    setCity(profile.city || '');
                    setSelectedCityId(profile.city_id || null);
                    setGender(profile.gender || '');
                    setHandedness(profile.handedness || 'Right-handed');
                    setSkillLevel(profile.skill_level || '');
                    setSelectedSports(profile.sports || []);
                    setPlayingStyle(profile.playing_style || 'All-court');
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    if (!phone) {
        navigate('/login');
        return null;
    }

    const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    const handednessOptions = ['Right-handed', 'Left-handed', 'Ambidextrous'];
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
    const playingStyles = ['Dinker', 'Banger', 'All-court', 'Net Player', 'Baseline'];

    const toggleSelection = (item: string, currentSelection: string[], setSelection: (val: string[]) => void) => {
        if (currentSelection.includes(item)) {
            setSelection(currentSelection.filter(i => i !== item));
        } else {
            setSelection([...currentSelection, item]);
        }
    };



    const handleContinue = async () => {
        if (!fullName.trim() || !age.trim() || !city.trim()) {
            alert('Please enter your full name, age, and city.');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        try {
            const ageNumber = parseInt(age, 10);

            const payload = {
                phone_number: phone,
                full_name: fullName.trim(),
                age: Number.isNaN(ageNumber) ? undefined : ageNumber,
                city: city.trim(),
                gender: gender || undefined,
                handedness,
                skill_level: skillLevel || undefined,
                sports: selectedSports,
                playing_style: playingStyle,
            };

            const response = await apiClient.post('/profile/', payload);

            // Profile saved successfully, navigate to dashboard
            navigate('/dashboard');
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Something went wrong while saving your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
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
                className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1.1, 1, 1.1],
                    y: [0, -20, 0]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-32 left-16 w-48 h-48 bg-gradient-to-r from-emerald-400/15 to-cyan-400/15 rounded-full blur-2xl"
            />

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-4xl"
                >
                    {/* Header */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                            className="inline-block p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 mb-4"
                        >
                            <span className="text-4xl">⚡</span>
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                            Complete Your Profile
                        </h1>
                        <p className="text-white/70 text-lg">Tell us about yourself to get personalized recommendations</p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Basic Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Card variant="glass" className="border-white/20 shadow-2xl p-8 h-full">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-xl">👤</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-2">Phone Number</label>
                                        <Input
                                            type="tel"
                                            value={phoneNumber}
                                            readOnly
                                            className="text-white placeholder-white/50 bg-white/10 border-white/20 focus:border-primary focus:ring-primary/20 h-12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                                        <Input
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="text-white placeholder-white/50 bg-white/10 border-white/20 focus:border-primary focus:ring-primary/20 h-12"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-2">Age</label>
                                            <Input
                                                type="number"
                                                placeholder="Age"
                                                value={age}
                                                onChange={(e) => setAge(e.target.value)}
                                                className="text-white placeholder-white/50 bg-white/10 border-white/20 focus:border-primary focus:ring-primary/20 h-12"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-2">City</label>
                                            <select
                                                value={selectedCityId || ''}
                                                onChange={(e) => {
                                                    const cityId = e.target.value;
                                                    const selectedCity = cities.find(c => c.id === cityId);
                                                    setSelectedCityId(cityId);
                                                    setCity(selectedCity ? selectedCity.name : '');
                                                }}
                                                className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                            >
                                                <option value="" disabled className="text-gray-800 bg-white">
                                                    Select City
                                                </option>
                                                {cities.map(cityOption => (
                                                    <option key={cityOption.id} value={cityOption.id} className="text-gray-800 bg-white">
                                                        {cityOption.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Right Column - Preferences */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Card variant="glass" className="border-white/20 shadow-2xl p-8 h-full">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-xl">🎯</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Player Preferences</h2>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">Gender</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {genders.map(g => (
                                                <button
                                                    key={g}
                                                    onClick={() => setGender(g)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${gender === g
                                                        ? 'bg-primary text-black shadow-lg transform scale-105'
                                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                                        }`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">Handedness</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {handednessOptions.map(h => (
                                                <button
                                                    key={h}
                                                    onClick={() => setHandedness(h)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${handedness === h
                                                        ? 'bg-primary text-black shadow-lg transform scale-105'
                                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                                        }`}
                                                >
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">Skill Level</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {skillLevels.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSkillLevel(s)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${skillLevel === s
                                                        ? 'bg-primary text-black shadow-lg transform scale-105'
                                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">Favorite Sports</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {gameTypes.map(sport => (
                                                <button
                                                    key={sport.name}
                                                    onClick={() => toggleSelection(sport.name, selectedSports, setSelectedSports)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedSports.includes(sport.name)
                                                        ? 'bg-primary text-black shadow-lg transform scale-105'
                                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                                        }`}
                                                >
                                                    {sport.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">Playing Style</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {playingStyles.map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPlayingStyle(p)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${playingStyle === p
                                                        ? 'bg-primary text-black shadow-lg transform scale-105'
                                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="px-8 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                        >
                            Back
                        </button>
                        <Button
                            onClick={handleContinue}
                            disabled={isSaving}
                            size="lg"
                            className="px-12 py-4 bg-gradient-to-r from-primary to-blue-500 text-black hover:from-white hover:to-gray-100 border-0 shadow-glow font-bold text-lg"
                        >
                            {isSaving ? (
                                <div className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                                    Saving...
                                </div>
                            ) : (
                                'Complete Profile'
                            )}
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
