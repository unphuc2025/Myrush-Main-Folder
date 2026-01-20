import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const OTPVerification: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth(); // eslint-disable-line @typescript-eslint/no-unused-vars

    const phone = location.state?.phoneNumber || location.state?.phone;

    if (!phone) {
        // If accessed directly without phone, redirect to login
        return (
            <div style={{ background: 'var(--color-black)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => navigate('/login')} className="premium-cta-btn">Go to Login</button>
            </div>
        );
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/verify-otp', {
                phone_number: phone,
                otp_code: otp
            });

            if (response.data.access_token) {
                login(response.data.access_token);
                navigate('/');
            } else if (response.data.needs_profile) {
                navigate('/setup-profile', { state: { phone } });
            } else {
                setError('Verification failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Gradient */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 50% 50%, rgba(0, 200, 83, 0.05) 0%, transparent 50%)',
                pointerEvents: 'none'
            }}></div>

            <div className="card" style={{
                background: 'white',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                padding: '3rem',
                maxWidth: '400px',
                width: '100%',
                zIndex: 10,
                textAlign: 'center',
                borderRadius: '16px'
            }}>
                <h1 style={{
                    fontSize: '1.8rem',
                    marginBottom: '1rem',
                    color: 'var(--color-black)',
                    fontFamily: 'var(--font-display)'
                }}>
                    VERIFY OTP
                </h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                    Enter the code sent to <span style={{ color: 'var(--color-black)', fontWeight: 'bold' }}>{phone}</span>
                </p>
                <p style={{ fontSize: '0.8em', color: '#999', marginBottom: '20px' }}>Try 12345 (dev)</p>

                <form onSubmit={handleVerify}>
                    <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        style={{
                            background: '#f9f9f9',
                            border: '1px solid #eee',
                            color: 'black',
                            marginBottom: '1.5rem',
                            padding: '16px',
                            textAlign: 'center',
                            letterSpacing: '0.5em',
                            fontSize: '1.2rem',
                            borderRadius: '8px'
                        }}
                    />
                    {error && <p style={{ color: '#ff4444', marginBottom: '10px' }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="premium-cta-btn"
                        style={{ width: '100%', padding: '16px', borderRadius: '50px', color: 'white' }}
                    >
                        {loading ? 'VERIFYING...' : 'CONFIRM ACCESS'}
                    </button>
                </form>
            </div>
        </div>
    );
};
