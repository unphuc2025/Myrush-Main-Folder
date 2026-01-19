import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { bookingsApi, branchesApi, citiesApi } from '../services/adminApi';
import { Download, Calendar, Filter, FileText, IndianRupee, TrendingUp, Users, Clock, PieChart as PieChartIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const Reports = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);

    // Data states
    const [bookings, setBookings] = useState([]);
    const [branches, setBranches] = useState([]);
    const [cities, setCities] = useState([]);

    // Filter states
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [timeFilter, setTimeFilter] = useState('month'); // week, month, quarter

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
        setPresetDateRange('month'); // Default to this month
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsData, branchesData, citiesData] = await Promise.all([
                bookingsApi.getAll(),
                branchesApi.getAll(),
                citiesApi.getAll()
            ]);
            setBookings(bookingsData);
            setBranches(branchesData);
            setCities(citiesData);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const setPresetDateRange = (period) => {
        setTimeFilter(period);
        const end = new Date();
        const start = new Date();

        if (period === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (period === 'month') {
            start.setMonth(end.getMonth() - 1);
        } else if (period === 'quarter') {
            start.setMonth(end.getMonth() - 3);
        }

        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };

    const getFilteredData = () => {
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.booking_date);
            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;

            if (startDate && bookingDate < startDate) return false;
            // Include the end date fully by setting time to end of day or just strict comparison if only dates
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                if (bookingDate > endDateObj) return false;
            }

            if (selectedBranch && booking.court?.branch_id !== selectedBranch) return false;
            if (selectedCity && booking.court?.branch?.city_id !== selectedCity) return false;

            return true;
        });
    };

    const filteredData = getFilteredData();
    const paidBookings = filteredData.filter(b => b.payment_status === 'paid' || b.payment_status === 'completed');

    // --- ANALYTICS CALCULATIONS ---

    // 1. Revenue Trends (Area Chart)
    const getRevenueTrend = () => {
        const trend = {};
        paidBookings.forEach(b => {
            const date = b.booking_date;
            trend[date] = (trend[date] || 0) + parseFloat(b.total_amount || 0);
        });
        return Object.keys(trend).sort().map(date => ({
            date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            revenue: trend[date]
        }));
    };

    // 2. Game Type Distribution (Pie Chart)
    const getGameTypeDistribution = () => {
        const dist = {};
        paidBookings.forEach(b => {
            const type = b.game_type?.name || 'Unknown';
            dist[type] = (dist[type] || 0) + 1;
        });
        return Object.keys(dist).map(type => ({ name: type, value: dist[type] }));
    };

    // 3. Peak Hours (Bar Chart)
    const getPeakHours = () => {
        const hours = {};
        filteredData.forEach(b => {
            // Assuming time_slots is array of objects { start: "10:00", end: "11:00" }
            if (b.time_slots && b.time_slots.length > 0) {
                b.time_slots.forEach(slot => {
                    const hour = slot.start?.split(':')[0] || 'Unknown';
                    const label = `${hour}:00`;
                    hours[label] = (hours[label] || 0) + 1;
                });
            }
        });
        // Sort by hour
        return Object.keys(hours).sort().map(hour => ({ hour, bookings: hours[hour] }));
    };

    // KPIs
    const totalRevenue = paidBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalBookingsCount = filteredData.length;
    const averageOrderValue = paidBookings.length ? (totalRevenue / paidBookings.length) : 0;

    // Top Branch
    const getTopBranch = () => {
        const branchCounts = {};
        paidBookings.forEach(b => {
            const name = b.court?.branch?.name || 'Unknown';
            branchCounts[name] = (branchCounts[name] || 0) + parseFloat(b.total_amount || 0);
        });
        const sorted = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0][0] : '-';
    };


    // --- EXPORT FUNCTIONS ---

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setTextColor(16, 185, 129); // Green
        doc.text('Analytics Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 33);

        // Summary Statistics in PDF
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Summary', 14, 45);

        const summaryData = [
            ['Total Revenue', `Rs. ${totalRevenue.toLocaleString()}`],
            ['Total Bookings', totalBookingsCount],
            ['Avg. Booking Value', `Rs. ${averageOrderValue.toFixed(0)}`],
            ['Top Performing Branch', getTopBranch()]
        ];

        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        });

        // Detailed Table
        doc.text('Detailed Bookings', 14, doc.lastAutoTable.finalY + 15);

        const tableColumn = ["Date", "Branch", "Game", "Customer", "Amount", "Status"];
        const tableRows = filteredData.map(b => [
            b.booking_date,
            b.court?.branch?.name || '-',
            b.game_type?.name || '-',
            b.customer_name,
            `Rs. ${b.total_amount}`,
            b.status
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped'
        });

        doc.save(`analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const exportToExcel = () => {
        const dataToExport = filteredData.map(booking => ({
            Reference: booking.booking_reference,
            Date: booking.booking_date,
            Branch: booking.court?.branch?.city?.name + ' - ' + booking.court?.branch?.name,
            GameType: booking.game_type?.name,
            Customer: booking.customer_name,
            Phone: booking.customer_phone,
            Slots: booking.time_slots?.map(s => `${s.start}-${s.end}`).join(', '),
            Amount: parseFloat(booking.total_amount || 0),
            Status: booking.status,
            Payment: booking.payment_status
        }));

        // Add Summary Sheet
        const summaryData = [
            { Metric: 'Total Revenue', Value: totalRevenue },
            { Metric: 'Total Bookings', Value: totalBookingsCount },
            { Metric: 'Average Order Value', Value: averageOrderValue },
            { Metric: 'Top Branch', Value: getTopBranch() }
        ];

        const wb = XLSX.utils.book_new();
        const wsData = XLSX.utils.json_to_sheet(dataToExport);
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);

        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        XLSX.utils.book_append_sheet(wb, wsData, "Bookings Data");

        XLSX.writeFile(wb, `analytics_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <Layout onLogout={() => {
            localStorage.removeItem('admin_token');
            navigate('/login');
        }}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                    <p className="text-sm text-slate-500">Real-time insights and performance metrics</p>
                </div>

                <div className="flex gap-2">
                    <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                        <FileText className="h-4 w-4" /> Export Excel
                    </button>
                    <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
                        <Download className="h-4 w-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                    <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                        {['week', 'month', 'quarter'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setPresetDateRange(t)}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all whitespace-nowrap ${timeFilter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 md:flex-none">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="bg-transparent text-sm outline-none w-full md:w-32"
                            >
                                <option value="">All Cities</option>
                                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 md:flex-none">
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="bg-transparent text-sm outline-none w-full md:w-40"
                            >
                                <option value="">All Branches</option>
                                {branches
                                    .filter(b => !selectedCity || b.city_id === selectedCity)
                                    .map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                                }
                            </select>
                        </div>
                        <div className="flex items-center gap-2 flex-1 md:flex-none w-full md:w-auto">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="flex-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm outline-none w-full md:w-auto"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="flex-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm outline-none w-full md:w-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card
                    title="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    icon={IndianRupee}
                    trend="+12.5%"
                    color="green"
                />
                <Card
                    title="Total Bookings"
                    value={totalBookingsCount}
                    icon={Calendar}
                    trend="+5.2%"
                    color="blue"
                />
                <Card
                    title="Avg. Order Value"
                    value={`₹${averageOrderValue.toFixed(0)}`}
                    icon={TrendingUp}
                    trend="-2.1%"
                    color="purple"
                />
                <Card
                    title="Top Branch"
                    value={getTopBranch()}
                    icon={Trophy}
                    subtext="Most revenue generated"
                    color="amber"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Revenue Trend - Takes up 2 columns */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend</h3>
                    <div className="h-[300px] w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getRevenueTrend()}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value) => [`₹${value}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Game Type Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Popular Sports</h3>
                    <div className="h-[300px] w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={getGameTypeDistribution()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {getGameTypeDistribution().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lower Section Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Peak Hours */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Peak Booking Hours</h3>
                    <div className="h-[250px] w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getPeakHours()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </Layout>
    );
};

// Helper Components
const Card = ({ title, value, icon: Icon, trend, color, subtext }) => {
    const colorClasses = {
        green: 'text-green-600 bg-green-50',
        blue: 'text-blue-600 bg-blue-50',
        purple: 'text-purple-600 bg-purple-50',
        amber: 'text-amber-600 bg-amber-50',
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {trend && (
                <div className={`mt-4 flex items-center text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                    <span className="font-medium">{trend}</span>
                    <span className="text-slate-400 ml-2">vs last period</span>
                </div>
            )}
        </div>
    );
};

const Trophy = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
);

export default Reports;
