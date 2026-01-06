import { useState, useEffect } from 'react';
import { Calendar, User, Play, Building, Clock, DollarSign, CheckCircle, XCircle, Filter, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import BookingPolicies from '../components/settings/BookingPolicies';
import { citiesApi, branchesApi, courtsApi, gameTypesApi, bookingsApi } from '../services/adminApi';

function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [cities, setCities] = useState([]);
    const [branches, setBranches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [gameTypes, setGameTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [selectedCityId, setSelectedCityId] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('manage');

    const navigate = useNavigate();
    const location = useLocation();

    // Handle tab changes via hash
    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash === 'manage' || hash === 'transactions' || hash === 'policies') {
            setActiveTab(hash);
        } else {
            // Default to manage if no hash or invalid hash
            setActiveTab('manage');
            navigate('/bookings#manage', { replace: true });
        }
    }, [location.hash, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/login');
    };

    // Fetch all data
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            const adminInfo = localStorage.getItem('admin_info');
            let branchId = null;
            if (adminInfo) {
                const parsed = JSON.parse(adminInfo);
                if (parsed.branch_id) {
                    branchId = parsed.branch_id;
                    // Also set selected branch ID for filtering UI if needed, though API handles data
                    setSelectedBranchId(branchId);
                }
            }

            const [citiesData, branchesData, courtsData, gameTypesData, bookingsData] = await Promise.all([
                citiesApi.getAll(),
                branchesApi.getAll(),
                courtsApi.getAll(),
                gameTypesApi.getAll(),
                bookingsApi.getAll(branchId)
            ]);

            setCities(citiesData);
            setBranches(branchesData);
            setCourts(courtsData);
            setGameTypes(gameTypesData);
            setBookings(bookingsData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter branches and bookings based on selections
    const filteredBranches = selectedCityId
        ? branches.filter(branch => branch.city_id === selectedCityId)
        : branches;

    const filteredBookings = bookings.filter(booking => {
        const cityMatch = selectedCityId ? booking.court?.branch?.city_id === selectedCityId : true;
        const branchMatch = selectedBranchId ? booking.court?.branch_id === selectedBranchId : true;
        const statusMatch = selectedStatus ? booking.status === selectedStatus : true;
        const searchMatch = searchTerm
            ? (booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;

        return cityMatch && branchMatch && statusMatch && searchMatch;
    });

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        setSelectedCityId(cityId);
        // Clear branch selection when city changes
        setSelectedBranchId('');
    };

    const handleAddBooking = () => {
        setShowForm(true);
    };

    const handleViewBooking = (booking) => {
        navigate('/bookings', { state: { viewBooking: booking } });
    };

    const handleEditBooking = (booking) => {
        navigate('/bookings', { state: { editBooking: booking } });
    };

    const handleStatusToggle = async (booking, newStatus) => {
        try {
            await bookingsApi.updateStatus(booking.id, newStatus);
            setBookings(prev => prev.map(b =>
                b.id === booking.id ? { ...b, status: newStatus } : b
            ));
        } catch (err) {
            console.error('Error updating booking status:', err);
            setError('Failed to update booking status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Layout onLogout={handleLogout}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {activeTab === 'policies' ? 'Booking Policies' :
                            activeTab === 'transactions' ? 'Transactions & Earnings' :
                                'Bookings Management'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {activeTab === 'policies' ? 'Manage cancellation fees and terms of service' :
                            activeTab === 'transactions' ? 'View revenue and financial reports' :
                                'Manage customer bookings and reservations'}
                    </p>
                </div>
                {activeTab === 'manage' && (
                    <button
                        onClick={handleAddBooking}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Calendar className="h-4 w-4" />
                        New Booking
                    </button>
                )}
            </div>



            {/* Tab Content */}
            {activeTab === 'manage' && (
                <>
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-64">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by customer name or booking reference..."
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-48">
                                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                                <select
                                    value={selectedCityId}
                                    onChange={handleCityChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                >
                                    <option value="">All Cities</option>
                                    {cities.map((city) => (
                                        <option key={city.id} value={city.id}>
                                            {city.name} ({city.short_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 min-w-48">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                    disabled={!selectedCityId}
                                >
                                    <option value="">All Branches</option>
                                    {filteredBranches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 min-w-48">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bookings List */}
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading bookings...</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{booking.booking_reference}</h3>
                                                    <p className="text-sm text-slate-500">Booking #{booking.id}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                            <button
                                                onClick={() => handleViewBooking(booking)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Calendar className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditBooking(booking)}
                                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <div className="w-4 h-4 bg-green-600 rounded"></div> {/* Placeholder for edit icon */}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Customer Info */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Customer
                                            </h4>
                                            <p className="text-sm text-slate-900">{booking.customer_name}</p>
                                            <p className="text-xs text-slate-500">{booking.customer_email}</p>
                                            <p className="text-xs text-slate-500">{booking.customer_phone}</p>
                                        </div>

                                        {/* Court Info */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <Play className="h-4 w-4" />
                                                Court
                                            </h4>
                                            <p className="text-sm text-slate-900">{booking.court?.name}</p>
                                            <p className="text-xs text-slate-500">{booking.game_type?.name}</p>
                                            <p className="text-xs text-slate-500">{booking.court?.branch?.city?.name}</p>
                                        </div>

                                        {/* Booking Time */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Schedule
                                            </h4>
                                            <p className="text-sm text-slate-900">{booking.booking_date}</p>
                                            <p className="text-xs text-slate-500">{booking.start_time} - {booking.end_time}</p>
                                            <p className="text-xs text-slate-500">{booking.duration_hours} hours</p>
                                        </div>

                                        {/* Payment & Actions */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Payment
                                            </h4>
                                            <p className="text-lg font-semibold text-green-600">₹{booking.total_amount}</p>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                                                {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                                            </span>
                                            {booking.coupon_code ? (
                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                    <p className="text-xs text-slate-500">Coupon: <span className="font-medium text-slate-700">{booking.coupon_code}</span></p>
                                                    <p className="text-xs text-green-600">Discount: -₹{booking.coupon_discount}</p>
                                                </div>
                                            ) : (
                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                    <p className="text-xs text-slate-400 italic">No coupon used</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Actions */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium text-slate-700">Status:</label>
                                            <div className="flex items-center gap-2">
                                                {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusToggle(booking, status)}
                                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${booking.status === status
                                                            ? getStatusColor(status)
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-500">
                                            {new Date(booking.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredBookings.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <Calendar className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                    <p className="text-lg font-medium mb-2">No bookings found</p>
                                    <p className="text-sm">Try adjusting your filters or create a new booking</p>
                                    <button
                                        onClick={handleAddBooking}
                                        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Create First Booking
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'transactions' && (
                <TransactionsAndEarnings
                    bookings={bookings}
                    loading={loading}
                    error={error}
                />
            )}

            {activeTab === 'policies' && (
                <BookingPolicies />
            )}
        </Layout>
    );
}

// TransactionsAndEarnings Component
function TransactionsAndEarnings({ bookings, loading, error }) {
    const calculateStats = () => {
        const paidBookings = bookings.filter(b => b.payment_status === 'paid');
        const pendingPayments = bookings.filter(b => b.payment_status === 'pending');
        const completedBookings = bookings.filter(b => b.status === 'completed');

        const totalRevenue = paidBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        const pendingRevenue = pendingPayments.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        const totalBookings = bookings.length;

        return {
            totalRevenue,
            pendingRevenue,
            totalBookings,
            completedBookings: completedBookings.length,
            paidBookings: paidBookings.length
        };
    };

    const stats = calculateStats();

    const getMonthlyData = () => {
        const monthlyStats = {};
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        bookings.forEach(booking => {
            const bookingMonth = booking.booking_date.slice(0, 7);
            if (!monthlyStats[bookingMonth]) {
                monthlyStats[bookingMonth] = { revenue: 0, bookings: 0 };
            }
            if (booking.payment_status === 'paid') {
                monthlyStats[bookingMonth].revenue += parseFloat(booking.total_amount);
                monthlyStats[bookingMonth].bookings += 1;
            }
        });

        return monthlyStats;
    };

    const monthlyData = getMonthlyData();

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Pending Revenue</p>
                            <p className="text-2xl font-bold text-yellow-600">₹{stats.pendingRevenue.toLocaleString()}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Bookings</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                            </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Revenue</h3>
                    <div className="space-y-4">
                        {Object.entries(monthlyData)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 6)
                            .map(([month, data]) => (
                                <div key={month} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            {new Date(month + '-01').toLocaleDateString('en-IN', {
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-xs text-slate-500">{data.bookings} bookings</p>
                                    </div>
                                    <p className="text-lg font-semibold text-green-600">₹{data.revenue.toLocaleString()}</p>
                                </div>
                            ))}
                        {Object.keys(monthlyData).length === 0 && (
                            <p className="text-slate-500 text-center py-8">No revenue data available</p>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Transactions</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {bookings
                            .filter(b => b.payment_status !== 'pending')
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .slice(0, 10)
                            .map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${booking.payment_status === 'paid' ? 'bg-green-100' : 'bg-red-100'}`}>
                                            <DollarSign className={`h-4 w-4 ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{booking.booking_reference}</p>
                                            <p className="text-xs text-slate-500">{booking.customer_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-green-600">₹{booking.total_amount}</p>
                                        <p className="text-xs text-slate-500">
                                            {booking.payment_status === 'paid' ? 'Paid' :
                                                booking.payment_status === 'failed' ? 'Failed' : 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        {bookings.filter(b => b.payment_status !== 'pending').length === 0 && (
                            <p className="text-slate-500 text-center py-8">No transactions found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Status Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Status Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600 mb-2">{stats.paidBookings}</p>
                        <p className="text-sm text-slate-600 mb-4">Paid Bookings</p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${stats.totalBookings > 0 ? (stats.paidBookings / stats.totalBookings) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600 mb-2">
                            {bookings.filter(b => b.payment_status === 'pending').length}
                        </p>
                        <p className="text-sm text-slate-600 mb-4">Pending Payments</p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-yellow-600 h-2 rounded-full"
                                style={{
                                    width: `${stats.totalBookings > 0
                                        ? (bookings.filter(b => b.payment_status === 'pending').length / stats.totalBookings) * 100
                                        : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-3xl font-bold text-red-600 mb-2">
                            {bookings.filter(b => b.payment_status === 'failed').length}
                        </p>
                        <p className="text-sm text-slate-600 mb-4">Failed Payments</p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{
                                    width: `${stats.totalBookings > 0
                                        ? (bookings.filter(b => b.payment_status === 'failed').length / stats.totalBookings) * 100
                                        : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Bookings;
