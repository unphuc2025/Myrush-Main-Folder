import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, CheckCircle, XCircle, FileText, Percent, AlertCircle, X } from 'lucide-react';
import { policiesApi } from '../../services/adminApi';

const BookingPolicies = () => {
    const [policies, setPolicies] = useState([]);
    const [view, setView] = useState('list'); // 'list', 'form'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingPolicy, setEditingPolicy] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        type: 'cancellation', // 'cancellation' or 'terms'
        name: '',
        value: '',
        content: '',
        is_active: true
    });

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const data = await policiesApi.getAll();
            setPolicies(data);
        } catch (err) {
            console.error("Failed to fetch policies:", err);
            setError("Failed to load policies. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingPolicy(null);
        setFormData({
            type: 'cancellation',
            name: '',
            value: '',
            content: '',
            is_active: true
        });
        setView('form');
        setError(null);
        setSuccessMessage(null);
    };

    const handleEdit = (policy) => {
        setEditingPolicy(policy);
        setFormData({
            type: policy.type,
            name: policy.name,
            value: policy.value || '',
            content: policy.content || '',
            is_active: policy.is_active
        });
        setView('form');
        setError(null);
        setSuccessMessage(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this policy?")) return;

        try {
            await policiesApi.delete(id);
            setPolicies(prev => prev.filter(p => p.id !== id));
            setSuccessMessage("Policy deleted successfully.");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to delete policy:", err);
            setError("Failed to delete policy.");
        }
    };

    const handleToggleActive = async (policy) => {
        try {
            const updated = await policiesApi.update(policy.id, { is_active: !policy.is_active });
            setPolicies(prev => prev.map(p => p.id === policy.id ? updated : p));
        } catch (err) {
            console.error("Failed to toggle status:", err);
            setError("Failed to update status.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (!formData.name.trim()) {
            setError("Name is required");
            return;
        }
        if (formData.type === 'cancellation' && !formData.value) {
            setError("Cancellation value is required");
            return;
        }
        if (formData.type === 'terms' && !formData.content) {
            setError("Terms content is required");
            return;
        }

        try {
            if (editingPolicy) {
                const updated = await policiesApi.update(editingPolicy.id, formData);
                setPolicies(prev => prev.map(p => p.id === editingPolicy.id ? updated : p));
                setSuccessMessage("Policy updated successfully!");
            } else {
                const created = await policiesApi.create(formData);
                setPolicies(prev => [...prev, created]);
                setSuccessMessage("Policy created successfully!");
            }

            setView('list');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to save policy:", err);
            setError("Failed to save policy. Please try again.");
        }
    };

    if (loading && view === 'list' && policies.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading policies...</div>;
    }

    // LIST VIEW
    if (view === 'list') {
        return (
            <div className="space-y-6 max-w-6xl mx-auto p-1">
                {/* Header Actions */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Policies & Terms</h2>
                        <p className="text-sm text-slate-500">Manage cancellation rules and terms of service</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">Add Policy</span>
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        {successMessage}
                    </div>
                )}

                {/* Policies Table (Desktop) */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {policies.map((policy) => (
                                <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{policy.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${policy.type === 'cancellation'
                                            ? 'bg-red-50 text-red-700 border-red-100'
                                            : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {policy.type === 'cancellation' ? <Percent className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                            {policy.type === 'cancellation' ? 'Cancellation' : 'Terms'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {policy.type === 'cancellation' ? (
                                            <span className="font-mono text-slate-600">{policy.value}% Fee</span>
                                        ) : (
                                            <span className="text-slate-500 text-sm truncate max-w-xs block" title={policy.content}>
                                                {policy.content?.substring(0, 50)}...
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(policy)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${policy.is_active ? 'bg-green-600' : 'bg-slate-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${policy.is_active ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(policy.updated_at || policy.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(policy)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(policy.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {policies.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="p-3 bg-slate-100 rounded-full mb-3">
                                                <FileText className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="font-medium">No policies found</p>
                                            <p className="text-sm mt-1">Create a new policy to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {policies.map((policy) => (
                        <div key={policy.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-slate-900 mb-1">{policy.name}</div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${policy.type === 'cancellation'
                                        ? 'bg-red-50 text-red-700 border-red-100'
                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {policy.type === 'cancellation' ? <Percent className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                        {policy.type === 'cancellation' ? 'Cancellation' : 'Terms'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleToggleActive(policy)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${policy.is_active ? 'bg-green-600' : 'bg-slate-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${policy.is_active ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                {policy.type === 'cancellation' ? (
                                    <span className="font-mono">{policy.value}% Fee</span>
                                ) : (
                                    <span className="line-clamp-3 italic">
                                        "{policy.content}"
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                                <span className="text-xs text-slate-400">
                                    Updated: {new Date(policy.updated_at || policy.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(policy)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(policy.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {policies.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center">
                                <div className="p-3 bg-slate-100 rounded-full mb-3">
                                    <FileText className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="font-medium">No policies found</p>
                                <p className="text-sm mt-1">Create a new policy to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // FORM VIEW
    return (
        <div className="max-w-2xl mx-auto p-1">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setView('list')}
                    className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <X className="h-5 w-5 mr-1" />
                    Cancel
                </button>
                <h2 className="text-xl font-bold text-slate-900">
                    {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
                </h2>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Policy Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Policy Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'cancellation' })}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${formData.type === 'cancellation'
                                    ? 'border-slate-800 bg-slate-50 text-slate-900'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                            >
                                <Percent className="h-5 w-5" />
                                <span className="font-medium">Cancellation Fee</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'terms' })}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${formData.type === 'terms'
                                    ? 'border-slate-800 bg-slate-50 text-slate-900'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                            >
                                <FileText className="h-5 w-5" />
                                <span className="font-medium">Terms & Conditions</span>
                            </button>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Policy Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={formData.type === 'cancellation' ? 'e.g., Standard Cancellation' : 'e.g., General Terms'}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {formData.type === 'cancellation' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Cancellation Fee Percentage (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                    placeholder="20"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500">%</span>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                This percentage will be withheld from the refund amount.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={10}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-sm leading-relaxed"
                                placeholder="Enter terms and conditions text here..."
                            />
                        </div>
                    )}

                    {/* Active Status */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${formData.is_active ? 'bg-green-600' : 'bg-slate-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                        <span className="text-sm font-medium text-slate-700">
                            Set as Active
                        </span>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Save className="h-4 w-4" />
                        Save Policy
                    </button>
                </div>
            </form >
        </div >
    );
};

export default BookingPolicies;
