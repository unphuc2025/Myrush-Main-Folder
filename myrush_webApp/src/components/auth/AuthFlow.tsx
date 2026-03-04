import React, { useState } from 'react';
import { LoginStep } from './LoginStep';
import { OTPStep } from './OTPStep';
import { OnboardingStep } from './OnboardingStep';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const AuthFlow: React.FC = () => {
    const [step, setStep] = useState<'login' | 'otp' | 'onboarding'>('login');
    const [phone, setPhone] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const { login, closeAuthModal } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLoginSuccess = (formattedPhone: string) => {
        setPhone(formattedPhone);
        setStep('otp');
    };

    const handleOTPSuccess = (data: { needs_profile: boolean; access_token?: string }) => {
        if (data.needs_profile) {
            setToken(data.access_token || null);
            setStep('onboarding');
        } else if (data.access_token) {
            login(data.access_token);
            closeAuthModal();
            // Handle redirect if coming from a protected route
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    };

    const handleOnboardingSuccess = () => {
        if (token) login(token);
        closeAuthModal();
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            {step === 'login' && <LoginStep onSuccess={handleLoginSuccess} />}
            {step === 'otp' && <OTPStep phone={phone} onSuccess={handleOTPSuccess} onBack={() => setStep('login')} />}
            {step === 'onboarding' && <OnboardingStep phone={phone} token={token} onSuccess={handleOnboardingSuccess} />}
        </div>
    );
};
