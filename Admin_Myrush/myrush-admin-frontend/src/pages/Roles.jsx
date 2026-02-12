import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { rolesApi } from '../services/adminApi';
import { Edit2, Plus, Trash2, Search, XCircle, ShieldCheck } from 'lucide-react';

const Roles = () => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        } else {
            loadRoles();
        }
    }, [navigate]);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const data = await rolesApi.getAll();
            setRoles(data);
        } catch (err) {
            console.error('Error loading roles:', err);
            setError('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await rolesApi.delete(id);
                loadRoles();
            } catch (err) {
                console.error('Error deleting role:', err);
                setError('Failed to delete role');
            }
        }
    };


    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await rolesApi.update(id, { is_active: !currentStatus });
            loadRoles();
        } catch (err) {
            console.error('Error toggling status:', err);
            setError(err.message || 'Failed to toggle role status');
        }
    };

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout onLogout={() => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_info');
            navigate('/login');
        }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Roles Management</h1>
                <p className="text-sm text-slate-500">Manage admin roles and permissions</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div></div>
                    <div className="flex w-full md:w-auto gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/roles/new')}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-semibold">New Admin Role</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                        <XCircle className="h-5 w-5" />{error}
                    </div>
                )}

                {/* Table Content */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading roles...</div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sr. No.</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRoles.map((role, index) => (
                                            <tr key={role.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{role.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(role.id, role.is_active)}
                                                        className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${role.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${role.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/roles/edit/${role.id}`)}
                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(role.id)}
                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3 p-4">
                                {filteredRoles.map((role, index) => (
                                    <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                                                <h4 className="font-bold text-slate-900">{role.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-slate-500 font-medium">Status:</span>
                                                <button
                                                    onClick={() => handleToggleStatus(role.id, role.is_active)}
                                                    className={`w-9 h-5 flex items-center rounded-full transition-colors duration-200 ease-in-out ${role.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${role.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/roles/edit/${role.id}`)}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredRoles.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                        <p>No roles found.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Roles;
