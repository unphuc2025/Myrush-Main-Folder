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
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Review For</th>
                                <th className="px-6 py-4 font-semibold">Rating</th>
                                <th className="px-6 py-4 font-semibold w-1/3">Comment</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {/* Assuming backend expands user, otherwise show ID */}
                                            {review.user ? (
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {review.user.full_name ||
                                                            (review.user.first_name ? `${review.user.first_name} ${review.user.last_name || ''}` : null) ||
                                                            review.user.phone_number}
                                                    </div>
                                                    <div className="text-xs text-slate-400">{review.user.email}</div>
                                                </div>
                                            ) : (
                                                <div className="font-mono text-xs text-slate-400">{review.user_id.substring(0, 8)}...</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Assuming backend expands court/branch */}
                                            <div className="font-medium text-slate-900">
                                                {review.court ? review.court.name : 'Court'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {review.court?.branch?.name || ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {renderStars(review.rating)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="line-clamp-2 text-slate-600 italic">"{review.review_text}"</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${review.is_active
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {review.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleStatus(review)}
                                                className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${review.is_active
                                                    ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                                title={review.is_active ? "Hide Review" : "Show Review"}
                                            >
                                                {review.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        No reviews found yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

export default Reviews;
