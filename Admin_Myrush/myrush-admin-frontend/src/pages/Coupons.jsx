import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, Calendar, AlertCircle, Percent, DollarSign, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { couponsApi, branchesApi, gameTypesApi, courtsApi, usersApi } from '../services/adminApi';

function Coupons() {
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState([]);
    const [branches, setBranches] = useState([]);
    const [gameTypes, setGameTypes] = useState([]);
    const [courts, setCourts] = useState([]);
    const [users, setUsers] = useState([]);

    // Auth Check
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        }
        fetchMetadata();
    }, [navigate]);

    const fetchMetadata = async () => {
        try {
            const [bData, gData, cData, uData] = await Promise.all([
                branchesApi.getAll(),
                gameTypesApi.getAll(),
                courtsApi.getAll(),
                usersApi.getAll()
            ]);
            setBranches(bData);
            setGameTypes(gData);
            setCourts(cData);
            setUsers(uData);
        } catch (error) {
            console.error("Failed to fetch metadata:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/login');
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'flat', // 'percentage' or 'flat'
        discount_value: '',
        min_order_value: 0,
        max_discount: '',
        start_date: '',
        end_date: '',
        usage_limit: '',
        per_user_limit: 1,
        applicable_type: 'all', // 'all', 'branch', 'game_type', 'court'
        applicable_ids: [],
        terms_condition: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const data = await couponsApi.getAll();
            setCoupons(data);
        } catch (err) {
            setError('Failed to fetch coupons');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (coupon.description && coupon.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddClick = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            description: '',
            discount_type: 'flat',
            discount_value: '',
            min_order_value: 0,
            max_discount: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            usage_limit: '',
            per_user_limit: 1,
            applicable_type: 'all',
            applicable_ids: [],
            terms_condition: '',
            is_active: true
        });
        setShowForm(true);
    };

    const handleEditClick = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_order_value: coupon.min_order_value || 0,
            max_discount: coupon.max_discount || '',
            start_date: coupon.start_date.split('T')[0],
            end_date: coupon.end_date.split('T')[0],
            usage_limit: coupon.usage_limit || '',
            per_user_limit: coupon.per_user_limit || 1,
            applicable_type: coupon.applicable_type || 'all',
            applicable_ids: coupon.applicable_ids || [],
            terms_condition: coupon.terms_condition || '',
            is_active: coupon.is_active
        });
        setShowForm(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await couponsApi.delete(id);
                fetchCoupons();
            } catch (err) {
                alert('Failed to delete coupon');
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await couponsApi.toggleStatus(id);
            fetchCoupons();
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Prepare payload
        const payload = {
            ...formData,
            discount_value: parseFloat(formData.discount_value),
            min_order_value: parseFloat(formData.min_order_value) || 0,
            max_discount: formData.discount_type === 'percentage' && formData.max_discount ? parseFloat(formData.max_discount) : null,
            usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
            per_user_limit: formData.per_user_limit ? parseInt(formData.per_user_limit) : 1,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString()
        };

        try {
            if (editingCoupon) {
                await couponsApi.update(editingCoupon.id, payload);
            } else {
                await couponsApi.create(payload);
            }
            setShowForm(false);
            fetchCoupons();
        } catch (err) {
            alert(err.message || 'Failed to save coupon');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout onLogout={handleLogout}>
            <div className="p-6 max-w-7xl mx-auto">
                {showForm ? (
                    // Form View
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Tag className="h-5 w-5 text-green-600" />
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Back to List
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={20}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 uppercase"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="SUMMER50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.discount_type}
                                        onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                    >
                                        <option value="flat">Flat Amount (₹)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.discount_value}
                                        onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                                    />
                                </div>

                                {formData.discount_type === 'percentage' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            value={formData.max_discount}
                                            onChange={e => setFormData({ ...formData, max_discount: e.target.value })}
                                            placeholder="Optional limit"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.min_order_value}
                                        onChange={e => setFormData({ ...formData, min_order_value: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.usage_limit}
                                        onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                                        placeholder="Unlimited if empty"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.per_user_limit}
                                        onChange={e => setFormData({ ...formData, per_user_limit: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Applicable To</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={formData.applicable_type}
                                        onChange={e => setFormData({ ...formData, applicable_type: e.target.value, applicable_ids: [] })}
                                    >
                                        <option value="all">All</option>
                                        <option value="branch">Specific Branch</option>
                                        <option value="game_type">Specific Sports</option>
                                        <option value="court">Specific Court</option>
                                        <option value="specific_user">Specific User</option>
                                    </select>
                                </div>

                                {formData.applicable_type !== 'all' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select {formData.applicable_type === 'branch' ? 'Branches' :
                                                formData.applicable_type === 'game_type' ? 'Sports' :
                                                    formData.applicable_type === 'court' ? 'Courts' : 'Users'}
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                                            {(formData.applicable_type === 'branch' ? branches :
                                                formData.applicable_type === 'game_type' ? gameTypes :
                                                    formData.applicable_type === 'court' ? courts :
                                                        users).map(item => (
                                                            <label key={item.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border border-transparent hover:border-gray-200">
                                                                <input
                                                                    type="checkbox"
                                                                    value={item.id}
                                                                    checked={formData.applicable_ids.includes(String(item.id))}
                                                                    onChange={e => {
                                                                        const id = String(item.id);
                                                                        const newIds = e.target.checked
                                                                            ? [...formData.applicable_ids, id]
                                                                            : formData.applicable_ids.filter(i => i !== id);
                                                                        setFormData(prev => ({ ...prev, applicable_ids: newIds }));
                                                                    }}
                                                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                                                                />
                                                                <div className="truncate flex flex-col w-full overflow-hidden">
                                                                    <span className="font-medium truncate" title={formData.applicable_type === 'specific_user' ? (item.first_name || item.full_name || 'Unknown User') : (item.branch_name || item.name || item.court_name)}>
                                                                        {formData.applicable_type === 'specific_user' ? (item.first_name || item.full_name || item.phone_number) : (item.branch_name || item.name || item.court_name)}
                                                                    </span>
                                                                    {formData.applicable_type === 'specific_user' && (
                                                                        <span className="text-xs text-gray-500 truncate block">
                                                                            {item.phone_number} {item.email ? `• ${item.email}` : ''}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        ))}
                                            {(formData.applicable_type === 'branch' ? branches :
                                                formData.applicable_type === 'game_type' ? gameTypes :
                                                    formData.applicable_type === 'court' ? courts :
                                                        users).length === 0 && (
                                                    <p className="text-gray-500 text-sm col-span-full text-center py-2">No items available.</p>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Details about the offer..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows="3"
                                    value={formData.terms_condition}
                                    onChange={e => setFormData({ ...formData, terms_condition: e.target.value })}
                                    placeholder="Enter terms and conditions..."
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    // List View
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Tag className="h-6 w-6 text-green-600" />
                                    Manage Coupons
                                </h1>
                                <p className="text-gray-500 mt-1">Create and manage discount coupons</p>
                            </div>
                            <button
                                onClick={handleAddClick}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <Plus className="h-5 w-5" />
                                Add Coupon
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by code or description..."
                                className="pl-10 pr-4 py-2 w-full md:w-96 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>

                        {/* Coupon List */}
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading coupons...</p>
                            </div>
                        ) : filteredCoupons.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                                <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No coupons found</h3>
                                <p className="text-gray-500">Get started by creating your first coupon.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCoupons.map(coupon => (
                                    <div key={coupon.id} className={`bg-white rounded-xl shadow-sm border ${coupon.is_active ? 'border-gray-200' : 'border-red-100 bg-red-50'} overflow-hidden hover:shadow-md transition-shadow`}>
                                        {/* Card Header */}
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-gray-100 text-gray-800 font-mono font-bold px-2 py-1 rounded text-sm border border-gray-200">
                                                        {coupon.code}
                                                    </span>
                                                    {!coupon.is_active && (
                                                        <span className="text-red-600 text-xs font-medium bg-red-100 px-2 py-0.5 rounded-full">Inactive</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-1">{coupon.description || 'No description'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEditClick(coupon)} className="p-1.5 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-50">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(coupon.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${coupon.discount_type === 'percentage' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {coupon.discount_type === 'percentage' ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {coupon.discount_type === 'flat' ? '₹' : ''}{coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ''} OFF
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        {coupon.min_order_value > 0 ? `Min order ₹${coupon.min_order_value}` : 'No min order'}
                                                        {coupon.max_discount && ` • Max `}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span>
                                                    Valid: {new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.end_date).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center pt-2">
                                                <div className="text-xs text-gray-500">
                                                    Usage: {coupon.usage_count} / {coupon.usage_limit ? coupon.usage_limit : '∞'}
                                                </div>
                                                <button
                                                    onClick={() => handleToggleStatus(coupon.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${coupon.is_active
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <Power className="h-3 w-3" />
                                                    {coupon.is_active ? 'Active' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}

export default Coupons;
