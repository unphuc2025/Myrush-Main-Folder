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

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) navigate('/login');
        loadFaqs();
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
            setError('Failed to load FAQs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this FAQ?')) {
            try {
                await faqsApi.delete(id);
                loadFaqs();
            } catch (err) {
                console.error('Error deleting FAQ:', err);
                alert('Failed to delete FAQ');
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await faqsApi.toggleStatus(id);
            loadFaqs();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

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
                <div className="flex w-full md:w-auto gap-3">
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
                    <button
                        onClick={() => { setEditingFaq(null); setIsFormOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">Add FAQ</span>
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm font-semibold">Delete Selected</span>
                    </button>
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
                                        <th className="p-4 w-4"><input type="checkbox" className="rounded border-slate-300" /></th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sr no.</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Question</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Answer</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Active</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {faqs.map((faq, index) => (
                                        <tr key={faq.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{faq.question}</td>
                                            <td className="px-6 py-4 text-sm text-slate-700 truncate max-w-xs" title={faq.answer}>{faq.answer}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(faq.id)}
                                                    className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out ${faq.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${faq.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-1.5 text-purple-600 bg-purple-50 rounded hover:bg-purple-100"><Eye className="h-4 w-4" /></button>
                                                    <button
                                                        onClick={() => { setEditingFaq(faq); setIsFormOpen(true); }}
                                                        className="p-1.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(faq.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
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
                                <div key={faq.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-slate-400">#{(page - 1) * ITEMS_PER_PAGE + index + 1}</span>
                                            <h4 className="font-bold text-slate-900 line-clamp-2">{faq.question}</h4>
                                        </div>
                                        <button
                                            onClick={() => handleToggleStatus(faq.id)}
                                            className={`w-9 h-5 flex items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${faq.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${faq.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded-lg">{faq.answer}</p>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                                        <button className="p-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"><Eye className="h-4 w-4" /></button>
                                        <button
                                            onClick={() => { setEditingFaq(faq); setIsFormOpen(true); }}
                                            className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(faq.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
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
                onClose={() => setIsFormOpen(false)}
                onFaqAdded={loadFaqs}
                editingFaq={editingFaq}
            />
        </Layout>
    );
};

export default FAQ;
