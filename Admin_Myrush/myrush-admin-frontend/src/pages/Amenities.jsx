import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AmenitiesSettings from '../components/settings/AmenitiesSettings';

const Amenities = () => {
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
                <h1 className="text-2xl font-bold text-slate-900">Amenities</h1>
                <p className="text-sm text-slate-500">Manage facility amenities</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <AmenitiesSettings />
            </div>
        </Layout>
    );
};

export default Amenities;
