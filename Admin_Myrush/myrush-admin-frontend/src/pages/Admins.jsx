import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { adminsApi, branchesApi } from '../services/adminApi';
import { Plus, Save, X, User, Shield, Phone, MapPin, Mail } from 'lucide-react';

function Admins() {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [branches, setBranches] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        role: 'super_admin',
        branch_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        } else {
            loadData();
        }
    }, [navigate]);

    const loadData = async () => {
        try {
            const [adminsData, branchesData] = await Promise.all([
                adminsApi.getAll(),
                branchesApi.getAll()
            ]);
            setAdmins(adminsData);
            setBranches(branchesData);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load data.' });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Basic validation
            if (!formData.name || !formData.mobile || !formData.password || !formData.email) {
                throw new Error('Please fill all required fields');
            }
            if (formData.role === 'branch_admin' && !formData.branch_id) {
                throw new Error('Please select a branch for Branch Admin');
            }

            const payload = { ...formData };
            if (payload.role === 'super_admin') {
                delete payload.branch_id;
            }

            await adminsApi.create(payload);
            setMessage({ type: 'success', text: 'Admin created successfully!' });

            loadData();
            resetForm();
            setShowForm(false);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to create admin.' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            mobile: '',
            email: '',
            password: '',
            role: 'super_admin',
            branch_id: ''
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/login');
    };

    const getBranchName = (branchId) => {
        if (!branchId) return '-';
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : 'Unknown Branch';
    };

    if (showForm) {
        return (
            <Layout onLogout={handleLogout}>
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Add New Admin</h1>
                            <p className="mt-1 text-slate-500">Create a new administrator account.</p>
                        </div>
                        <button
                            onClick={() => setShowForm(false)}
                            className="rounded-lg p-3 text-slate-400 hover:bg-slate-50 hover:text-red-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 flex items-center rounded-lg p-4 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="super_admin">Super Admin</option>
                                <option value="branch_admin">Branch Admin</option>
                            </select>
                        </div>

                        {formData.role === 'branch_admin' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Assign Branch</label>
                                <select
                                    name="branch_id"
                                    value={formData.branch_id}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                >
                                    <option value="">Select a Branch</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name} ({branch.city?.name})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="e.g. john@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="tel"
                                    name="mobile"
                                    placeholder="Enter mobile number"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Set a password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? 'Creating...' : 'Create Admin'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </Layout>
        );
    }

    return (
        <Layout onLogout={handleLogout}>
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Manage Admins</h1>
                        <p className="mt-1 text-slate-500">View and manage super admins and branch admins.</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="rounded-lg bg-green-600 p-3 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="h-6 w-6" />
                        <span className="hidden sm:inline">Add Admin</span>
                    </button>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <h2 className="mb-6 text-xl font-bold text-slate-900">All Admins</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Name</th>
                                <th className="px-6 py-3 font-semibold">Role</th>
                                <th className="px-6 py-3 font-semibold">Branch</th>
                                <th className="px-6 py-3 font-semibold">Mobile</th>
                                <th className="px-6 py-3 font-semibold">Email</th>
                                <th className="px-6 py-3 font-semibold">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {admin.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${admin.role === 'super_admin'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {admin.role === 'super_admin' ? 'Super Admin' : 'Branch Admin'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {admin.role === 'branch_admin' ? (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {getBranchName(admin.branch_id)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{admin.mobile}</td>
                                    <td className="px-6 py-4">{admin.email || '-'}</td>
                                    <td className="px-6 py-4">
                                        {new Date(admin.created_at || Date.now()).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {admins.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        No admins found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

export default Admins;
