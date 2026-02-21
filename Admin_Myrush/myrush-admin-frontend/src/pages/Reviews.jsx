import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { reviewsApi } from '../services/adminApi';
import { Star, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

function Reviews() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        } else {
            loadReviews();
        }
    }, [navigate]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const data = await reviewsApi.getAll();
            // Sort by created_at desc (newest first)
            const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setReviews(sorted);
        } catch (err) {
            setError(err.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (review) => {
        try {
            const newStatus = !review.is_active;
            await reviewsApi.updateStatus(review.id, newStatus);
            // Optimistic update
            setReviews(prev => prev.map(r =>
                r.id === review.id ? { ...r, is_active: newStatus } : r
            ));
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Ratings & Reviews</h1>
                <p className="mt-1 text-slate-500">Manage user feedback and review visibility.</p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold w-[22%]">Customer</th>
                                <th className="px-6 py-4 font-bold w-[18%]">Booking Detail</th>
                                <th className="px-6 py-4 font-bold w-[14%]">Rating</th>
                                <th className="px-6 py-4 font-bold w-[26%]">Comment</th>
                                <th className="px-6 py-4 font-bold w-[10%]">Date</th>
                                <th className="px-6 py-4 font-bold w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            {review.user ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                                        {review.user.first_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 leading-tight">
                                                            {review.user.full_name ||
                                                                (review.user.first_name ? `${review.user.first_name} ${review.user.last_name || ''}` : null) ||
                                                                review.user.phone_number}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium">{review.user.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-mono text-xs text-slate-400 p-2 bg-slate-50 rounded italic">Unknown User ({review.user_id.substring(0, 8)})</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900">
                                                {review.court ? review.court.name : 'Court'}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                {review.court?.branch?.name || 'Main Branch'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="bg-slate-50 px-2 py-1.5 rounded-lg inline-block border border-slate-100">
                                                {renderStars(review.rating)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="line-clamp-3 text-slate-600 italic font-medium leading-relaxed">
                                                "{review.review_text}"
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-slate-900 font-bold whitespace-nowrap">
                                                {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Submitted</div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${review.is_active
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                    {review.is_active ? 'Visible' : 'Hidden'}
                                                </span>
                                                <button
                                                    onClick={() => toggleStatus(review)}
                                                    className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-all shadow-sm border ${review.is_active
                                                        ? 'bg-white text-slate-400 border-slate-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 active:scale-95'
                                                        }`}
                                                    title={review.is_active ? "Hide Review" : "Show Review"}
                                                >
                                                    {review.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 italic font-medium bg-slate-50/30">
                                        No reviews found yet. User feedback will appear here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                            {/* Header: User & Status */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                        {review.user?.first_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {review.user?.full_name || review.user?.first_name || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${review.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {review.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Content */}
                            <div>
                                <div className="flex mb-2">{renderStars(review.rating)}</div>
                                <p className="text-sm text-slate-600 italic">"{review.review_text}"</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    For: <span className="font-medium text-slate-600">{review.court?.name}</span>
                                    {review.court?.branch?.name && ` (${review.court.branch.name})`}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-slate-100 pt-3 flex justify-end">
                                <button
                                    onClick={() => toggleStatus(review)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${review.is_active
                                        ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                        }`}
                                >
                                    {review.is_active ? (
                                        <>
                                            <EyeOff className="h-4 w-4" /> Hide Review
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4" /> Show Review
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                    {reviews.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                            No reviews found yet.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default Reviews;
