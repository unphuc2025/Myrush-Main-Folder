import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import BookingsManager from '../components/bookings/BookingsManager';
import TransactionsDashboard from '../components/bookings/TransactionsDashboard';

function Bookings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('manage');

    // Handle tab changes via hash
    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash === 'manage' || hash === 'transactions') {
            setActiveTab(hash);
        } else {
            // Default to manage if no hash or invalid hash
            setActiveTab('manage');
            if (location.pathname === '/bookings' && !location.hash) {
                navigate('/bookings#manage', { replace: true });
            }
        }
    }, [location.hash, navigate, location.pathname]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/bookings#${tab}`);
    };

    return (
        <Layout onLogout={() => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_info');
            navigate('/login');
        }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {activeTab === 'transactions' ? 'Transactions & Earnings' : 'Bookings Management'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {activeTab === 'transactions'
                            ? 'View revenue, trends, and financial reports'
                            : 'Manage customer bookings, schedules, and statuses'}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-slate-100 p-1 rounded-xl inline-flex self-start md:self-auto">
                    <button
                        onClick={() => handleTabChange('manage')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manage'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Bookings
                    </button>
                    <button
                        onClick={() => handleTabChange('transactions')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'transactions'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Transactions
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'manage' ? <BookingsManager /> : <TransactionsDashboard />}
            </div>
        </Layout>
    );
}

export default Bookings;
