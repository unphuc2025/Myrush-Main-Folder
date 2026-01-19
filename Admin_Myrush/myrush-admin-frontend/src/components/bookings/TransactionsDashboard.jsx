import { useState, useEffect } from 'react';
import { IndianRupee, Clock, Calendar, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { bookingsApi, branchesApi } from '../../services/adminApi';

function TransactionsDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const adminInfo = localStorage.getItem('admin_info');
            let branchId = null;
            if (adminInfo) {
                const parsed = JSON.parse(adminInfo);
                branchId = parsed.branch_id;
            }
            const data = await bookingsApi.getAll(branchId);
            setBookings(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load transaction data');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const paidBookings = bookings.filter(b => b.payment_status === 'paid');
        const pendingPayments = bookings.filter(b => b.payment_status === 'pending');
        const completedBookings = bookings.filter(b => b.status === 'completed');

        const totalRevenue = paidBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        const pendingRevenue = pendingPayments.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        const totalBookings = bookings.length;

        // Calculate average revenue per booking
        const avgRevenue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;

        return {
            totalRevenue,
            pendingRevenue,
            totalBookings,
            avgRevenue,
            completedBookings: completedBookings.length,
            paidBookings: paidBookings.length
        };
    };

    const stats = calculateStats();

    const getMonthlyData = () => {
        const monthlyStats = {};
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
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6); // Last 6 months

    if (loading) return <div className="p-12 text-center text-slate-500">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <IndianRupee className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending</p>
                            <h3 className="text-2xl font-bold text-slate-900">₹{stats.pendingRevenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Bookings</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.totalBookings}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Avg. / Booking</p>
                            <h3 className="text-2xl font-bold text-slate-900">₹{Math.round(stats.avgRevenue).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Revenue Overview Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Trends</h3>

                    <div className="flex items-end gap-3 h-64 mt-4">
                        {sortedMonths.length > 0 ? sortedMonths.map(month => {
                            const data = monthlyData[month];
                            const maxRevenue = Math.max(...Object.values(monthlyData).map(d => d.revenue));
                            const heightPercentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;

                            return (
                                <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="relative w-full flex justify-center items-end h-full bg-slate-50 rounded-lg overflow-hidden">
                                        <div
                                            className="w-4/5 bg-slate-900 rounded-t-sm transition-all duration-500 group-hover:bg-green-600"
                                            style={{ height: `${heightPercentage}%` }}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-400">
                                            {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                                        </p>
                                    </div>
                                    {/* Tooltip */}
                                    <div className="opacity-0 group-hover:opacity-100 absolute -mt-16 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                                        ₹{data.revenue.toLocaleString()}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                No sufficient data for chart
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Transactions</h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                        {bookings
                            .filter(b => b.payment_status !== 'pending')
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .slice(0, 10)
                            .map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {booking.payment_status === 'paid' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{booking.customer_name}</p>
                                            <p className="text-xs text-slate-400">{booking.booking_reference}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-slate-900'}`}>
                                            {booking.payment_status === 'paid' ? '+' : ''}₹{booking.total_amount}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{new Date(booking.created_at || booking.booking_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}

                        {bookings.filter(b => b.payment_status !== 'pending').length === 0 && (
                            <p className="text-center text-slate-400 py-8">No transactions yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TransactionsDashboard;
