import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
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
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('short_code', formData.shortCode);
            submitData.append('description', formData.description);
            submitData.append('is_active', formData.isActive);

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
        <div className="bg-white rounded-lg">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <h2 className="text-xl font-semibold text-slate-800">{initialData ? 'Edit Game Type' : 'Add Game Type'}</h2>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* Icon Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Icon / Image
                    </label>
                    <div className="flex items-start gap-4">
                        {formData.icon ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                    src={formData.icon.url}
                                    alt="Game Type Icon"
                                    className="w-full h-full object-contain p-2"
                                />
                                <button
                                    type="button"
                                    onClick={removeIcon}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : formData.existingIcon ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                    src={formData.existingIcon}
                                    alt="Game Type Icon"
                                    className="w-full h-full object-contain p-2"
                                />
                                <button
                                    type="button"
                                    onClick={removeExistingIcon}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                                <Upload className="h-6 w-6 text-slate-400" />
                                <span className="text-xs text-slate-500 mt-1">Upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleIconUpload}
                                />
                            </label>
                        )}
                        <div className="text-sm text-slate-500 pt-2">
                            <p>Upload an icon or image for this game type.</p>
                            <p>Recommended size: 512x512px, PNG or SVG.</p>
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Game Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Football, Cricket"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Short Code *
                        </label>
                        <input
                            type="text"
                            value={formData.shortCode}
                            onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                            placeholder="e.g., FB, CR"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                            maxLength={3}
                        />
                        <p className="text-xs text-slate-500 mt-1">Maximum 3 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description of the game type"
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                            Active
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : (initialData ? 'Update Game Type' : 'Save Game Type')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddGameTypeForm;
