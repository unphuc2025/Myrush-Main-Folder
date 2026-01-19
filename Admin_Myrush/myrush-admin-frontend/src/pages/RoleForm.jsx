import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { rolesApi } from '../services/adminApi';
import { ArrowLeft, Save, Loader2, CheckSquare, Square } from 'lucide-react';

const MODULES = [
    'Role Management',
    'Sub Admin Management',
    'User Management',
    'Manage Branch',
    'Manage Amenities',
    'Manage Sports',
    'Manage Courts',
    'City Management',
    'Area Management',
    'Gallery Management',
    'Manage Review And Ratings',
    'Reports and analytics',
    'Manage Coupons',
    'Manage Bookings',
    'Transactions And Earnings',
    'FAQ',
    'CMS Pages',
    'Settings'
];

const PERMISSION_TYPES = ['access', 'add', 'edit', 'delete', 'view'];

const RoleForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            loadRole();
        } else {
            // Initialize empty permissions
            const initialPerms = {};
            MODULES.forEach(module => {
                initialPerms[module] = {
                    access: false,
                    add: false,
                    edit: false,
                    delete: false,
                    view: false
                };
            });
            setPermissions(initialPerms);
        }
    }, [id]);

    const loadRole = async () => {
        try {
            setInitialLoading(true);
            const role = await rolesApi.getById(id);
            setName(role.name);
            // Ensure all modules exist in permissions
            const mergedPerms = {};
            MODULES.forEach(module => {
                mergedPerms[module] = {
                    access: false,
                    add: false,
                    edit: false,
                    delete: false,
                    view: false,
                    ...(role.permissions?.[module] || {})
                };
            });
            setPermissions(mergedPerms);
        } catch (err) {
            console.error('Error loading role:', err);
            setError('Failed to load role details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handlePermissionChange = (module, type, value) => {
        setPermissions(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [type]: value
            }
        }));
    };

    const handleRowCheck = (module, isChecked) => {
        setPermissions(prev => ({
            ...prev,
            [module]: {
                access: isChecked,
                add: isChecked,
                edit: isChecked,
                delete: isChecked,
                view: isChecked
            }
        }));
    };

    const handleColumnCheck = (type, isChecked) => {
        setPermissions(prev => {
            const newPerms = { ...prev };
            MODULES.forEach(module => {
                newPerms[module] = {
                    ...newPerms[module],
                    [type]: isChecked
                };
            });
            return newPerms;
        });
    };

    const handleCheckAll = (isChecked) => {
        const newPerms = {};
        MODULES.forEach(module => {
            newPerms[module] = {
                access: isChecked,
                add: isChecked,
                edit: isChecked,
                delete: isChecked,
                view: isChecked
            };
        });
        setPermissions(newPerms);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const data = {
                name,
                permissions,
                is_active: true
            };

            if (isEditMode) {
                await rolesApi.update(id, data);
            } else {
                await rolesApi.create(data);
            }
            navigate('/roles');
        } catch (err) {
            console.error('Error saving role:', err);
            setError(err.message || 'Failed to save role');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/roles')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Role' : 'New Role'}</h1>
                    <p className="text-sm text-slate-500">Define role permissions</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                        <XCircle className="h-5 w-5" />{error}
                    </div>
                )}

                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g. Booking Manager"
                        required
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Module</th>
                                {PERMISSION_TYPES.map(type => (
                                    <th key={type} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{type}</span>
                                            {/* Column Checkbox */}
                                            {/* <input type="checkbox" onChange={(e) => handleColumnCheck(type, e.target.checked)} /> */}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">
                                    <div className="flex items-center justify-center gap-1 cursor-pointer" onClick={(e) => handleCheckAll(e.target.checked)}>
                                        Check All
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MODULES.map(module => (
                                <tr key={module} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-medium text-slate-700">{module}</td>
                                    {PERMISSION_TYPES.map(type => (
                                        <td key={type} className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={permissions[module]?.[type] || false}
                                                onChange={(e) => handlePermissionChange(module, type, e.target.checked)}
                                                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRowCheck(module, !permissions[module]?.access)} // Simple toggle logic based on access
                                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            Check Row
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 pt-4 mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/roles')}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 font-medium disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditMode ? 'Update Role' : 'Create Role'}
                    </button>
                </div>
            </form>
        </Layout>
    );
};

export default RoleForm;
