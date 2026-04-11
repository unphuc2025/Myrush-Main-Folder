import React, { useState, useEffect } from 'react';
import { Puzzle, CheckCircle, XCircle, Key, RefreshCw, AlertTriangle, ShieldCheck, Settings } from 'lucide-react';
import Layout from '../components/Layout';
import Drawer from '../components/settings/Drawer';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import { integrationsApi } from '../services/adminApi';

const Integrations = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [formData, setFormData] = useState({
        apiKey: '',
        apiSecret: '',
        webhookUrl: '',
        config: {}
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const [permissions, setPermissions] = useState(() => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
            if (adminInfo.role === 'super_admin') return { edit: true, view: true };
            return adminInfo.permissions?.['Settings'] || {};
        } catch { return {}; }
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const data = await integrationsApi.getPartners();
            setPartners(data || []);
        } catch (error) {
            console.error('Error fetching partners:', error);
            setMessage({ type: 'error', text: 'Failed to load partners.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditPartner = (partner) => {
        setSelectedPartner(partner);
        setFormData({
            apiKey: '', 
            apiSecret: '',
            webhookUrl: partner.webhook_url || '',
            config: partner.config || {}
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { ...formData };
            if (!payload.apiKey) delete payload.apiKey;
            if (!payload.apiSecret) delete payload.apiSecret;

            await integrationsApi.updatePartner(selectedPartner.id, payload);
            setMessage({ type: 'success', text: `${selectedPartner.name} updated successfully.` });
            setIsDrawerOpen(false);
            fetchPartners();
        } catch (error) {
            console.error('Error saving partner:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save partner.' });
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePartner = async (partner) => {
        try {
            const newState = !partner.is_active;
            await integrationsApi.togglePartner(partner.id, newState);
            setMessage({ type: 'success', text: `${partner.name} ${newState ? 'activated' : 'deactivated'}.` });
            fetchPartners();
        } catch (error) {
            console.error('Error toggling partner:', error);
            throw error; // Let ToggleSwitch handle the error state if needed
        }
    };

    const getPartnerIcon = (slug) => {
        return <Puzzle className="w-6 h-6 text-primary" />;
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-black uppercase">Partner Integrations</h1>
                <p className="text-sm text-body">
                    Connect MyRush with third-party platforms to synchronize inventory and bookings.
                </p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center justify-between shadow-sm border ${message.type === 'success' ? 'bg-green-50 text-success border-green-100' : 'bg-red-50 text-danger border-red-100'}`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="text-sm font-semibold">{message.text}</span>
                    </div>
                    <button onClick={() => setMessage({type:'', text:''})} className="text-xs font-bold opacity-50 hover:opacity-100">CLOSE</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && !partners.length ? (
                    <div className="col-span-full py-20 text-center text-body animate-pulse">Synchronizing partner network...</div>
                ) : (
                    partners.map(partner => (
                        <div key={partner.id} className="bg-white rounded-lg border border-stroke shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2.5 bg-gray rounded-lg">
                                        {getPartnerIcon(partner.slug)}
                                    </div>
                                    <ToggleSwitch 
                                        isChecked={partner.is_active} 
                                        onToggle={() => handleTogglePartner(partner)} 
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-black mb-1 uppercase tracking-tight">{partner.name}</h3>
                                <p className="text-xs text-body mb-6 h-10 overflow-hidden leading-relaxed">
                                    {partner.slug === 'district' ? 'Multi-vendor booking synchronization with District App.' : 
                                     partner.slug === 'playo' ? 'Integrated court selection and payment via Playo marketplace.' : 
                                     partner.slug === 'hudle' ? 'Community-driven inventory sync with Hudle platform.' : 
                                     'External marketplace integration.'}
                                </p>
                                
                                <div className="space-y-3 mb-6 border-t border-stroke pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-bodydark2 uppercase">Sync Status</span>
                                        {partner.is_active ? 
                                            <span className="text-[10px] font-black text-success uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span> : 
                                            <span className="text-[10px] font-black text-danger uppercase flex items-center gap-1"><XCircle className="w-3 h-3"/> Disabled</span>
                                        }
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-bodydark2 uppercase">Credentials</span>
                                        {partner.api_key_hash ? 
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">CONFIGURED</span> : 
                                            <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded">PENDING</span>
                                        }
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleEditPartner(partner)}
                                    className="w-full py-2.5 px-4 rounded-lg bg-gray text-black text-sm font-bold hover:bg-whiten transition-colors flex items-center justify-center gap-2 border border-stroke"
                                >
                                    <Settings className="w-4 h-4 text-primary" />
                                    MANAGE SETTINGS
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Drawer
                title={`Configure ${selectedPartner?.name}`}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            >
                <form onSubmit={handleSave} className="flex flex-col h-full">
                    <div className="space-y-6 flex-1">
                        <div className="p-4 bg-warning/5 border border-warning/10 rounded-xl flex gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-warning" />
                            <p className="text-xs text-warning/80 leading-relaxed font-medium">
                                <span className="font-black block mb-1">SECURITY NOTICE</span>
                                Modifying auth credentials will trigger an immediate re-sync. Ensure your Partner IDs and Keys match the provider's production environment.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-bodydark2 uppercase tracking-wider mb-2">API Key / Client ID</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-3 h-5 w-5 text-bodydark2" />
                                    <input 
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-stroke rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
                                        value={formData.apiKey}
                                        onChange={e => setFormData({...formData, apiKey: e.target.value})}
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-body">Leave blank to keep existing encrypted value.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-bodydark2 uppercase tracking-wider mb-2">Secret / Private Key</label>
                                <input 
                                    type="password"
                                    placeholder="Enter secret key..."
                                    className="w-full px-4 py-3 bg-white border border-stroke rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
                                    value={formData.apiSecret}
                                    onChange={e => setFormData({...formData, apiSecret: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-bodydark2 uppercase tracking-wider mb-2">Endpoint (Webhook) URL</label>
                                <input 
                                    type="url"
                                    placeholder="https://api.partner.com/webhook"
                                    className="w-full px-4 py-3 bg-white border border-stroke rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
                                    value={formData.webhookUrl}
                                    onChange={e => setFormData({...formData, webhookUrl: e.target.value})}
                                />
                                <p className="mt-2 text-[10px] text-body italic leading-relaxed">Incoming updates from partners will be routed via this URL override if specified.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 my-6 border-t border-stroke flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            className="flex-1 px-6 py-3 border border-stroke text-black font-bold rounded-xl hover:bg-gray transition-colors text-sm uppercase"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-sm uppercase"
                        >
                            {loading ? 'Saving...' : 'Apply Changes'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </Layout>
    );
};

export default Integrations;
