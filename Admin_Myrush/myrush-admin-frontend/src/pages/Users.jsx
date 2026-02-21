import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { usersApi } from '../services/adminApi';
import { Search, Trash2, Edit2, Eye, XCircle, Save, User as UserIcon, Mail, Phone, Calendar, Info } from 'lucide-react';
import Drawer from '../components/settings/Drawer';

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('view'); // 'view' or 'edit'
    const [selectedUser, setSelectedUser] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) navigate('/login');
        loadUsers();
    }, [navigate, page, searchTerm]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {
                skip: (page - 1) * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE,
                search: searchTerm
            };
            const response = await usersApi.getAll(params);
            setUsers(response.items || []);
            setTotalPages(response.pages || 1);
            setTotalItems(response.total || 0);
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await usersApi.delete(id);
                loadUsers();
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Failed to delete user');
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await usersApi.toggleStatus(id);
            // Optimistically update local state for better UX
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
        } catch (err) {
            console.error(err);
            alert('Failed to toggle status: ' + err.message);
        }
    };

    const handleView = (user) => {
        setSelectedUser(user);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: user.phone_number || ''
        });
        setDrawerMode('edit');
        setIsDrawerOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await usersApi.update(selectedUser.id, editFormData);
            setIsDrawerOpen(false);
            loadUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Failed to update user: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout onLogout={() => {
            localStorage.removeItem('admin_token');
            navigate('/login');
        }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                <p className="text-sm text-slate-500">Manage registered users</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="text-sm text-slate-500">
                    Showing {users.length} of {totalItems} records
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                    <XCircle className="h-5 w-5" />{error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading users...</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sr no.</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">First Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Last Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contact No</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user, index) => (
                                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {(page - 1) * ITEMS_PER_PAGE + index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {user.first_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {user.last_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {user.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {user.phone_number || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${user.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${user.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleView(user)}
                                                        className="p-1.5 text-purple-600 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-1.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && <div className="p-12 text-center text-slate-500 font-medium">No users found.</div>}
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4 space-y-4">
                            {users.map((user, index) => (
                                <div key={user.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                {user.first_name ? user.first_name.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">
                                                    {user.first_name} {user.last_name || ''}
                                                </h3>
                                                <p className="text-xs text-slate-500">#{(page - 1) * ITEMS_PER_PAGE + index + 1}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleStatus(user.id)}
                                            className={`w-10 h-5 flex items-center rounded-full transition-colors duration-200 ease-in-out ${user.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${user.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            <span className="truncate">{user.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            <span>{user.phone_number || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleView(user)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-purple-600 bg-purple-50 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all active:scale-95"
                                        >
                                            <Eye className="h-4 w-4" /> View
                                        </button>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-amber-600 bg-amber-50 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all active:scale-95"
                                        >
                                            <Edit2 className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && <div className="py-12 text-center text-slate-500">No users found</div>}
                        </div>
                    </>
                )}

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-medium text-slate-500 tracking-wide">
                        Page <span className="text-slate-900 font-bold">{page}</span> of <span className="text-slate-900 font-bold">{totalPages}</span>
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        Next
                    </button>
                </div>
            </div>

            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={drawerMode === 'view' ? 'User Details' : 'Edit User'}
            >
                {selectedUser && (
                    <div className="space-y-6 pb-20">
                        {drawerMode === 'view' ? (
                            <div className="space-y-6">
                                {/* Profile Summary */}
                                <div className="flex flex-col items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-3xl font-bold mb-4 shadow-inner">
                                        {selectedUser.first_name ? selectedUser.first_name.charAt(0) : 'U'}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedUser.first_name} {selectedUser.last_name || ''}</h3>
                                    <p className="text-sm text-slate-500 mt-1">Player Profile</p>
                                    <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${selectedUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedUser.is_active ? 'Active Account' : 'Inactive Account'}
                                    </span>
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                                            <p className="text-slate-900 font-medium">{selectedUser.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                        <Phone className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact Number</p>
                                            <p className="text-slate-900 font-medium">{selectedUser.phone_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                        <Calendar className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Joined On</p>
                                            <p className="text-slate-900 font-medium">{new Date(selectedUser.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                        <Info className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User ID</p>
                                            <p className="text-slate-500 font-mono text-xs truncate max-w-[200px]">{selectedUser.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">First Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={editFormData.first_name}
                                            onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Last Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={editFormData.last_name}
                                            onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <input
                                            type="email"
                                            value={editFormData.email}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={editFormData.phone_number}
                                            onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-70 mt-6 shadow-lg shadow-slate-900/10"
                                >
                                    {isSubmitting ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-5 w-5" />}
                                    {isSubmitting ? 'Saving Changes...' : 'Save User Data'}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </Drawer>
        </Layout >
    );
};

export default Users;
