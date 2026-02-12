import { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, MapPin, Check, X, Building2 } from 'lucide-react';
import { adminsApi, branchesApi, rolesApi } from '../../services/adminApi';

function AddAdminForm({ onCancel, onSave, initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        role: 'super_admin',
        role_id: '',
        branch_ids: []
    });
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
        if (initialData) {
            setFormData({
                name: initialData.name,
                mobile: initialData.mobile,
                email: initialData.email || '',
                password: '', // Don't populate password on edit
                role_id: initialData.role_id || '',
                // Populate branch_ids from accessible_branch_ids (new) or legacy branch_id
                branch_ids: initialData.accessible_branch_ids || (initialData.branch_id ? [initialData.branch_id] : [])
            });
        }
    }, [initialData]);

    const loadData = async () => {
        try {
            const [branchesData, rolesData] = await Promise.all([
                branchesApi.getAll(),
                rolesApi.getAll()
            ]);
            setBranches(branchesData);
            setRoles(rolesData);
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = { ...formData };

            // Basic validation
            if (payload.role !== 'super_admin' && !payload.role_id) {
                throw new Error('Please select a role');
            }

            // Legacy support: fill 'role' string if needed by backend validation
            if (payload.role !== 'super_admin') {
                payload.role = 'custom_role';
            }

            // Clean up empty password if editing
            if (initialData && !payload.password) {
                delete payload.password;
            }

            let result;
            if (initialData) {
                result = await adminsApi.update(initialData.id, payload);
            } else {
                result = await adminsApi.create(payload);
            }

            onSave(result);
        } catch (err) {
            console.error('Error saving admin:', err);
            setError(err.message || 'Failed to save admin');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto px-1 py-2 space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm font-medium">
                        <X className="h-5 w-5" />{error}
                    </div>
                )}

                {/* Role Selection */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assign Role</label>
                    <div className="relative group">
                        <Shield className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <select
                            value={formData.role === 'super_admin' ? 'super_admin' : (formData.role === 'branch_admin' ? 'branch_admin' : formData.role_id)}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === 'super_admin') {
                                    setFormData({ ...formData, role: 'super_admin', role_id: '', branch_ids: [] });
                                } else if (val === 'branch_admin') {
                                    setFormData({ ...formData, role: 'branch_admin', role_id: '', branch_ids: [] });
                                } else {
                                    setFormData({ ...formData, role: 'custom_role', role_id: val });
                                }
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300"
                            required
                        >
                            <option value="">Select a Role</option>
                            <option value="super_admin" className="font-bold text-green-600">★ Super Admin (Full Access)</option>
                            <option value="branch_admin" className="font-bold text-blue-600">Branch Admin</option>
                            <option disabled>──────────────</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Branch Selection (Multi-select) - Only show for Branch Admin or Custom Roles */}
                {(formData.role === 'branch_admin' || formData.role === 'custom_role') && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                            Assign Branches (Select Multiple)
                        </label>
                        <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                            <div className="max-h-48 overflow-y-auto p-2 bg-slate-50 space-y-1">
                                {branches.length === 0 && <div className="p-3 text-sm text-slate-400 text-center">No branches available</div>}
                                {branches.map(branch => {
                                    const isSelected = formData.branch_ids.includes(branch.id);
                                    return (
                                        <label
                                            key={branch.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-white shadow-sm border border-green-100' : 'hover:bg-white hover:shadow-sm'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'
                                                }`}>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isSelected}
                                                onChange={() => {
                                                    const currentIds = [...formData.branch_ids];
                                                    if (isSelected) {
                                                        setFormData({ ...formData, branch_ids: currentIds.filter(id => id !== branch.id) });
                                                    } else {
                                                        setFormData({ ...formData, branch_ids: [...currentIds, branch.id] });
                                                    }
                                                }}
                                            />
                                            <div className="flex-1">
                                                <div className={`font-medium text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {branch.name}
                                                </div>
                                                <div className="text-xs text-slate-400">{branch.city?.name}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 ml-1">
                            Select all branches this admin needs access to.
                        </p>
                    </div>
                )}

                <div className="h-px bg-slate-100 my-4" />

                {/* Personal Info */}
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300 text-slate-900"
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300 text-slate-900"
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Mobile Number</label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300 text-slate-900"
                                placeholder="+91 98765 43210"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                            {initialData ? 'New Password (Optional)' : 'Password'}
                        </label>
                        <div className="relative group">
                            <Shield className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300 text-slate-900"
                                placeholder={initialData ? "Leave blank to keep current" : "Set a secure password"}
                                required={!initialData}
                            />
                        </div>
                        {initialData && <p className="text-xs text-slate-400 mt-1 ml-1">Leave empty if you don't want to change the password.</p>}
                    </div>
                </div>
            </div>

            <div className="pt-6 mt-2 border-t border-slate-100 flex gap-4 bg-white sticky bottom-0 z-10 pb-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] px-6 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Check className="h-5 w-5" />}
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update Admin' : 'Create Admin')}
                </button>
            </div>
        </form>
    );
}

export default AddAdminForm;
