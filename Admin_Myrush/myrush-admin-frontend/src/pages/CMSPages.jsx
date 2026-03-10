import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { cmsApi } from '../services/adminApi';
import { Search, Plus, Trash2, Edit2, CheckCircle, ArrowLeft } from 'lucide-react';

const CMSPages = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        is_active: true
    });

    // Permission check
    const permissions = (() => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
            if (adminInfo.role === 'super_admin') return {
                add: true, edit: true, delete: true, view: true
            };
            return adminInfo.permissions?.['CMS Pages'] || {};
        } catch { return {}; }
    })();

    // Pagination
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (permissions.view) loadPages();
    }, [navigate, page, searchTerm]);

    const loadPages = async () => {
        try {
            setLoading(true);
            const params = {
                skip: (page - 1) * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE,
                search: searchTerm,
            };
            const response = await cmsApi.getAll(params);
            setPages(response.items || []);
            setTotalItems(response.total || 0);
        } catch (err) {
            console.error('Error loading pages:', err);
            const status = err.response?.status;
            if (status === 403 || err.message?.toLowerCase().includes('permission') || err.message?.toLowerCase().includes('forbidden')) {
                setError('You do not have access to view CMS pages.');
            } else {
                setError('Failed to load pages. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (page) => {
        if (!permissions.edit) {
            setError('You do not have permission to edit CMS pages.');
            return;
        }
        setEditingPage(page);
        setFormData({
            title: page.title,
            slug: page.slug,
            content: page.content,
            is_active: page.is_active
        });
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        if (!permissions.add) {
            setError('You do not have permission to create CMS pages.');
            return;
        }
        setEditingPage(null);
        setFormData({
            title: '',
            slug: '',
            content: '',
            is_active: true
        });
        setIsEditorOpen(true);
    };

    const handleSave = async () => {
        try {
            setError(null);
            if (editingPage) {
                await cmsApi.update(editingPage.id, formData);
            } else {
                await cmsApi.create(formData);
            }
            setIsEditorOpen(false);
            loadPages();
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
                setError('You do not have access to save CMS pages.');
            } else {
                setError(err?.response?.data?.detail || err.message || 'Failed to save page. Please try again.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!permissions.delete) {
            setError('You do not have permission to delete CMS pages.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
            try {
                await cmsApi.delete(id);
                loadPages();
            } catch (err) {
                const msg = err.message || '';
                if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
                    setError('You do not have access to delete CMS pages.');
                } else {
                    setError('Failed to delete page: ' + (err?.response?.data?.detail || err.message));
                }
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        if (!permissions.edit) {
            setError('You do not have permission to modify page status.');
            return;
        }
        try {
            await cmsApi.update(id, { is_active: !currentStatus });
            loadPages();
        } catch (err) {
            console.error('Error toggling status:', err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
                setError('You do not have access to toggle page status.');
            } else {
                setError('Failed to update page status.');
            }
        }
    };

    // Auto-generate slug from title
    const handleTitleChange = (e) => {
        const title = e.target.value;
        if (!editingPage) {
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, title, slug }));
        } else {
            setFormData(prev => ({ ...prev, title }));
        }
    };

    if (isEditorOpen) {
        return (
            <Layout>
                <div className="flex flex-col h-[calc(100vh-100px)]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsEditorOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-slate-500" />
                            </button>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {editingPage ? 'Edit Page' : 'Create New Page'}
                            </h1>
                        </div>
                        {error && (
                            <div className="flex-1 mx-4 p-2 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsEditorOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Save Page
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-200 grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Page Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                                    placeholder="e.g. Privacy Policy"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Page Slug (URL)
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-mono text-sm text-slate-900"
                                    placeholder="e.g. privacy-policy"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col p-6">
                            <textarea
                                className="w-full h-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-mono text-sm text-slate-900"
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Enter page content here (HTML supported)..."
                            />
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!permissions.view && !loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                        <Plus className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-gray-500 max-w-sm">You don't have permission to view CMS pages. Please contact your administrator.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">CMS Pages</h1>
                <p className="text-sm text-slate-500">Manage dynamic content pages like Privacy Policy, Terms, etc.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center justify-between border border-red-100">
                    <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 rotate-45" /> {error}
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="text-sm text-slate-500">
                    Showing {pages.length} of {totalItems} records
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Pages..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm text-slate-900"
                        />
                    </div>
                    {permissions.add && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-semibold">Create Page</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading Content...</div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Title</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Slug / URL Key</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Last Updated</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Active</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pages.map((page) => (
                                        <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{page.title}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">
                                                    {page.slug}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(page.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(page.id, page.is_active)}
                                                    disabled={!permissions.edit}
                                                    className={`w-14 h-7 flex items-center rounded-full transition-colors duration-200 ease-in-out ${page.is_active ? 'bg-green-500' : 'bg-slate-300'} ${!permissions.edit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${page.is_active ? 'translate-x-8' : 'translate-x-1'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {permissions.edit && (
                                                        <button
                                                            onClick={() => handleEdit(page)}
                                                            className="p-1.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100"
                                                            title="Edit Content"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {permissions.delete && (
                                                        <button
                                                            onClick={() => handleDelete(page.id)}
                                                            className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"
                                                            title="Delete Page"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
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
                            {pages.map((page) => (
                                <div key={page.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{page.title}</h4>
                                            <code className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono mt-1 inline-block">
                                                /{page.slug}
                                            </code>
                                        </div>
                                        <button
                                            onClick={() => handleToggleStatus(page.id, page.is_active)}
                                            disabled={!permissions.edit}
                                            className={`w-12 h-6 flex items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${page.is_active ? 'bg-green-500' : 'bg-slate-300'} ${!permissions.edit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${page.is_active ? 'translate-x-6.5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                                        <span className="text-xs text-slate-500">
                                            Updated: {new Date(page.updated_at).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {permissions.edit && (
                                                <button
                                                    onClick={() => handleEdit(page)}
                                                    className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            {permissions.delete && (
                                                <button
                                                    onClick={() => handleDelete(page.id)}
                                                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pages.length === 0 && (
                            <div className="p-12 text-center text-slate-500">No Pages found</div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default CMSPages;
