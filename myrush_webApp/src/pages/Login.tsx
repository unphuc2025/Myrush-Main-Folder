import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async () => {
        if (phoneNumber.length < 10) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            await apiClient.post('/auth/send-otp', { phone_number: formattedPhone });
            navigate('/verify-otp', { state: { phoneNumber: formattedPhone } });
        } catch (error) {
            console.error('Failed to send OTP', error);
            alert('Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
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
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-20 right-20 w-32 h-32 bg-primary/20 rounded-full blur-xl"
            />
            <motion.div
                animate={{
                    y: [0, 20, 0],
                    rotate: [0, -5, 0]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute bottom-32 left-16 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl"
            />

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <Card variant="glass" className="border-white/20 shadow-2xl">
                        {/* Logo/Brand */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="text-center mb-8"
                        >
                            <div className="inline-block px-6 py-3 rounded-full bg-primary/20 border border-primary/30 mb-4">
                                <span className="text-2xl font-black text-primary tracking-widest">SPORTS</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 font-montserrat">
                                Welcome Back
                            </h1>
                            <p className="text-white/70 text-sm leading-relaxed">
                                From football to badminton and tennis, get live games, training, and bookings in one place.
                            </p>
                        </motion.div>

                        {/* Input Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-6"
                        >
                            <Input
                                type="tel"
                                placeholder="Enter mobile number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                maxLength={10}
                                icon={<span className="text-lg">📞</span>}
                                className="text-white placeholder-white/50 bg-white/10 border-white/20 focus:border-primary focus:ring-primary/20"
                            />

                            <Button
                                onClick={handleSendOTP}
                                disabled={isLoading}
                                size="lg"
                                className="w-full py-2 px-3 bg-primary text-black hover:bg-white hover:text-black border-0 shadow-glow"
                                icon={isLoading ? undefined : <span className="text-lg">→</span>}
                            >
                                {isLoading ? 'Sending OTP...' : 'Continue'}
                            </Button>
                        </motion.div>

                        {/* Terms */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
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
