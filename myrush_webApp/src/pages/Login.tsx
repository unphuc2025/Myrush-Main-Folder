import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Login: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSendOTP = async () => {
        if (phoneNumber.length < 10) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            await apiClient.post('/auth/send-otp', { phone_number: formattedPhone });
            // Preserve the 'from' state if it exists
            navigate('/verify-otp', { state: { phoneNumber: formattedPhone, from: (location.state as any)?.from } });
        } catch (error) {
            console.error('Failed to send OTP', error);
            alert('Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] w-screen h-screen bg-black flex items-center justify-center p-4 overflow-hidden top-0 left-0 m-0">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black z-10" />
                <img
                    src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2035"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Card variant="glass" className="border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                            <span className="text-xl font-black text-primary tracking-widest">SPORTS</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 font-montserrat">
                            Welcome Back
                        </h1>
                        <p className="text-white/60 text-sm leading-relaxed">
                            From football to badminton and tennis, get live games, training, and bookings in one place.
                        </p>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-6">
                        <Input
                            type="tel"
                            placeholder="Enter mobile number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            maxLength={10}
                            icon={<span className="text-lg">📞</span>}
                            className="text-white placeholder-white/40 bg-white/5 border-white/10 focus:border-primary focus:ring-primary/10 transition-colors"
                        />

                        <Button
                            onClick={handleSendOTP}
                            disabled={isLoading}
                            size="lg"
                            className="w-full py-3 px-4 bg-primary text-black hover:bg-white hover:text-black border-0 font-bold uppercase tracking-wider"
                            icon={isLoading ? undefined : <span className="text-lg">→</span>}
                        >
                            {isLoading ? 'Sending OTP...' : 'Continue'}
                        </Button>
                    </div>

                    {/* Terms */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-white/40 leading-relaxed">
                            By continuing, you agree to our{' '}
                            <span className="text-primary hover:text-white transition-colors cursor-pointer font-semibold underline underline-offset-2">
                                Terms of Service
                            </span>{' '}
                            &{' '}
                            <span className="text-primary hover:text-white transition-colors cursor-pointer font-semibold underline underline-offset-2">
                                Privacy Policy
                            </span>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
