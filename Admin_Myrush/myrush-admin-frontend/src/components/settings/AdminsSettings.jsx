import { useState, useEffect } from 'react';
import { Edit2, Plus, User, Trash2, Search, XCircle, Shield, Building2, MapPin } from 'lucide-react';
import Drawer from './Drawer';
import AddAdminForm from './AddAdminForm';
import { adminsApi, branchesApi } from '../../services/adminApi';

function AdminsSettings() {
    const [admins, setAdmins] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Drawer State
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [adminsData, branchesData] = await Promise.all([
                adminsApi.getAll(),
                branchesApi.getAll()
            ]);
            setAdmins(adminsData);
            setBranches(branchesData);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load admins');
        } finally {
            setLoading(false);
        }
    };

    const getBranchName = (branchId) => {
        if (!branchId) return '-';
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : 'Unknown';
    };

    const handleAddClick = () => {
        setEditingAdmin(null);
        setShowDrawer(true);
    };

    const handleEditClick = (admin) => {
        setEditingAdmin(admin);
        setShowDrawer(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                await adminsApi.delete(id);
                await loadData();
            } catch (err) {
                console.error('Error deleting admin:', err);
                setError('Failed to delete admin');
            }
        }
    };

    const handleSaveSuccess = async () => {
        await loadData();
        setShowDrawer(false);
        setEditingAdmin(null);
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.mobile?.includes(searchTerm)
    );

    return (
        <div>
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div></div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">Add Admin</span>
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
                    <div className="p-12 text-center text-slate-500">Loading admins...</div>
                ) : (
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAdmins.map(admin => (
                                        <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{admin.name}</div>
                                                        <div className="text-xs text-slate-400">Created: {new Date(admin.created_at || Date.now()).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        <Shield className="h-3 w-3" />
                                                        {admin.role_rel ? admin.role_rel.name : (admin.role === 'super_admin' ? 'Super Admin' : 'Branch Admin')}
                                                    </span>
                                                    {admin.accessible_branches && admin.accessible_branches.length > 0 ? (
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            {admin.accessible_branches.map(b => (
                                                                <span key={b.id} className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" /> {b.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : admin.branch_id && (
                                                        <span className="text-xs text-slate-500 flex items-center gap-1 ml-1">
                                                            <MapPin className="h-3 w-3" /> {getBranchName(admin.branch_id)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">{admin.email}</div>
                                                <div className="text-sm text-slate-500">{admin.mobile}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(admin)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(admin.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        <div className="md:hidden space-y-4 p-4">
                            {filteredAdmins.map(admin => (
                                <div key={admin.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{admin.name}</div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    <Shield className="h-3 w-3" />
                                                    {admin.role_rel ? admin.role_rel.name : (admin.role === 'super_admin' ? 'Super Admin' : 'Branch Admin')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Email:</span>
                                            <span className="text-slate-700 font-medium">{admin.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Mobile:</span>
                                            <span className="text-slate-700 font-medium">{admin.mobile}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 mt-2">
                                            <div className="text-slate-500 mb-1 text-xs">Access:</div>
                                            {admin.accessible_branches && admin.accessible_branches.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {admin.accessible_branches.map(b => (
                                                        <span key={b.id} className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {b.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : admin.branch_id ? (
                                                <span className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded inline-flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {getBranchName(admin.branch_id)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No specific branch assigned</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <span className="text-xs text-slate-400">
                                            Created: {new Date(admin.created_at || Date.now()).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(admin)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(admin.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Drawer */}
            <Drawer
                title={editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                isOpen={showDrawer}
                onClose={() => setShowDrawer(false)}
            >
                <AddAdminForm
                    initialData={editingAdmin}
                    onCancel={() => setShowDrawer(false)}
                    onSave={handleSaveSuccess}
                />
            </Drawer>
        </div>
    );
}

export default AdminsSettings;
