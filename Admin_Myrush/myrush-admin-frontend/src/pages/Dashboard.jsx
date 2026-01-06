import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  Home,
  TrendingUp,
  Bookmark,
  Diamond,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function Dashboard() {
  const navigate = useNavigate();
  const [venueCount, setVenueCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    } else {
      // Mock loading for now or fetch real data
      setVenueCount(12);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigate('/login');
  };

  // Chart Data
  const barData = [
    { name: 'JAN', CHN: 20, USA: 40, UK: 30 },
    { name: 'FEB', CHN: 35, USA: 45, UK: 40 },
    { name: 'MAR', CHN: 40, USA: 30, UK: 35 },
    { name: 'APR', CHN: 50, USA: 60, UK: 20 },
    { name: 'MAY', CHN: 30, USA: 40, UK: 50 },
    { name: 'JUN', CHN: 45, USA: 50, UK: 40 },
    { name: 'JUL', CHN: 35, USA: 45, UK: 30 },
    { name: 'AUG', CHN: 40, USA: 30, UK: 45 },
  ];

  const pieData = [
    { name: 'Search Engines', value: 30 },
    { name: 'Direct Click', value: 30 },
    { name: 'Bookmarks Click', value: 40 },
  ];

  const COLORS = ['#16a34a', '#1bcfb4', '#fe7c96'];

  return (
    <Layout onLogout={handleLogout}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Welcome back! Here's your admin overview</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:shadow-lg transition-all">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        {/* Card 1: Weekly Sales */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 via-orange-300 to-pink-400 p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Weekly Sales</p>
                <h3 className="mt-3 text-4xl font-bold">$15,000</h3>
              </div>
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium opacity-90">+60% from last week</p>
            </div>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110"></div>
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/5 blur-2xl"></div>
        </div>

        {/* Card 2: Weekly Orders */}
        <div className="group relative overflow-hidden rounded-2xl bg-green-600 p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Weekly Orders</p>
                <h3 className="mt-3 text-4xl font-bold">45,633</h3>
              </div>
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Bookmark className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium opacity-90">-10% from last week</p>
            </div>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110"></div>
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/5 blur-2xl"></div>
        </div>

        {/* Card 3: Visitors Online */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-300 to-teal-400 p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Visitors Online</p>
                <h3 className="mt-3 text-4xl font-bold">95,574</h3>
              </div>
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Diamond className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium opacity-90">+5% from last week</p>
            </div>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110"></div>
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/5 blur-2xl"></div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-2xl bg-white p-8 shadow-md hover:shadow-lg transition-shadow">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Visit And Sales Statistics</h2>
              <p className="mt-1 text-sm text-gray-500">Monthly performance across regions</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-600"></span>
                <span className="text-xs font-medium text-gray-600">CHN</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-400"></span>
                <span className="text-xs font-medium text-gray-600">USA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-medium text-gray-600">UK</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', padding: '12px' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="CHN" fill="#16a34a" radius={[10, 10, 0, 0]} />
                <Bar dataKey="USA" fill="#ffaf00" radius={[10, 10, 0, 0]} />
                <Bar dataKey="UK" fill="#06b6d4" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="rounded-2xl bg-white p-8 shadow-md hover:shadow-lg transition-shadow">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900">Traffic Sources</h2>
            <p className="mt-1 text-sm text-gray-500">Distribution of visitor sources</p>
          </div>
          <div className="flex h-64 w-full items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#16a34a]"></span>
                <span className="text-sm font-medium text-gray-700">Search Engines</span>
              </div>
              <span className="rounded-lg bg-green-50 px-3 py-1 text-sm font-semibold text-green-600">30%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#1bcfb4]"></span>
                <span className="text-sm font-medium text-gray-700">Direct Click</span>
              </div>
              <span className="rounded-lg bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-600">30%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#fe7c96]"></span>
                <span className="text-sm font-medium text-gray-700">Bookmarks Click</span>
              </div>
              <span className="rounded-lg bg-pink-50 px-3 py-1 text-sm font-semibold text-pink-600">40%</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
