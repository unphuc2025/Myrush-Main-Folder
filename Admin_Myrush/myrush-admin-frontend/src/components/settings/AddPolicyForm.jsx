import { useState, useEffect } from 'react';
import { FileText, Percent, Check, X, Type, AlignLeft } from 'lucide-react';
import { policiesApi } from '../../services/adminApi';

function AddPolicyForm({ onCancel, onSave, initialData = null }) {
    const [formData, setFormData] = useState({
        type: 'cancellation', // 'cancellation' or 'terms'
        name: '',
        value: '',
        content: '',
        is_active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                type: initialData.type,
                name: initialData.name,
                value: initialData.value || '',
                content: initialData.content || '',
                is_active: initialData.is_active
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validation
            if (!formData.name.trim()) throw new Error("Policy Name is required");
            if (formData.type === 'cancellation' && !formData.value) throw new Error("Cancellation Fee is required");
            if (formData.type === 'terms' && !formData.content) throw new Error("Content is required");

            const payload = { ...formData };
            // Clean up payload based on type
            if (payload.type === 'cancellation') {
                payload.content = '';
            } else {
                payload.value = '';
            }

            let result;
            if (initialData) {
                result = await policiesApi.update(initialData.id, payload);
            } else {
                result = await policiesApi.create(payload);
            }

            onSave(result);
        } catch (err) {
            console.error('Error saving policy:', err);
            setError(err.message || 'Failed to save policy');
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

                {/* Policy Type Selection */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Policy Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'cancellation' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input
                                type="radio"
                                name="type"
                                value="cancellation"
                                checked={formData.type === 'cancellation'}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="absolute opacity-0 w-full h-full cursor-pointer"
                            />
                            <Percent className={`h-6 w-6 mb-2 ${formData.type === 'cancellation' ? 'text-red-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-bold ${formData.type === 'cancellation' ? 'text-red-700' : 'text-slate-600'}`}>Cancellation Fee</span>
                        </label>

                        <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'terms' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input
                                type="radio"
                                name="type"
                                value="terms"
                                checked={formData.type === 'terms'}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="absolute opacity-0 w-full h-full cursor-pointer"
                            />
                            <FileText className={`h-6 w-6 mb-2 ${formData.type === 'terms' ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-bold ${formData.type === 'terms' ? 'text-blue-700' : 'text-slate-600'}`}>Terms & Conditions</span>
                        </label>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-4" />

                <div className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Policy Name</label>
                        <div className="relative group">
                            <Type className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                                placeholder={formData.type === 'cancellation' ? "e.g. Standard Cancellation" : "e.g. Booking Rules"}
                                required
                            />
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    {formData.type === 'cancellation' ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Fee Percentage</label>
                            <div className="relative group">
                                <Percent className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                                    placeholder="20"
                                    required
                                />
                                <div className="absolute right-4 top-3.5 text-slate-400 font-bold">%</div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 ml-1">Percentage of total amount withheld upon cancellation.</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Policy Content</label>
                            <div className="relative group">
                                <AlignLeft className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    rows={8}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium text-sm leading-relaxed placeholder:text-slate-300 shadow-sm hover:border-slate-300 resize-none"
                                    placeholder="Enter the full terms and conditions text here..."
                                    required
                                />
                            </div>
                        </div>
                    )}
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
                    className={`flex-[2] px-6 py-3.5 text-white font-bold rounded-xl transition-colors disabled:opacity-70 shadow-lg flex items-center justify-center gap-2
                        ${formData.type === 'cancellation'
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-900/10'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/10'}`}
                >
                    {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Check className="h-5 w-5" />}
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update Policy' : 'Create Policy')}
                </button>
            </div>
        </form>
    );
}

export default AddPolicyForm;
