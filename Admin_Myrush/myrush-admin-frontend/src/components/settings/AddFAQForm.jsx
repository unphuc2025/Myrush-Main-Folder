import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { faqsApi } from '../../services/adminApi';

const AddFAQForm = ({ isOpen, onClose, onFaqAdded, editingFaq, viewOnly = false, viewingFaq = null }) => {
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (viewOnly && viewingFaq) {
            setFormData({
                question: viewingFaq.question || '',
                answer: viewingFaq.answer || '',
                is_active: viewingFaq.is_active ?? true
            });
        } else if (editingFaq) {
            setFormData({
                question: editingFaq.question || '',
                answer: editingFaq.answer || '',
                is_active: editingFaq.is_active ?? true
            });
        } else {
            setFormData({
                question: '',
                answer: '',
                is_active: true
            });
        }
        setError(null);
    }, [editingFaq, viewingFaq, viewOnly, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (editingFaq) {
                await faqsApi.update(editingFaq.id, formData);
            } else {
                await faqsApi.create(formData);
            }
            onFaqAdded(); // Refresh parent list
            onClose();
        } catch (err) {
            console.error('Error saving FAQ:', err);
            setError('Failed to save FAQ. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {viewOnly ? 'View FAQ' : editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Question <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.question}
                                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                                    disabled={viewOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 ${viewOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                    placeholder="e.g. How do I reset my password?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Answer <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.answer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                                    disabled={viewOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none text-slate-900 ${viewOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                    placeholder="Enter the answer here..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                    disabled={viewOnly}
                                    className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                                    Active
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {viewOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!viewOnly && (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.question || !formData.answer}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        {editingFaq ? 'Update FAQ' : 'Save FAQ'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddFAQForm;
