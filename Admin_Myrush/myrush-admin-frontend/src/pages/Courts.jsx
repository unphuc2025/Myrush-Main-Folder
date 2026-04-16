import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import CourtsSettings from '../components/settings/CourtsSettings';
import { ShieldAlert } from 'lucide-react';

const Courts = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Permission check
    const permissions = (() => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
            if (adminInfo.role === 'super_admin') return {
                add: true, edit: true, delete: true, view: true, access: true
            };
            return adminInfo.permissions?.['Manage Courts'] || {};
        } catch { return {}; }
    })();

    const hasAccess = !!(permissions.access || permissions.view);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        } else {
            setLoading(false);
        }
    }, [navigate]);

    if (loading) return null;

    if (!hasAccess) {
        return (
            <Layout onLogout={() => {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_info');
                navigate('/login');
            }}>
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 max-w-sm">You do not have permission to manage courts. Please contact your administrator.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout onLogout={() => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_info');
            navigate('/login');
        }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Courts Management</h1>
                <p className="text-sm text-slate-500">Manage courts and availability</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <CourtsSettings />
            </div>
        </Layout>
    );
};

export default Courts;
