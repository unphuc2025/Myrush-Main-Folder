import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  TrendingUp,
  CreditCard,
  Users,
  Building,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { bookingsApi, branchesApi, usersApi } from '../services/adminApi';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeVenues: 0,
    totalUsers: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    } else {
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookings, venues, users] = await Promise.all([
        bookingsApi.getAll(),
        branchesApi.getAll(),
        usersApi.getAll()
      ]);

      console.log('Dashboard Debug - Bookings:', bookings);
      console.log('Dashboard Debug - Users:', users);

      processDashboardData(bookings, venues, users);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (bookings, venues, users) => {
    // 1. Key Metrics
    const totalRevenue = (Array.isArray(bookings) ? bookings : bookings.items || []).reduce((sum, booking) => {
      // Use total_amount from API, handling potential string/decimal formats
      const amountStr = String(booking.total_amount || booking.price || '0').replace(/[^0-9.]/g, '');
      const amount = parseFloat(amountStr) || 0;

      // Only count revenue for confirmed bookings for accuracy
      // Check for 'confirmed' or 'completed', case-insensitive just in case
      const status = (booking.status || '').toLowerCase();
      return status === 'confirmed' || status === 'completed' ? sum + amount : sum;
    }, 0);

    const activeVenues = venues.filter(v => v.is_active).length;

    setStats({
      totalRevenue,
      totalBookings: bookings.length,
      activeVenues,
      totalUsers: Array.isArray(users) ? users.length : (users.total || (users.items ? users.items.length : 0))
    });

    // 2. Revenue Chart Data (Last 7 Days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    const revenueMap = (Array.isArray(bookings) ? bookings : bookings.items || []).reduce((acc, booking) => {
      const date = booking.booking_date; // Assuming booking_date is YYYY-MM-DD
      if (!acc[date]) acc[date] = 0;
      const status = (booking.status || '').toLowerCase();
      if (status !== 'cancelled') {
        const amountStr = String(booking.total_amount || booking.price || '0').replace(/[^0-9.]/g, '');
        acc[date] += parseFloat(amountStr) || 0;
      }
      return acc;
    }, {});

    const chartData = last7Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: revenueMap[date] || 0
    }));
    setRevenueData(chartData);

    // 3. Status Distribution (Pie Chart)
    const bookingsList = Array.isArray(bookings) ? bookings : bookings.items || [];
    const statusCounts = bookingsList.reduce((acc, booking) => {
      const status = booking.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status]
    }));
    setStatusData(pieData);

    // 4. Recent Bookings
    // Sort by ID desc (proxy for recency) or date if available
    const sortedBookings = [...bookingsList].sort((a, b) => b.id - a.id).slice(0, 5);
    setRecentBookings(sortedBookings);
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout onLogout={() => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      navigate('/login');
    }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Real-time overview of your sports platform.</p>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Revenue Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 md:p-6 text-white shadow-lg shadow-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 font-medium mb-1">Total Revenue</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-50">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Lifetime Earnings</span>
              </div>
            </div>

            {/* Bookings Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium mb-1">Total Bookings</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stats.totalBookings}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <Activity className="h-4 w-4 mr-1" />
                <span>Active System</span>
              </div>
            </div>

            {/* Venues Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium mb-1">Active Venues</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stats.activeVenues}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Building className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-purple-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>operational</span>
              </div>
            </div>

            {/* Users Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium mb-1">Registered Users</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stats.totalUsers}</h3>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-slate-400">
                <span>Total user base</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm min-w-0">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
                <p className="text-sm text-slate-500">Earnings over the last 7 days</p>
              </div>
              <div className="h-80 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value) => [`₹${value}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Chart */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm min-w-0">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Booking Status</h3>
                <p className="text-sm text-slate-500">Distribution by status</p>
              </div>
              <div className="h-64 flex items-center justify-center w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Bookings</h3>
                <p className="text-sm text-slate-500">Latest activity on the platform</p>
              </div>
              <button
                onClick={() => navigate('/bookings')}
                className="text-sm font-medium text-green-600 hover:text-green-700"
              >
                View All
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Booking ID</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Date</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Amount</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">#{booking.id}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900">
                        {formatCurrency(parseFloat(String(booking.total_amount || booking.price || '0').replace(/[^0-9.]/g, '')) || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
                        No recent bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Booking ID</p>
                      <p className="text-sm font-bold text-slate-900">#{booking.id}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Date</p>
                      <p className="text-sm text-slate-900">{new Date(booking.booking_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Amount</p>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(parseFloat(String(booking.total_amount || booking.price || '0').replace(/[^0-9.]/g, '')) || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {recentBookings.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No recent bookings found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;
