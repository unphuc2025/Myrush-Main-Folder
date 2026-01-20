import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        city: '',
        email: '',
        gender: '',
        handedness: '',
        skill_level: '',
        sports: '',
        playing_style: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const phone = location.state?.phone;

    if (!phone) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/verify-otp', {
                phone_number: phone,
                otp_code: '12345', // Dev OTP
                full_name: formData.full_name,
                age: formData.age ? parseInt(formData.age) : undefined,
                city: formData.city
            });

            if (response.data.access_token) {
                login(response.data.access_token);
                navigate('/');
            } else {
                setError('Failed to complete profile setup');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to complete setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ marginTop: '50px', maxWidth: '500px' }}>
            <h1>Setup Profile</h1>
            <p>Tell us a bit about yourself to get started.</p>

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                <label>Full Name</label>
                <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    required
                />

                <label>Email (Optional)</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />

                <label>City</label>
                <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    required
                />

                <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
                    {loading ? 'Saving...' : 'Complete Setup'}
                </button>
            </form>
        </div>
    );
};
