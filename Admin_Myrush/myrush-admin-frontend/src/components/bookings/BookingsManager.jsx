import { useState, useEffect } from 'react';
import { Calendar, Search, Filter, ArrowUpDown, Eye, Pencil, Plus, MapPin, Building, Activity, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Drawer from '../settings/Drawer';
import AddBookingForm from './AddBookingForm';
import { bookingsApi, citiesApi, branchesApi } from '../../services/adminApi';

function BookingsManager() {
    const [bookings, setBookings] = useState([]);
    const [cities, setCities] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCityId, setSelectedCityId] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Drawer State
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [viewingBooking, setViewingBooking] = useState(null);

    useEffect(() => {
        let isMounted = true;

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
                        setSelectedBranchId(branchId);
                    }
                }

                const [citiesData, branchesData, bookingsData] = await Promise.all([
                    citiesApi.getAll(),
                    branchesApi.getAll(),
                    bookingsApi.getAll(branchId) // API filters by branch if provided
                ]);

                if (isMounted) {
                    setCities(citiesData?.items || citiesData || []);
                    setBranches(branchesData?.items || branchesData || []);
                    setBookings(bookingsData?.items || bookingsData || []);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                if (isMounted) setError('Failed to load bookings');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAllData();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            try {
                await bookingsApi.delete(id);
                setBookings(prev => prev.filter(b => b.id !== id));
            } catch (err) {
                console.error('Error deleting booking:', err);
                setError('Failed to delete booking');
            }
        }
    };

    const filteredBranches = selectedCityId
        ? branches.filter(branch => branch.city_id === selectedCityId)
        : branches;

    const filteredBookings = bookings
        .filter(booking => {
            const cityMatch = selectedCityId ? booking.court?.branch?.city_id === selectedCityId : true;
            const branchMatch = selectedBranchId ? booking.court?.branch_id === selectedBranchId : true;
            const statusMatch = selectedStatus ? booking.status === selectedStatus : true;
            const searchMatch = searchTerm
                ? (booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.customer_phone?.includes(searchTerm) ||
                    booking.court?.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                : true;

            return cityMatch && branchMatch && statusMatch && searchMatch;
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0;

            // Sorting Logic helpers
            const getValue = (item, key) => {
                switch (key) {
                    case 'customer': return item.customer_name || '';
                    case 'cost': return parseFloat(item.total_amount) || 0;
                    case 'date': return item.booking_date;
                    case 'created_at': return item.created_at;
                    default: return item[key];
                }
            };

            const aValue = getValue(a, sortConfig.key);
            const bValue = getValue(b, sortConfig.key);

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    // Pagination Logic
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCityId, selectedBranchId, selectedStatus]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPaymentColor = (status) => {
        switch (status) {
            case 'paid': return 'text-green-600 bg-green-50 border-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'failed': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const handleAddClick = () => {
        setEditingBooking(null);
        setViewingBooking(null);
        setShowDrawer(true);
    };

    const handleEditClick = (booking) => {
        setEditingBooking(booking);
        setViewingBooking(null);
        setShowDrawer(true);
    };

    const handleViewClick = (booking) => {
        setViewingBooking(booking);
        setEditingBooking(null);
        setShowDrawer(false); // Fix: Do not open drawer when viewing
    };

    const handleSaveSuccess = () => {
        setShowDrawer(false);
        setEditingBooking(null);
        setViewingBooking(null);
        window.location.reload(); // Quick refresh to reflect changes
    };


    if (viewingBooking) {
        return (
            <BookingViewModal
                booking={viewingBooking}
                onClose={() => setViewingBooking(null)}
                onEdit={() => handleEditClick(viewingBooking)}
                getStatusColor={getStatusColor}
                getPaymentColor={getPaymentColor}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:w-auto flex-1">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search projects, venues..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm text-slate-900"
                        />
                    </div>

                    {/* Filter - City */}
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                            value={selectedCityId}
                            onChange={(e) => { setSelectedCityId(e.target.value); setSelectedBranchId(''); }}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm appearance-none"
                        >
                            <option value="">All Cities</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter - Branch */}
                    <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            disabled={!selectedCityId && branches.length > 50} // Optional optimization
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm appearance-none disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="">All Branches</option>
                            {filteredBranches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter - Status */}
                    <div className="relative">
                        <Activity className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm appearance-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="flex-shrink-0 w-full xl:w-auto">
                    <button
                        onClick={handleAddClick}
                        className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95 whitespace-nowrap min-h-[44px]"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">New Booking</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                    <XCircle className="h-5 w-5" />{error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading bookings...</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-6">
                                            SR NO.
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customer')}>
                                            <div className="flex items-center gap-1">CUSTOMER <ArrowUpDown className="h-3 w-3" /></div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            BRANCH
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            SPORT
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                                            <div className="flex items-center gap-1">DATE <ArrowUpDown className="h-3 w-3" /></div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('cost')}>
                                            <div className="flex items-center gap-1">TOTAL <ArrowUpDown className="h-3 w-3" /></div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ADVANCE</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">REMAINING</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">COUPON</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">PAYMENT</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">STATUS</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right pr-6">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentBookings.length > 0 ? (
                                        currentBookings.map((booking, index) => (
                                            <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-4 py-3 pl-6 text-xs font-bold text-slate-500">
                                                    {(startIndex + index + 1).toString().padStart(2, '0')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-900">{booking.customer_name}</span>
                                                        <span className="text-[10px] text-slate-500">{booking.customer_phone || booking.user?.phone_number || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-700">
                                                    {booking.court?.branch?.name}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-700 capitalize">
                                                    {booking.court?.sport?.name || booking.court?.sport_type || 'cricket'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{booking.booking_date}</span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {(() => {
                                                                if (booking.time_slots && booking.time_slots.length > 0) {
                                                                    const firstSlot = booking.time_slots[0];
                                                                    const lastSlot = booking.time_slots[booking.time_slots.length - 1];

                                                                    const start = firstSlot?.start || firstSlot?.startTime || firstSlot?.start_time;
                                                                    const end = lastSlot?.end || lastSlot?.endTime || lastSlot?.end_time;

                                                                    if (start && end) return `${start.toString().slice(0, 5)} - ${end.toString().slice(0, 5)}`;
                                                                }
                                                                if (booking.start_time && booking.end_time) {
                                                                    return `${booking.start_time.toString().slice(0, 5)} - ${booking.end_time.toString().slice(0, 5)}`;
                                                                }
                                                                return 'N/A';
                                                            })()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-green-600">₹{booking.total_amount}</span>
                                                        {booking.coupon_code && (
                                                            <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1 py-0.5 rounded border border-purple-100 inline-block mt-0.5">
                                                                {booking.coupon_code}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-slate-600">
                                                        ₹{['paid', 'completed', 'succeeded', 'confirmed', 'success'].includes(booking.payment_status?.toLowerCase())
                                                            ? booking.total_amount
                                                            : (booking.advance_amount || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-red-600">
                                                        ₹{['paid', 'completed', 'succeeded', 'confirmed', 'success'].includes(booking.payment_status?.toLowerCase())
                                                            ? 0
                                                            : (booking.total_amount - (booking.advance_amount || 0))}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {booking.coupon_code ? (
                                                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 whitespace-nowrap">
                                                            🏷 {booking.coupon_code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPaymentColor(booking.payment_status?.toLowerCase() || 'pending')}`}>
                                                            {booking.payment_status || 'Pending'}
                                                        </span>
                                                        {booking.payment_id && (
                                                            <span className="text-[9px] text-slate-400 font-mono" title={booking.payment_id}>
                                                                #{booking.payment_id.slice(-6)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleViewClick(booking)}
                                                            className="p-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(booking)}
                                                            className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                                                            title="Edit Booking"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(booking.id)}
                                                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                                            title="Delete Booking"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="11" className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="p-3 bg-slate-100 rounded-full mb-3">
                                                        <Calendar className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <p className="font-medium">No bookings found</p>
                                                    <button
                                                        onClick={handleAddClick}
                                                        className="mt-2 text-sm text-green-600 hover:text-green-700 font-bold"
                                                    >
                                                        Create your first booking
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4 space-y-4">
                            {currentBookings.length > 0 ? (
                                currentBookings.map((booking, index) => (
                                    <div key={booking.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                                        {/* Status Badge Absolute */}
                                        <div className="absolute top-0 right-0">
                                            <span className={`inline-block px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        {/* Header: Customer Info */}
                                        <div className="flex items-start gap-3 mb-4 pr-16">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                                                {booking.customer_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{booking.customer_name}</h3>
                                                <p className="text-xs text-slate-500">{booking.customer_phone || booking.user?.phone_number || '-'}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">#{booking.id?.slice(0, 8)}</p>
                                            </div>
                                        </div>

                                        {/* Grid Info */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Date</p>
                                                <p className="text-xs font-semibold text-slate-700">{booking.booking_date}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {(() => {
                                                        if (booking.time_slots && booking.time_slots.length > 0) {
                                                            const first = booking.time_slots[0];
                                                            const last = booking.time_slots[booking.time_slots.length - 1];
                                                            const s = first?.start || first?.startTime || first?.start_time;
                                                            const e = last?.end || last?.endTime || last?.end_time;
                                                            return s && e ? `${s.toString().slice(0, 5)} - ${e.toString().slice(0, 5)}` : '';
                                                        }
                                                        if (booking.start_time && booking.end_time) {
                                                            return `${booking.start_time.toString().slice(0, 5)} - ${booking.end_time.toString().slice(0, 5)}`;
                                                        }
                                                        return '';
                                                    })()}
                                                </p>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Venue</p>
                                                <p className="text-xs font-semibold text-slate-700 truncate">{booking.court?.branch?.name}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{booking.court?.sport?.name || booking.court?.sport_type || 'Sports'}</p>
                                            </div>
                                        </div>

                                        {/* Financials Row */}
                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 mb-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900">₹{booking.total_amount}</p>
                                                    {booking.coupon_code && (
                                                        <span className="text-[9px] text-purple-600 font-bold bg-purple-50 px-1 py-0.5 rounded border border-purple-100">
                                                            {booking.coupon_code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Due</p>
                                                <p className="text-sm font-bold text-red-600">
                                                    ₹{['paid', 'completed', 'succeeded', 'confirmed', 'success'].includes(booking.payment_status?.toLowerCase())
                                                        ? 0
                                                        : (booking.total_amount - (booking.advance_amount || 0))}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <button
                                                onClick={() => handleEditClick(booking)}
                                                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 text-amber-600 bg-amber-50 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(booking.id)}
                                                className="min-h-[44px] w-[44px] flex items-center justify-center text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="font-medium">No bookings found</p>
                                    <button
                                        onClick={handleAddClick}
                                        className="mt-2 text-sm text-green-600 hover:text-green-700 font-bold min-h-[44px] inline-flex items-center"
                                    >
                                        Create one now
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredBookings.length > 0 && (
                <div className="flex items-center justify-between px-4">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + itemsPerPage, filteredBookings.length)}</span> of <span className="font-bold">{filteredBookings.length}</span> bookings
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4 text-slate-600" />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawer */}
            <Drawer
                title={editingBooking ? 'Edit Booking' : 'New Booking'}
                isOpen={showDrawer && !viewingBooking}
                onClose={() => {
                    setShowDrawer(false);
                    setEditingBooking(null);
                }}
            >
                <AddBookingForm
                    booking={editingBooking}
                    onClose={() => {
                        setShowDrawer(false);
                        setEditingBooking(null);
                    }}
                    onBookingAdded={handleSaveSuccess}
                />
            </Drawer>
        </div>
    );
}

function BookingViewModal({ booking, onClose, onEdit, getStatusColor, getPaymentColor }) {
    return (
        <div className="bg-white rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">View Booking Details</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Edit Booking"
                    >
                        <Pencil className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        title="Close"
                    >
                        <XCircle className="h-5 w-5 text-slate-600" />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Details */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Customer Details</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{booking.customer_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{booking.customer_phone || booking.user?.phone_number || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Information */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Booking Information</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
                                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{booking.court?.branch?.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sport</label>
                                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md capitalize">{booking.court?.sport?.name || booking.court?.sport_type || 'cricket'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{booking.booking_date}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded-md flex items-center">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Details */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Payment Details</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount</label>
                                    <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-md">₹{booking.total_amount}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Advance Paid</label>
                                    <p className="text-sm font-bold text-green-600 bg-slate-50 px-3 py-2 rounded-md">₹{booking.advance_amount || 0}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Remaining</label>
                                    <p className="text-sm font-bold text-red-600 bg-slate-50 px-3 py-2 rounded-md">
                                        ₹{['paid', 'completed', 'succeeded', 'confirmed', 'success'].includes(booking.payment_status?.toLowerCase())
                                            ? 0
                                            : (booking.total_amount - (booking.advance_amount || 0))}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded-md flex items-center">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${getPaymentColor(booking.payment_status?.toLowerCase() || 'pending')}`}>
                                            {booking.payment_status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {booking.coupon_code && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Applied Coupon</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded-md flex items-center">
                                        <span className="text-sm text-purple-700 font-bold bg-purple-100 px-2 py-1 rounded">
                                            {booking.coupon_code}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Time Slots</h3>
                        <div className="space-y-3">
                            {booking.time_slots && booking.time_slots.length > 0 ? (
                                booking.time_slots.map((slot, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50">
                                        <span className="text-sm text-slate-600">
                                            {(slot.start || slot.startTime || slot.start_time)?.slice(0, 5)} - {(slot.end || slot.endTime || slot.end_time)?.slice(0, 5)}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900">₹{slot.price || slot.price_per_slot || 0}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50">
                                    <span className="text-sm text-slate-600">
                                        {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900">₹{booking.total_amount}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-6 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookingsManager;
