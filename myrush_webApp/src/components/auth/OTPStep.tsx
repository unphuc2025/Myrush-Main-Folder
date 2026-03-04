import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

interface OTPStepProps {
    phone: string;
    onSuccess: (data: { needs_profile: boolean; access_token?: string }) => void;
    onBack: () => void;
}

export const OTPStep: React.FC<OTPStepProps> = ({ phone, onSuccess, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

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
            onSuccess(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid OTP');
            setOtp(['', '', '', '', '']);
            otpInputs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors text-xs font-bold uppercase tracking-widest mb-4"
            >
                <FaArrowLeft size={10} /> Back to Phone
            </button>

            <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase font-heading">Verify OTP</h2>
                <p className="text-gray-500 text-sm">Sent to <span className="font-bold text-gray-900">{phone}</span></p>
            </div>

            <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(ref) => { otpInputs.current[index] = ref; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyPress(e, index)}
                        className="w-12 h-14 text-center text-xl font-black text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                ))}
            </div>

            {error && <p className="text-red-500 text-xs text-center font-bold uppercase">{error}</p>}

            <Button
                onClick={() => verifyOTP(otp.join(''))}
                disabled={loading || otp.join('').length !== 5}
                size="lg"
                className="w-full h-14 bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-glow"
            >
                {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <div className="text-center">
                <button className="text-xs font-bold uppercase text-primary tracking-widest hover:underline">
                    Resend Code
                </button>
            </div>
        </div>
    );
};
