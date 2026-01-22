import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

export const OTPVerification: React.FC = () => {
    const [otp, setOtp] = useState(['', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

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

            if (response.data.access_token) {
                login(response.data.access_token);
                // Redirect authenticated users to landing page
                navigate('/', { replace: true });
            } else if (response.data.needs_profile) {
                navigate('/setup-profile', { state: { phone } });
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black relative overflow-hidden">
            {/* Animated Background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
            >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2035')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-blue-900/60 to-transparent" />
            </motion.div>

            {/* Floating Elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-16 left-16 w-40 h-40 bg-primary/10 rounded-full blur-2xl"
            />

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <Card variant="glass" className="border-white/20 shadow-2xl">
                        {/* Header */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="text-center mb-8"
                        >
                            <div className="inline-block px-6 py-3 rounded-full bg-primary/20 border border-primary/30 mb-4">
                                <span className="text-2xl font-black text-primary tracking-widest">VERIFY</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 font-montserrat">
                                Enter Code
                            </h1>
                            <p className="text-white/70 text-sm">
                                We've sent a 5-digit code to +91 {phone.replace('+91', '')}
                            </p>
                        </motion.div>

                        {/* OTP Input */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex justify-center gap-3 mb-6"
                        >
                            {otp.map((digit, index) => (
                                <motion.input
                                    key={index}
                                    ref={(ref) => { otpInputs.current[index] = ref; }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(e.target.value, index)}
                                    onKeyDown={(e) => handleKeyPress(e, index)}
                                    className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                                    whileFocus={{ scale: 1.1 }}
                                />
                            ))}
                        </motion.div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4"
                            >
                                <p className="text-red-300 text-sm text-center font-semibold">{error}</p>
                            </motion.div>
                        )}

                        {/* Dev Hint */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-center mb-6"
                        >
                            <p className="text-xs text-white/50">Try: <span className="text-primary font-bold">12345</span></p>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-4"
                        >
                            <Button
                                onClick={() => verifyOTP(otp.join(''))}
                                disabled={loading || otp.join('').length !== 5}
                                size="lg"
                                className="w-full py-2 px-3 bg-primary text-black hover:bg-white hover:text-black border-0 shadow-glow"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </Button>

                            <div className="flex justify-between items-center text-sm">
                                <button
                                    onClick={handleResendOTP}
                                    className="text-primary hover:text-white transition-colors font-semibold"
                                >
                                    Resend Code
                                </button>
                                <button
                                    onClick={() => {
                                        setOtp(['', '', '', '', '']);
                                        navigate('/login');
                                    }}
                                    className="text-white/50 hover:text-white transition-colors"
                                >
                                    Change Number
                                </button>
                            </div>
                        </motion.div>

                        {/* Terms */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-8 text-center"
                        >
                            <p className="text-xs text-white/50 leading-relaxed">
                                By continuing, you agree to our{' '}
                                <span className="text-primary hover:text-white transition-colors cursor-pointer font-semibold">
                                    Terms of Service
                                </span>{' '}
                                &{' '}
                                <span className="text-primary hover:text-white transition-colors cursor-pointer font-semibold">
                                    Privacy Policy
                                </span>
                            </p>
                        </motion.div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};
