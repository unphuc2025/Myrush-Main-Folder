import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BranchesSettings from '../components/settings/BranchesSettings';

const Branches = () => {
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
                <h1 className="text-2xl font-bold text-slate-900">Branches (Venues)</h1>
                <p className="text-sm text-slate-500">Manage your branches/venues details</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <BranchesSettings />
            </div>
        </Layout>
    );
};

export default Branches;
