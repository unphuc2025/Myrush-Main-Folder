import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cmsApi } from '../services/cmsApi';
import type { CMSPage } from '../services/cmsApi';
import { FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import { marked } from 'marked';

export const CmsPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<CMSPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPage = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                setError(null);
                const data = await cmsApi.getBySlug(slug);
                setPage(data);
                // Update document title for SEO
                document.title = `${data.title} - MyRush`;
            } catch (err: any) {
                console.error('Error fetching CMS page:', err);
                if (err.response?.status === 404) {
                    setError('This page could not be found or has been removed.');
                } else {
                    setError('Failed to load page content. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPage();

        // Cleanup title
        return () => { document.title = 'MyRush - Play Sports, the Pro Way'; };
    }, [slug]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <FaExclamationCircle className="h-16 w-16 text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
                <p className="text-slate-500 mb-6 max-w-md">{error || "The page you are looking for doesn't exist."}</p>
                <Link to="/" className="px-6 py-2.5 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors">
                    Return to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-16">
            <div className="max-w-4xl mx-auto px-4 md:px-6">

                {/* Back button */}
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium mb-8 transition-colors">
                    <FaArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-8 border-b border-slate-200 pb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{page.title}</h1>
                    <p className="text-sm text-slate-500">Last updated: {new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>

                {/* Rich Text / Markdown Content */}
                <div
                    className="prose prose-lg prose-slate max-w-none bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100
                    prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl
                    prose-p:mb-6 prose-p:leading-relaxed prose-p:text-slate-600
                    prose-a:text-green-600 hover:prose-a:text-green-700 prose-a:font-semibold prose-a:no-underline
                    prose-ul:list-disc prose-ol:list-decimal prose-li:my-2
                    prose-strong:text-slate-900 prose-strong:font-bold
                    marker:text-green-500"
                    dangerouslySetInnerHTML={{
                        // Automatically parse markdown (like ## Headings, [Link](url)) or passthrough raw HTML correctly
                        __html: marked.parse(page.content, { async: false, breaks: true, gfm: true }) as string
                    }}
                />

            </div>
        </div>
    );
};
