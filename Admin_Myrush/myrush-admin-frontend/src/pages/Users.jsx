import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { usersApi } from '../services/adminApi';
import { Search, Plus, Trash2, Edit2, Eye, XCircle } from 'lucide-react';

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

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) navigate('/login');
        loadUsers();
    }, [navigate, page, searchTerm]); // Reload when page or search changes

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {
                skip: (page - 1) * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE,
                search: searchTerm
            };
            const response = await usersApi.getAll(params);

            // Backend returns { items: [], total: 0, page: 1, pages: 1 }
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
        // TODO: Backend support for specific toggle?
        // Or we just update is_active.
        // For now, let's assume we can fetch, update, save.
        // Or specific endpoint.
        try {
            await usersApi.toggleStatus(id);
            loadUsers();
        } catch (err) {
            console.error(err);
        }
    }

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
                {/* Showing X records */}
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
                                setPage(1); // Reset to page 1 on search
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
                                        <th className="p-4 w-4">
                                            <input type="checkbox" className="rounded border-slate-300" />
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sr no.</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">First Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Last Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contact No</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user, index) => (
                                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <input type="checkbox" className="rounded border-slate-300" />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {(page - 1) * ITEMS_PER_PAGE + index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {user.first_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {user.last_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600">
                                                {user.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600">
                                                {user.phone_number || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleToggleStatus(user.id)}
                                                        className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${user.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${user.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-1.5 text-purple-600 bg-purple-50 rounded hover:bg-purple-100">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-1.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {users.length === 0 && (
                                <div className="p-12 text-center text-slate-500">
                                    No users found
                                </div>
                            )}
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4 space-y-4">
                            {users.map((user, index) => (
                                <div key={user.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold text-slate-900">
                                                {user.first_name} {user.last_name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">#{(page - 1) * ITEMS_PER_PAGE + index + 1}</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleStatus(user.id)}
                                            className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${user.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${user.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-slate-500">Email:</span>
                                            <span className="text-blue-600 font-medium">{user.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-slate-500">Phone:</span>
                                            <span className="text-blue-600 font-medium">{user.phone_number || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                                        <button className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                            <Eye className="h-4 w-4" />
                                            <span className="text-sm font-medium">View</span>
                                        </button>
                                        <button className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                                            <Edit2 className="h-4 w-4" />
                                            <span className="text-sm font-medium">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="min-h-[44px] flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {users.length === 0 && (
                                <div className="py-12 text-center text-slate-500">
                                    No users found
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </Layout >
    );
};

export default Users;
