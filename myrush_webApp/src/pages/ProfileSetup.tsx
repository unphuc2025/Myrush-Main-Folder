import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { profileApi } from '../api/profile';
import type { City, GameType } from '../api/profile';
import { useAuth } from '../context/AuthContext';

export const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

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
    const pendingToken = location.state?.token;

    useEffect(() => {
        if (phone) setPhoneNumber(phone);
    }, [phone]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingData(true);
                const [citiesRes, gameTypesRes] = await Promise.all([
                    profileApi.getCities(),
                    profileApi.getGameTypes(),
                ]);
                if (citiesRes.success) setCities(citiesRes.data);
                if (gameTypesRes.success) setGameTypes(gameTypesRes.data);

                if (!location.state?.token) {
                    try {
                        const profileRes = await profileApi.getProfile();
                        if (profileRes.success && profileRes.data) {
                            const p = profileRes.data;
                            setFullName(p.full_name || '');
                            setAge(p.age ? p.age.toString() : '');
                            setCity(p.city || '');
                            setSelectedCityId(p.city_id || null);
                            setGender(p.gender || '');
                            setHandedness(p.handedness || 'Right-handed');
                            setSkillLevel(p.skill_level || '');
                            setSelectedSports(p.sports || []);
                            setPlayingStyle(p.playing_style || 'All-court');
                        }
                    } catch { /* new user */ }
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
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

    const toggle = (item: string, list: string[], setList: (v: string[]) => void) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const handleContinue = async () => {
        if (!fullName.trim() || !age.trim() || !city.trim()) {
            alert('Please enter your full name, age, and city.');
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (pendingToken) {
                login(pendingToken);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const ageNumber = parseInt(age, 10);
            await apiClient.post('/profile/', {
                phone_number: phone,
                full_name: fullName.trim(),
                age: Number.isNaN(ageNumber) ? undefined : ageNumber,
                city: city.trim(),
                gender: gender || undefined,
                handedness,
                skill_level: skillLevel || undefined,
                sports: selectedSports,
                playing_style: playingStyle,
            });
            navigate('/dashboard');
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Something went wrong while saving your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${active
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black'
                }`}
        >
            {label}
        </button>
    );

    const SectionLabel = ({ children }: { children: React.ReactNode }) => (
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
    );

    return (

        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl mx-auto">

                {/* Header */}
                <div className="text-center mb-6 md:mb-8">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                        <span className="text-[10px] md:text-xs font-black text-primary tracking-widest">MYRUSH SPORTS</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-heading uppercase tracking-tight mb-2">
                        Complete Your<span className="text-primary">.</span><br />Profile
                    </h1>
                    <p className="text-gray-500 text-xs md:text-sm max-w-[280px] md:max-w-xs mx-auto">Tell us about yourself to get personalized recommendations.</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 md:p-8 mb-6">

                    {/* Phone */}
                    <div className="mb-6">
                        <SectionLabel>Phone Number</SectionLabel>
                        <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl transition-colors hover:border-gray-300">
                            <span className="text-base">📞</span>
                            <span className="text-gray-700 text-sm font-semibold tracking-wide">{phoneNumber}</span>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="mb-6">
                        <SectionLabel>Full Name</SectionLabel>
                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                        />
                    </div>

                    {/* Age + City */}
                    <div className="grid grid-cols-2 gap-5 mb-6">
                        <div>
                            <SectionLabel>Age</SectionLabel>
                            <input
                                type="number"
                                placeholder="Your age"
                                value={age}
                                onChange={e => setAge(e.target.value)}
                                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <SectionLabel>City</SectionLabel>
                            <div className="relative">
                                <select
                                    value={selectedCityId || ''}
                                    onChange={e => {
                                        const id = e.target.value;
                                        const found = cities.find(c => c.id === id);
                                        setSelectedCityId(id);
                                        setCity(found ? found.name : '');
                                    }}
                                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none shadow-sm cursor-pointer"
                                >
                                    <option value="" disabled>Select City</option>
                                    {cities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-6" />

                    {/* Gender */}
                    <div className="mb-6">
                        <SectionLabel>Gender</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {genders.map(g => <Pill key={g} label={g} active={gender === g} onClick={() => setGender(g)} />)}
                        </div>
                    </div>

                    {/* Handedness */}
                    <div className="mb-6">
                        <SectionLabel>Handedness</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {handednessOptions.map(h => <Pill key={h} label={h} active={handedness === h} onClick={() => setHandedness(h)} />)}
                        </div>
                    </div>

                    {/* Skill Level */}
                    <div className="mb-6">
                        <SectionLabel>Skill Level</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {skillLevels.map(s => <Pill key={s} label={s} active={skillLevel === s} onClick={() => setSkillLevel(s)} />)}
                        </div>
                    </div>

                    {/* Sports */}
                    {gameTypes.length > 0 && (
                        <div className="mb-6">
                            <SectionLabel>Favourite Sports</SectionLabel>
                            <div className="flex flex-wrap gap-2">
                                {gameTypes.map(sp => (
                                    <Pill
                                        key={sp.name}
                                        label={sp.name}
                                        active={selectedSports.includes(sp.name)}
                                        onClick={() => toggle(sp.name, selectedSports, setSelectedSports)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Playing Style */}
                    <div className="mb-2">
                        <SectionLabel>Playing Style</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {playingStyles.map(p => <Pill key={p} label={p} active={playingStyle === p} onClick={() => setPlayingStyle(p)} />)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full md:flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm uppercase tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm order-2 md:order-1"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={isSaving}
                        className="w-full md:flex-[2] h-12 md:h-14 rounded-xl md:rounded-2xl bg-black text-white font-black text-sm uppercase tracking-wider hover:bg-gray-900 transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 order-1 md:order-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Complete Profile →'
                        )}
                    </button>
                </div>

                <p className="text-center text-xs text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
                    By continuing, you agree to our{' '}
                    <Link to="/terms" target="_blank" className="text-gray-900 font-bold cursor-pointer hover:underline decoration-2 underline-offset-2">Terms of Service</Link>
                    {' '}&{' '}
                    <Link to="/terms" target="_blank" className="text-gray-900 font-bold cursor-pointer hover:underline decoration-2 underline-offset-2">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
};
