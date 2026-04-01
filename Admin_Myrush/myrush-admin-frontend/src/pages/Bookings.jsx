import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import BookingsManager from '../components/bookings/BookingsManager';
import TransactionsDashboard from '../components/bookings/TransactionsDashboard';

function Bookings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('manage');

    const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
    const hasManageAccess = adminInfo.role === 'super_admin' || (adminInfo.permissions && adminInfo.permissions['Manage Bookings']?.access);
    const hasTransactionsAccess = adminInfo.role === 'super_admin' || (adminInfo.permissions && adminInfo.permissions['Transactions And Earnings']?.access);

    // Handle tab changes via hash
    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash === 'manage' || hash === 'transactions') {
            if (hash === 'manage' && !hasManageAccess && hasTransactionsAccess) {
                setActiveTab('transactions');
                navigate('/bookings#transactions', { replace: true });
            } else if (hash === 'transactions' && !hasTransactionsAccess && hasManageAccess) {
                setActiveTab('manage');
                navigate('/bookings#manage', { replace: true });
            } else {
                setActiveTab(hash);
            }
        } else {
            // Default based on permissions
            if (hasManageAccess) {
                setActiveTab('manage');
                if (location.pathname === '/bookings' && !location.hash) {
                    navigate('/bookings#manage', { replace: true });
                }
            } else if (hasTransactionsAccess) {
                setActiveTab('transactions');
                if (location.pathname === '/bookings' && !location.hash) {
                    navigate('/bookings#transactions', { replace: true });
                }
            }
        }
    }, [location.hash, navigate, location.pathname, hasManageAccess, hasTransactionsAccess]);

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
                    {hasManageAccess && (
                        <button
                            onClick={() => handleTabChange('manage')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manage'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Bookings
                        </button>
                    )}
                    {hasTransactionsAccess && (
                        <button
                            onClick={() => handleTabChange('transactions')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'transactions'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Transactions
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'manage' && hasManageAccess ? <BookingsManager /> : null}
                {activeTab === 'transactions' && hasTransactionsAccess ? <TransactionsDashboard /> : null}
            </div>
        </Layout>
    );
}

export default Bookings;
