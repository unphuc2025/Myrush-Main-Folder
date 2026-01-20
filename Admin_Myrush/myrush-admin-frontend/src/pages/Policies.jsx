import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BookingPolicies from '../components/settings/BookingPolicies';

const Policies = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <Layout onLogout={() => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_info');
            navigate('/login');
        }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Policies & Terms</h1>
                <p className="text-sm text-slate-500">Manage cancellation rules and terms of service</p>
            </div>

            <BookingPolicies />
        </Layout>
    );
};

export default Policies;
