import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { rolesApi } from '../services/adminApi';
import { Edit2, Plus, Trash2, Search, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

const Roles = () => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Permission Logic
    const permissions = (() => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
            if (adminInfo.role === 'super_admin') return {
                add: true, edit: true, delete: true, view: true, access: true
            };
            return adminInfo.permissions?.['Role Management'] || {};
        } catch { return {}; }
    })();

    const canAdd = !!permissions.add;
    const canEdit = !!permissions.edit;
    const canDelete = !!permissions.delete;
    const hasAccess = !!(permissions.view || permissions.access);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        } else if (hasAccess) {
            loadRoles();
        } else {
            setLoading(false);
        }
    }, [navigate, hasAccess]);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const data = await rolesApi.getAll();
            setRoles(data);
        } catch (err) {
            console.error('Error loading roles:', err);
            const errorMsg = err.message && (err.message.toLowerCase().includes('authorized') || err.message.includes('403') || err.message.toLowerCase().includes('access'))
                ? 'You do not have access to view roles.'
                : 'Unable to load roles right now. Please refresh the page or try again later.';
            setError(errorMsg);
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
                const message = err.message && (err.message.toLowerCase().includes('authorized') || err.message.includes('403') || err.message.toLowerCase().includes('access'))
                    ? 'You do not have access to delete roles.'
                    : (err?.response?.data?.detail || 'Unable to delete this role. It may have admins assigned to it.');
                setError(message);
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await rolesApi.update(id, { is_active: !currentStatus });
            loadRoles();
        } catch (err) {
            console.error('Error toggling status:', err);
            const message = err.message && (err.message.toLowerCase().includes('authorized') || err.message.includes('403') || err.message.toLowerCase().includes('access'))
                ? 'You do not have access to update roles.'
                : (err.message || 'Failed to toggle role status');
            setError(message);
        }
    };

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return null;

    if (!hasAccess) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 max-w-sm">You do not have permission to manage roles. Please contact your administrator.</p>
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Roles Management</h1>
                <p className="text-sm text-slate-500">Manage admin roles and permissions</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
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
                    {canAdd && (
                        <button
                            onClick={() => navigate('/roles/new')}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-semibold">New Admin Role</span>
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                        <XCircle className="h-5 w-5" />{error}
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sr. No.</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    {(canEdit || canDelete) && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRoles.map((role, index) => (
                                    <tr key={role.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{role.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => canEdit && handleToggleStatus(role.id, role.is_active)}
                                                disabled={!canEdit}
                                                className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${role.is_active ? 'bg-green-500' : 'bg-slate-300'} ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${role.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => navigate(`/roles/edit/${role.id}`)}
                                                            className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(role.id)}
                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRoles.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-base font-medium">No roles found.</p>
                            </div>
                        )}
                    </div>

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
                                            onClick={() => canEdit && handleToggleStatus(role.id, role.is_active)}
                                            disabled={!canEdit}
                                            className={`w-9 h-5 flex items-center rounded-full transition-colors duration-200 ease-in-out ${role.is_active ? 'bg-green-500' : 'bg-slate-300'} ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${role.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                                {(canEdit || canDelete) && (
                                    <div className="flex items-center gap-2">
                                        {canEdit && (
                                            <button
                                                onClick={() => navigate(`/roles/edit/${role.id}`)}
                                                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Roles;
