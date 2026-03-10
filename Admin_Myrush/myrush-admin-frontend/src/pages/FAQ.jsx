import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { faqsApi } from '../services/adminApi';
import { Search, Plus, Trash2, Edit2, Eye, XCircle } from 'lucide-react';

import AddFAQForm from '../components/settings/AddFAQForm';

const FAQ = () => {
    const navigate = useNavigate();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Add/Edit Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [viewingFaq, setViewingFaq] = useState(null);
    const [selectedFaqs, setSelectedFaqs] = useState([]);

    // Permission check
    const permissions = (() => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
            if (adminInfo.role === 'super_admin') return {
                add: true, edit: true, delete: true, view: true
            };
            return adminInfo.permissions?.['FAQ'] || {};
        } catch { return {}; }
    })();

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) navigate('/login');
        if (permissions.view) loadFaqs();
    }, [navigate, page, searchTerm]);

    const loadFaqs = async () => {
        try {
            setLoading(true);
            const params = {
                skip: (page - 1) * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE,
                search: searchTerm,
            };
            const response = await faqsApi.getAll(params);
            setFaqs(response.items || []);
            setTotalPages(response.pages || 1);
            setTotalItems(response.total || 0);
        } catch (err) {
            console.error('Error loading FAQs:', err);
            const status = err.response?.status;
            if (status === 403 || err.message?.toLowerCase().includes('permission') || err.message?.toLowerCase().includes('forbidden')) {
                setError('You do not have access to view FAQs.');
            } else {
                setError('Failed to load FAQs. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!permissions.delete) {
            setError('You do not have permission to delete FAQs.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this FAQ?')) {
            try {
                await faqsApi.delete(id);
                setSelectedFaqs(prev => prev.filter(fid => fid !== id));
                loadFaqs();
            } catch (err) {
                console.error('Error deleting FAQ:', err);
                const msg = err.message || '';
                if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
                    setError('You do not have access to delete FAQs.');
                } else {
                    setError(err?.response?.data?.detail || 'Unable to delete this FAQ. It may be in use or you may not have permission.');
                }
            }
        }
    };

    const handleDeleteSelected = async () => {
        if (!permissions.delete) {
            setError('You do not have permission to delete FAQs.');
            return;
        }
        if (selectedFaqs.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedFaqs.length} selected FAQs?`)) {
            try {
                setLoading(true);
                // The API might not have a bulk delete, so we map over deletes or check if it exists
                // Assuming we loop for now as per most common pattern in this codebase unless confirmed otherwise
                await Promise.all(selectedFaqs.map(id => faqsApi.delete(id)));
                setSelectedFaqs([]);
                loadFaqs();
            } catch (err) {
                console.error('Error deleting selected FAQs:', err);
                setError('Failed to delete some selected FAQs.');
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleSelectAll = () => {
        if (selectedFaqs.length === faqs.length) {
            setSelectedFaqs([]);
        } else {
            setSelectedFaqs(faqs.map(f => f.id));
        }
    };

    const toggleSelectFaq = (id) => {
        setSelectedFaqs(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
    };

    const handleToggleStatus = async (faq) => {
        if (!permissions.edit) {
            setError('You do not have permission to modify FAQ status.');
            return;
        }
        // Optimistically update local state (no loading spinner)
        const newStatus = !faq.is_active;
        setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: newStatus } : f));
        try {
            await faqsApi.update(faq.id, { is_active: newStatus });
        } catch (err) {
            // Revert on failure
            setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: faq.is_active } : f));
            console.error('Error toggling status:', err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
                setError('You do not have access to toggle FAQ status.');
            } else {
                setError('Failed to update FAQ status. Please try again.');
            }
        }
    };

    const handleView = (faq) => {
        setViewingFaq(faq);
        setEditingFaq(null);
        setIsFormOpen(true);
    };

    if (!permissions.view && !loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 max-w-sm">You don't have permission to view FAQs. Please contact your administrator.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout onLogout={() => { localStorage.removeItem('admin_token'); navigate('/login'); }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">FAQ Management</h1>
                <p className="text-sm text-slate-500">Manage frequently asked questions</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="text-sm text-slate-500">
                    Showing {faqs.length} of {totalItems} records
                </div>
                <div className="flex flex-wrap w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search FAQs..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
                        />
                    </div>
                    {permissions.add && (
                        <button
                            onClick={() => { setEditingFaq(null); setViewingFaq(null); setIsFormOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-semibold">Add FAQ</span>
                        </button>
                    )}
                    {permissions.delete && selectedFaqs.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200 animate-in fade-in zoom-in duration-200"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-sm font-semibold">Delete Selected ({selectedFaqs.length})</span>
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                    <XCircle className="h-5 w-5" />{error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading FAQs...</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="p-4 w-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                                                checked={faqs.length > 0 && selectedFaqs.length === faqs.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sr no.</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Question</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Answer</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Active</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {faqs.map((faq, index) => (
                                        <tr key={faq.id} className={`hover:bg-slate-50/80 transition-colors ${selectedFaqs.includes(faq.id) ? 'bg-green-50/50' : ''}`}>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                                                    checked={selectedFaqs.includes(faq.id)}
                                                    onChange={() => toggleSelectFaq(faq.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{faq.question}</td>
                                            <td className="px-6 py-4 text-sm text-slate-700 truncate max-w-xs" title={faq.answer}>{faq.answer}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(faq)}
                                                    disabled={!permissions.edit}
                                                    className={`w-14 h-7 flex items-center rounded-full transition-colors duration-200 ease-in-out ${faq.is_active ? 'bg-green-500' : 'bg-red-400'} ${!permissions.edit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${faq.is_active ? 'translate-x-8' : 'translate-x-1'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleView(faq)} className="p-1.5 text-purple-600 bg-purple-50 rounded hover:bg-purple-100 cursor-pointer"><Eye className="h-4 w-4" /></button>
                                                    {permissions.edit && (
                                                        <button
                                                            onClick={() => { setEditingFaq(faq); setViewingFaq(null); setIsFormOpen(true); }}
                                                            className="p-1.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {permissions.delete && (
                                                        <button onClick={() => handleDelete(faq.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3 p-4">
                            {faqs.map((faq, index) => (
                                <div key={faq.id} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-colors ${selectedFaqs.includes(faq.id) ? 'border-green-500 bg-green-50/30' : ''}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex gap-3 items-start">
                                            <input
                                                type="checkbox"
                                                className="mt-1 rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                                                checked={selectedFaqs.includes(faq.id)}
                                                onChange={() => toggleSelectFaq(faq.id)}
                                            />
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-slate-400">#{(page - 1) * ITEMS_PER_PAGE + index + 1}</span>
                                                <h4 className="font-bold text-slate-900 line-clamp-2">{faq.question}</h4>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleStatus(faq)}
                                            disabled={!permissions.edit}
                                            className={`w-12 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${faq.is_active ? 'bg-green-500' : 'bg-red-400'} ${!permissions.edit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${faq.is_active ? 'translate-x-6.5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded-lg">{faq.answer}</p>

                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-1">
                                        <button onClick={() => handleView(faq)} className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors">
                                            <Eye className="h-4 w-4" />
                                            <span className="text-sm font-medium">View</span>
                                        </button>
                                        {permissions.edit && (
                                            <button
                                                onClick={() => { setEditingFaq(faq); setViewingFaq(null); setIsFormOpen(true); }}
                                                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                                <span className="text-sm font-medium">Edit</span>
                                            </button>
                                        )}
                                        {permissions.delete && (
                                            <button onClick={() => handleDelete(faq.id)} className="min-h-[44px] flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {faqs.length === 0 && (
                            <div className="p-12 text-center text-slate-500">No FAQs found</div>
                        )}
                    </>
                )}
            </div>

            <AddFAQForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setViewingFaq(null); }}
                onFaqAdded={loadFaqs}
                editingFaq={editingFaq}
                viewOnly={!!viewingFaq}
                viewingFaq={viewingFaq}
            />
        </Layout>
    );
};

export default FAQ;
