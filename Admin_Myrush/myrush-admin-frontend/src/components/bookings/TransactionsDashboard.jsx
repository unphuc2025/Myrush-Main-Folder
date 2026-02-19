import { useState, useEffect } from 'react';
import { IndianRupee, Clock, Calendar, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { bookingsApi, branchesApi } from '../../services/adminApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
        const paidBookings = bookings.filter(b => b.payment_status === 'paid' || b.payment_status === 'completed');
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
            if (booking.payment_status === 'paid' || booking.payment_status === 'completed') {
                monthlyStats[bookingMonth].revenue += parseFloat(booking.total_amount);
                monthlyStats[bookingMonth].bookings += 1;
            }
        });
        return monthlyStats;
    };

    const monthlyData = getMonthlyData();
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
    const chartData = sortedMonths.map(month => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthlyData[month].revenue,
        bookings: monthlyData[month].bookings
    }));

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
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Trends</h3>

                    {chartData.length > 0 ? (
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            padding: '8px 12px'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}
                                        cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="#0f172a"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40}
                                        activeBar={{ fill: '#16a34a' }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400">
                            No sufficient data for chart
                        </div>
                    )}
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
