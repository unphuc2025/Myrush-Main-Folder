import { useState, useEffect } from 'react';
import { Upload, X, Gamepad2, Type, AlignLeft, Hash, Check } from 'lucide-react';
import { gameTypesApi } from '../../services/adminApi';

function AddGameTypeForm({ onCancel, onSave, initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        shortCode: '',
        description: '',
        icon: null,
        existingIcon: null,
        isActive: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                shortCode: initialData.short_code,
                description: initialData.description || '',
                icon: null,
                existingIcon: initialData.icon_url,
                isActive: initialData.is_active
            });
        }
    }, [initialData]);

    const handleIconUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                icon: {
                    file,
                    url: URL.createObjectURL(file)
                }
            }));
        }
        e.target.value = '';
    };

    const removeIcon = () => {
        setFormData(prev => ({ ...prev, icon: null }));
    };

    const removeExistingIcon = () => {
        setFormData(prev => ({ ...prev, existingIcon: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('short_code', formData.shortCode);
            submitData.append('description', formData.description);
            submitData.append('is_active', formData.isActive);

            // Handle icon removal
            if (!formData.icon && !formData.existingIcon) {
                submitData.append('is_icon_removed', 'true');
            }

            if (formData.icon?.file) {
                submitData.append('icon', formData.icon.file);
            }

            let result;
            if (initialData) {
                result = await gameTypesApi.update(initialData.id, submitData);
            } else {
                result = await gameTypesApi.create(submitData);
            }

            onSave(result);
        } catch (err) {
            console.error('Error saving game type:', err);
            setError(err.message || 'Failed to save game type');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-1 py-2 space-y-8">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm font-medium">
                        <X className="h-5 w-5" />{error}
                    </div>
                )}

                {/* Icon Upload Section */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                        Game Icon
                    </label>
                    <div className="flex flex-col items-center">
                        {formData.icon ? (
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50 p-4">
                                    <img src={formData.icon.url} alt="Preview" className="w-full h-full object-contain" />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeIcon}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : formData.existingIcon ? (
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50 p-4">
                                    <img src={formData.existingIcon} alt="Existing" className="w-full h-full object-contain" />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeExistingIcon}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all group">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                                    <Upload className="h-5 w-5 text-slate-400 group-hover:text-green-600" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 group-hover:text-green-700">Upload Icon</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                            </label>
                        )}
                        <p className="text-[11px] text-slate-400 mt-2 font-medium">SVG or PNG recommended (512x512)</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Game Name</label>
                        <div className="relative group">
                            <Gamepad2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300 text-slate-900"
                                placeholder="e.g. Football"
                                required
                            />
                        </div>
                    </div>

                    {/* Short Code */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Short Code</label>
                        <div className="relative group">
                            <Hash className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <input
                                type="text"
                                value={formData.shortCode}
                                onChange={(e) => setFormData({ ...formData, shortCode: e.target.value.toUpperCase() })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg uppercase placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                                placeholder="e.g. SOC"
                                maxLength={3}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                        <div className="relative group">
                            <AlignLeft className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all text-sm min-h-[100px] placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                                placeholder="Optional description..."
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                <Check className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Active Status</h4>
                                <p className="text-xs text-slate-500">Visible for venue creation and booking</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-green-600' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky/Fixed Footer Actions */}
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
                    {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : null}
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update Game Type' : 'Create Game Type')}
                </button>
            </div>
        </form>
    );
}

export default AddGameTypeForm;
