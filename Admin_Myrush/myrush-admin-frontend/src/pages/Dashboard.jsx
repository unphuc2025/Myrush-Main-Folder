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
  DollarSign,
  ShieldAlert,
  X
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
import { bookingsApi, branchesApi, usersApi, courtsApi } from '../services/adminApi';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeVenues: 0,
    totalUsers: 0,
    todayBookings: 0,
    todayRevenue: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [revenueData30Days, setRevenueData30Days] = useState([]);
  const [revenueTimeframe, setRevenueTimeframe] = useState('7days');
  const [selectedDay, setSelectedDay] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    } else {
      const adminInfoStr = localStorage.getItem('admin_info');
      if (!adminInfoStr) {
        setHasPermission(false);
        setLoading(false);
        return;
      }
      
      const adminInfo = JSON.parse(adminInfoStr);
      const perms = adminInfo.permissions || {};
      
      const canView = adminInfo.role === 'super_admin' || Object.values(perms).some(modulePerms => 
        Object.values(modulePerms).some(v => v === true)
      );
      
      if (!canView) {
        setHasPermission(false);
        setLoading(false);
      } else {
        fetchDashboardData();
      }
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data individually to handle 100% partial failures (for restricted admins)
      let bookings = [], venues = [], users = [], courts = [];

      try { bookings = await bookingsApi.getAll(); } catch (e) { console.warn("Dashboard: Bookings fetch failed", e); }
      try { venues = await branchesApi.getAll(); } catch (e) { console.warn("Dashboard: Venues fetch failed", e); }
      try { users = await usersApi.getAll(); } catch (e) { console.warn("Dashboard: Users fetch failed", e); }
      try { courts = await courtsApi.getAll(); } catch (e) { console.warn("Dashboard: Courts fetch failed", e); }

      processDashboardData(bookings, venues, users, courts);
    } catch (error) {
      console.error("Critical error in dashboard data processing:", error);
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (bookings = [], venues = [], users = [], courts = []) => {
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

    const activeVenues = (Array.isArray(venues) ? venues : (venues && venues.items) || []).filter(v => v.is_active).length;
    const bookingsList = Array.isArray(bookings) ? bookings : (bookings && bookings.items) || [];
    const usersCount = Array.isArray(users) ? users.length : (users && users.total) || (users && users.items ? users.items.length : 0);

    // Today's Metrics
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone
    const todayBookingsArr = bookingsList.filter(b => b.booking_date === todayStr);
    const todayRevenue = todayBookingsArr.reduce((sum, booking) => {
      const amountStr = String(booking.total_amount || booking.price || '0').replace(/[^0-9.]/g, '');
      const amount = parseFloat(amountStr) || 0;
      const status = (booking.status || '').toLowerCase();
      return status === 'confirmed' || status === 'completed' ? sum + amount : sum;
    }, 0);

    // Occupancy Rate (Approximate: Booked minutes / Total potential minutes)
    // Handle both array and paginated response formats for courts
    const courtsList = Array.isArray(courts) ? courts : (courts && courts.items) || [];
    const activeCourtsList = courtsList.filter(c => c.is_active);
    const totalDurationToday = todayBookingsArr.reduce((sum, b) => {
      if (b.total_duration_minutes) return sum + b.total_duration_minutes;
      if (b.time_slots && b.time_slots.length > 0) {
        return sum + (b.time_slots.length * 30); // 30 mins per slot
      }
      return sum + 60; // Default 1 hour
    }, 0);
    const totalPotentialMinutes = activeCourtsList.length * 12 * 60; // Assumed 12 hours operation
    const todayOccupancy = totalPotentialMinutes > 0 ? Math.min(100, Math.round((totalDurationToday / totalPotentialMinutes) * 100)) : 0;

    setStats({
      totalRevenue,
      totalBookings: bookingsList.length,
      activeVenues,
      totalUsers: usersCount,
      todayBookings: todayBookingsArr.length,
      todayRevenue,
      todayOccupancy
    });

    // 2. Revenue Chart Data
    const revenueMap = bookingsList.reduce((acc, booking) => {
      const date = booking.booking_date; // Assuming booking_date is YYYY-MM-DD
      if (!acc[date]) acc[date] = 0;
      const status = (booking.status || '').toLowerCase();
      if (status !== 'cancelled') {
        const amountStr = String(booking.total_amount || booking.price || '0').replace(/[^0-9.]/g, '');
        acc[date] += parseFloat(amountStr) || 0;
      }
      return acc;
    }, {});

    // Last 7 Days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    const chartData7 = last7Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: revenueMap[date] || 0
    }));
    setRevenueData(chartData7);

    // Last 30 Days
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    const chartData30 = last30Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: revenueMap[date] || 0
    }));
    setRevenueData30Days(chartData30);

    // 3. Status Distribution (Pie Chart)
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

  const statusChartColors = {
    'confirmed': '#10b981',
    'pending': '#f59e0b',
    'cancelled': '#ef4444',
    'completed': '#3b82f6',
    'payment pending': '#f59e0b',
    'payment_pending': '#f59e0b',
    'unknown': '#94a3b8'
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

    if (!hasPermission && !loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                    <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldAlert className="h-10 w-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 max-w-sm">
                        You do not have permission to access the administrative dashboard. Please contact your administrator for credentials.
                    </p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Real-time overview of your sports platform.</p>
      </div>

      {!hasPermission ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-500 animate-in fade-in zoom-in">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 max-w-md">
            Your account currently has no assigned permissions. Please contact your system administrator to assign a role to your account.
          </p>
        </div>
      ) : loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Today's Revenue Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 md:p-6 text-white shadow-lg shadow-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 font-medium mb-1">Today's Revenue</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(stats.todayRevenue)}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-50">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Today's earnings</span>
              </div>
            </div>

            {/* Today's Bookings Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium mb-1">Today's Bookings</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stats.todayBookings}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <Activity className="h-4 w-4 mr-1" />
                <span>Active today</span>
              </div>
            </div>

            {/* Active Venues Card */}
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
                <span>Operational</span>
              </div>
            </div>

            {/* Occupancy Rate Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium mb-1">Occupancy Rate</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stats.todayOccupancy}%</h3>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-orange-500 h-full transition-all duration-1000 ease-out" 
                  style={{ width: `${stats.todayOccupancy}%` }}
                />
              </div>
              <div className="mt-2 flex items-center text-[10px] font-medium text-slate-500">
                <span>Today's capacity used</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm min-w-0">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
                  <div className="flex items-center gap-2 mt-2 bg-slate-100 p-1 rounded-lg inline-flex">
                    <button 
                      onClick={() => { setRevenueTimeframe('7days'); setSelectedDay(null); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${revenueTimeframe === '7days' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      7 Days
                    </button>
                    <button 
                      onClick={() => { setRevenueTimeframe('30days'); setSelectedDay(null); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${revenueTimeframe === '30days' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      30 Days
                    </button>
                  </div>
                </div>
                {selectedDay && (
                  <div className="text-right animate-in fade-in slide-in-from-right-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedDay.name}</p>
                    <p className="text-lg font-black text-green-600">₹{selectedDay.revenue}</p>
                  </div>
                )}
              </div>
              <div className="h-80 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueTimeframe === '7days' ? revenueData : revenueData30Days}
                    style={{ outline: 'none' }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        setSelectedDay(data.activePayload[0].payload);
                      }
                    }}
                  >
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
                      cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#0f172a', fontWeight: 'bold' }}
                      formatter={(value) => [`₹${value}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
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
              <div className="h-72 flex items-center justify-center w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart 
                    margin={{ top: 20, right: 0, bottom: 40, left: 0 }}
                    style={{ outline: 'none' }}
                  >
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
                        <Cell key={`cell-${index}`} fill={statusChartColors[entry.name.toLowerCase()] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
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
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Booking ID</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Date</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Amount</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-slate-900">#{booking.id}</td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-700">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-900">
                        {formatCurrency(parseFloat(String(booking.total_amount || booking.price || '0').replace(/[^0-9.]/g, '')) || 0)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 text-sm font-medium">
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
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
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
