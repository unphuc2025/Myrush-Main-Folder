import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { apiClient } from '../../api/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface LoginStepProps {
    onSuccess: (phone: string) => void;
}

const countryCodes = [
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+1', name: 'USA', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
];

export const LoginStep: React.FC<LoginStepProps> = ({ onSuccess }) => {
    const { closeAuthModal } = useAuth();
    const { showAlert } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleTermsNavigate = () => {
        closeAuthModal();
        navigate('/terms', { state: { ...location.state, temp_close_auth: true } });
    };

    const handleSendOTP = async () => {
        if (phoneNumber.length < 5) { // Adjusted to allow various lengths
            showAlert('Please enter a valid mobile number', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = `${countryCode}${phoneNumber}`;
            await apiClient.post('/auth/send-otp', { phone_number: formattedPhone });
            onSuccess(formattedPhone);
        } catch (error) {
            console.error('Failed to send OTP', error);
            showAlert('Failed to send OTP. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase font-heading">Login / Signup</h2>
                <p className="text-gray-500 text-sm">Enter your number to continue</p>
            </div>

            <div className="space-y-4">
                <div className="flex gap-3">
                    <div className="relative w-[110px] shrink-0">
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl text-black px-3 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all font-bold cursor-pointer text-sm"
                        >
                            {countryCodes.map((c) => (
                                <option key={`${c.code}-${c.name}`} value={c.code} className="bg-white text-black font-sans">
                                    {c.flag} {c.code}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
                            ▼
                        </div>
                    </div>
                    <div className="relative flex-1">
                        <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Mobile Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            maxLength={15}
                            className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl text-black px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all font-sans text-lg placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <Button
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    size="lg"
                    className="w-full h-14 bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-glow"
                >
                    {isLoading ? 'Sending OTP...' : 'Get OTP'}
                </Button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-6 uppercase tracking-wider font-bold">
                By continuing, you agree to our <br />
                <button
                    onClick={handleTermsNavigate}
                    className="text-gray-900 underline hover:text-primary transition-colors focus:outline-none"
                >
                    Terms
                </button> & <button
                    onClick={handleTermsNavigate}
                    className="text-gray-900 underline hover:text-primary transition-colors focus:outline-none"
                >
                    Privacy Policy
                </button>
            </p>
        </div>
    );
};
