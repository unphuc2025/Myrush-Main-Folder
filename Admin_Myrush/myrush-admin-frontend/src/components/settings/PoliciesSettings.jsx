import { useState, useEffect } from 'react';
import { Edit2, Plus, Percent, FileText, Trash2, Search, XCircle } from 'lucide-react';
import Drawer from './Drawer';
import AddPolicyForm from './AddPolicyForm';
import ToggleSwitch from './ToggleSwitch';
import { policiesApi } from '../../services/adminApi';

function PoliciesSettings() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Drawer State
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await policiesApi.getAll();
            setPolicies(data);
        } catch (err) {
            console.error('Error loading policies:', err);
            setError('Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setEditingPolicy(null);
        setShowDrawer(true);
    };

    const handleEditClick = (policy) => {
        setEditingPolicy(policy);
        setShowDrawer(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this policy?')) {
            try {
                await policiesApi.delete(id);
                setPolicies(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error('Error deleting policy:', err);
                setError('Failed to delete policy');
            }
        }
    };

    const handleToggleActive = async (policy, newVal) => {
        try {
            // Optimistic update
            setPolicies(prev => prev.map(p =>
                p.id === policy.id ? { ...p, is_active: newVal } : p
            ));
            await policiesApi.update(policy.id, { is_active: newVal });
        } catch (err) {
            console.error('Error updating status:', err);
            // Revert on error
            setPolicies(prev => prev.map(p =>
                p.id === policy.id ? { ...p, is_active: !newVal } : p
            ));
            setError('Failed to update status');
        }
    };

    const handleSaveSuccess = async () => {
        await loadData();
        setShowDrawer(false);
        setEditingPolicy(null);
    };

    const filteredPolicies = policies.filter(policy =>
        policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.content && policy.content.toLowerCase().includes(searchTerm.toLowerCase()))
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
                            placeholder="Search policies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm text-slate-900"
                        />
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">New Policy</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                    <XCircle className="h-5 w-5" />{error}
                </div>
            )}

            {/* Grid Content */}
            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading policies...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPolicies.map(policy => (
                        <div
                            key={policy.id}
                            className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 flex flex-col relative overflow-hidden"
                        >
                            {/* Decorative Background Icon */}
                            <div className={`absolute -right-6 -bottom-6 opacity-5 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6
                                ${policy.type === 'cancellation' ? 'text-red-900' : 'text-blue-900'}
                            `}>
                                {policy.type === 'cancellation' ? <Percent className="h-40 w-40" /> : <FileText className="h-40 w-40" />}
                            </div>

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm border
                                    ${policy.type === 'cancellation'
                                        ? 'bg-red-50 text-red-600 border-red-100'
                                        : 'bg-blue-50 text-blue-600 border-blue-100'}
                                `}>
                                    {policy.type === 'cancellation' ? <Percent className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                                </div>
                                <ToggleSwitch
                                    checked={policy.is_active}
                                    onChange={(val) => handleToggleActive(policy, val)}
                                />
                            </div>

                            <div className="flex-1 relative z-10">
                                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{policy.name}</h3>
                                <p className="text-xs font-bold uppercase tracking-wider mb-4 opacity-60">
                                    {policy.type === 'cancellation' ? 'Cancellation Policy' : 'Terms & Conditions'}
                                </p>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 min-h-[100px] flex flex-col justify-center">
                                    {policy.type === 'cancellation' ? (
                                        <div className="text-center">
                                            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{policy.value}%</span>
                                            <p className="text-sm font-medium text-slate-500 mt-1">Fee Amount</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                                            {policy.content}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions - Always Visible */}
                            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 relative z-10">
                                <button
                                    onClick={() => handleEditClick(policy)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(policy.id)}
                                    className="flex items-center justify-center p-2.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Card (Empty State) */}
                    {filteredPolicies.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-4">
                                <FileText className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No policies found</h3>
                            <p className="text-slate-500 mt-1 mb-6">Create a new policy to get started</p>
                            <button
                                onClick={handleAddClick}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <Plus className="h-4 w-4" />
                                Create Policy
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Drawer */}
            <Drawer
                title={editingPolicy ? 'Edit Policy' : 'New Policy'}
                isOpen={showDrawer}
                onClose={() => setShowDrawer(false)}
            >
                <AddPolicyForm
                    initialData={editingPolicy}
                    onCancel={() => setShowDrawer(false)}
                    onSave={handleSaveSuccess}
                />
            </Drawer>
        </div>
    );
}

export default PoliciesSettings;
