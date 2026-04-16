import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { profileApi, type City, type GameType } from '../../api/profile';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';

interface OnboardingStepProps {
    phone: string;
    token?: string | null;
    onSuccess: () => void;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({ phone, token, onSuccess }) => {
    const { login } = useAuth();
    const { showAlert } = useNotification();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
    const [selectedSports, setSelectedSports] = useState<string[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [citiesRes, gameTypesRes] = await Promise.all([
                    profileApi.getCities(),
                    profileApi.getGameTypes(),
                ]);
                if (citiesRes.success) setCities(citiesRes.data);
                if (gameTypesRes.success) setGameTypes(gameTypesRes.data);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const handleComplete = async () => {
        if (!fullName.trim() || !age.trim() || !selectedCityId) {
            showAlert('Please fill in your name, age, and city.', 'warning');
            return;
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
             showAlert('Please enter a valid email address.', 'warning');
             return;
        }
        setIsSaving(true);
        try {
            if (token) {
                login(token);
            }
            const cityName = cities.find(c => c.id === selectedCityId)?.name || '';
            await apiClient.post('/profile/', {
                phone_number: phone,
                full_name: fullName.trim(),
                email: email.trim() || undefined,
                age: parseInt(age, 10),
                city: cityName,
                sports: selectedSports,
                handedness: 'Right-handed', // Defaulting for simple modal flow
                playing_style: 'All-court'
            });
            onSuccess();
        } catch (error) {
            showAlert('Failed to save profile. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loadingData) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading onboarding...</div>;

    return (
        <div className="space-y-4 overflow-visible pb-2">
            <div className="mb-2">
                <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase font-heading tracking-tight">Complete Profile</h2>
                <p className="text-gray-500 text-xs">Join the Rush community</p>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Name</label>
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-bold"
                    />
                </div>
                
                <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email</label>
                    <input
                        type="email"
                        placeholder="Your Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-bold"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Age</label>
                    <input
                        type="number"
                        placeholder="Age"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-bold"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">City</label>
                    <div className="relative">
                        <select
                            value={selectedCityId || ''}
                            onChange={e => setSelectedCityId(e.target.value)}
                            className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-bold appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select City</option>
                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Favorite Sports</label>
                    <MultiSelectDropdown
                        options={gameTypes}
                        selected={selectedSports}
                        onChange={setSelectedSports}
                        placeholder="Select Sports"
                    />
                </div>
            </div>

            <Button
                onClick={handleComplete}
                disabled={isSaving}
                size="lg"
                className="w-full h-14 bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-glow mt-4"
            >
                {isSaving ? 'Saving...' : 'Complete Profile'}
            </Button>
        </div>
    );
};
