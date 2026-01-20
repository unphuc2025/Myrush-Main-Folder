import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { settingsApi, IMAGE_BASE_URL } from '../services/adminApi';
import { Settings, Upload, Save, Info, Mail, Phone, MapPin, Copyright } from 'lucide-react';

const SiteSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [logoPreview, setLogoPreview] = useState(null);
    const [formData, setFormData] = useState({
        site_logo: null, // File object if new upload
        email: '',
        contact_number: '',
        address: '',
        copyright_text: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        loadSettings();
    }, [navigate]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.get();
            setFormData({
                email: data.email || '',
                contact_number: data.contact_number || '',
                address: data.address || '',
                copyright_text: data.copyright_text || '',
                site_logo: null // Reset file input
            });
            if (data.site_logo) {
                setLogoPreview(`${IMAGE_BASE_URL}${data.site_logo}`);
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                alert('Only PNG, JPG, and JPEG files are allowed.');
                return;
            }
            setFormData(prev => ({ ...prev, site_logo: file }));
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            data.append('email', formData.email);
            data.append('contact_number', formData.contact_number);
            data.append('address', formData.address);
            data.append('copyright_text', formData.copyright_text);
            if (formData.site_logo) {
                data.append('site_logo', formData.site_logo);
            }

            const response = await settingsApi.update(data);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });

            // Update preview if response has new logo path (though frontend preview is faster)
            if (response.site_logo) {
                setLogoPreview(`${IMAGE_BASE_URL}${response.site_logo}`);
            }
        } catch (err) {
            console.error('Error updating settings:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-blue-600" />
                    SITE SETTING
                </h1>
                <p className="text-sm text-slate-500">Manage global site configuration</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <Info className="h-5 w-5" />
                    {message.text}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading Configuration...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 md:p-8">
                        {/* Site Logo Section */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Site Logo <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col items-start gap-4">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Site Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Upload className="h-8 w-8 text-slate-400" />
                                        )}
                                    </div>
                                    <label className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-colors">
                                        <Edit2Icon className="h-3 w-3" /> {/* Assuming Edit2Icon exists or using standard edit icon */}
                                        <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <span className="text-xs text-slate-500">Allowed file types: png, jpg, jpeg.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="company@example.com"
                                    />
                                </div>
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Contact Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.contact_number}
                                        onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <textarea
                                    required
                                    rows="3"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                    placeholder="Enter full business address"
                                />
                            </div>
                        </div>

                        {/* Copyright */}
                        <div className="mb-10">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Copy Right <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Copyright className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.copyright_text}
                                    onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="&copy; {{YEAR}} RUSH Pitch Booking. All Rights Reserved"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Submit
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
};

// Simple Edit Icon component inline
const Edit2Icon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

export default SiteSettings;
