import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import BookingsManager from '../components/bookings/BookingsManager';
import TransactionsDashboard from '../components/bookings/TransactionsDashboard';
import { ShieldAlert } from 'lucide-react';

function Bookings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('manage');

    const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
    const isSuperAdmin = adminInfo.role === 'super_admin';
    const managePerms = adminInfo.permissions?.['Manage Bookings'] || {};
    const transPerms = adminInfo.permissions?.['Transactions And Earnings'] || {};

    const hasManageAccess = isSuperAdmin || !!(managePerms.access || managePerms.view);
    const hasTransactionsAccess = isSuperAdmin || !!(transPerms.access || transPerms.view);
    const hasAnyAccess = hasManageAccess || hasTransactionsAccess;

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

    if (!hasAnyAccess) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 max-w-sm">You do not have permission to view bookings or transactions. Please contact your administrator.</p>
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
