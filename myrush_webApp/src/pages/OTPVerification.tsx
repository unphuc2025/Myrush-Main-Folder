import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FaArrowLeft } from 'react-icons/fa';

export const OTPVerification: React.FC = () => {
    const [otp, setOtp] = useState(['', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

    const location = useLocation();
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/';
            const fromState = (location.state as any)?.from?.state;
            navigate(from, { replace: true, state: fromState });
        }
    }, [isAuthenticated, navigate, location]);

    const phone = location.state?.phoneNumber || location.state?.phone;

    if (!phone) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Button onClick={() => navigate('/login')} variant="primary">Go to Login</Button>
            </div>
        );
    }

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) value = value[value.length - 1];
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < otp.length - 1) otpInputs.current[index + 1]?.focus();

        const enteredOTP = newOtp.join('');
        if (enteredOTP.length === 5) {
            verifyOTP(enteredOTP);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const verifyOTP = async (enteredOTP: string) => {
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/verify-otp', {
                phone_number: phone,
                otp_code: enteredOTP
            });

            if (response.data.needs_profile) {
                // New user — navigate to profile setup WITHOUT calling login() yet.
                // Calling login() would set isAuthenticated=true and the useEffect
                // would redirect to '/' before navigate('/setup-profile') fires.
                navigate('/setup-profile', {
                    state: {
                        phone,
                        token: response.data.access_token || null
                    }
                });
            } else if (response.data.access_token) {
                // Existing user — log in and redirect
                login(response.data.access_token);
                const from = (location.state as any)?.from?.pathname || '/';
                const fromState = (location.state as any)?.from?.state;
                navigate(from, { replace: true, state: fromState });
            } else {
                setError('Verification failed');
                setOtp(['', '', '', '', '']);
                otpInputs.current[0]?.focus();
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid OTP');
            setOtp(['', '', '', '', '']);
            otpInputs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setOtp(['', '', '', '', '']);
        setError('');
        try {
            await apiClient.post('/auth/send-otp', { phone_number: phone });
            alert('OTP resent successfully');
        } catch (error) {
            alert('Failed to resend OTP');
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
                <Card variant="glass" className="border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl relative">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
                        title="Change Number"
                    >
                        <FaArrowLeft size={18} />
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                            <span className="text-xl font-black text-primary tracking-widest">VERIFY</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 font-montserrat">
                            Enter Code
                        </h1>
                        <p className="text-white/60 text-sm">
                            We've sent a 5-digit code to {phone}
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-3 mb-6">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(ref) => { otpInputs.current[index] = ref; }}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyPress(e, index)}
                                className="w-12 h-12 md:w-14 md:h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm text-center font-semibold">{error}</p>
                        </div>
                    )}

                    {/* Dev Hint */}
                    <div className="text-center mb-6">
                        <p className="text-xs text-white/30">Try: <span className="text-primary/70 font-bold">12345</span></p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <Button
                            onClick={() => verifyOTP(otp.join(''))}
                            disabled={loading || otp.join('').length !== 5}
                            size="lg"
                            className="w-full py-3 px-4 bg-primary text-black hover:bg-primary-hover border-0 font-bold uppercase tracking-wider"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </Button>

                        <div className="flex justify-between items-center text-sm pt-2">
                            <button
                                onClick={handleResendOTP}
                                className="text-primary hover:text-white transition-colors font-semibold text-xs uppercase tracking-wide"
                            >
                                Resend Code
                            </button>
                            <button
                                onClick={() => {
                                    setOtp(['', '', '', '', '']);
                                    navigate('/login');
                                }}
                                className="text-white/40 hover:text-white transition-colors text-xs uppercase tracking-wide"
                            >
                                Change Number
                            </button>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-white/30 leading-relaxed">
                            By continuing, you agree to our{' '}
                            <span
                                onClick={() => navigate('/terms')}
                                className="text-primary hover:text-white transition-colors cursor-pointer font-semibold underline underline-offset-2"
                            >
                                Terms of Service
                            </span>{' '}
                            &{' '}
                            <span
                                onClick={() => navigate('/terms')}
                                className="text-primary hover:text-white transition-colors cursor-pointer font-semibold underline underline-offset-2"
                            >
                                Privacy Policy
                            </span>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
