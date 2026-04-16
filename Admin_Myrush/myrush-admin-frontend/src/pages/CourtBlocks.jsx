import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Plus, Trash2, RefreshCw, AlertCircle, Info, Lock, CheckCircle, X, ChevronRight, MapPin, Search, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Drawer from '../components/settings/Drawer';
import { blocksApi, branchesApi, courtsApi, bookingsApi } from '../services/adminApi';

const CourtBlocks = () => {
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [branchCourts, setBranchCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState('timeline');
    const [bookings, setBookings] = useState([]);

    // Permission check
    const permissions = (() => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
            if (adminInfo.role === 'super_admin') return {
                add: true, edit: true, delete: true, view: true, access: true
            };
            return adminInfo.permissions?.['Court Blocks'] || {};
        } catch { return {}; }
    })();

    const hasAccess = !!(permissions.access || permissions.view);
    const canManage = !!permissions.access;

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
        } else if (hasAccess) {
            fetchInitialData();
        } else {
            setLoading(false);
        }
    }, [navigate, hasAccess]);

    if (!hasAccess && !loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 max-w-sm">You do not have permission to manage court blocks. Please contact your administrator.</p>
                </div>
            </Layout>
        );
    }
    
    // Filters
    const [filterBranchId, setFilterBranchId] = useState('');
    const [filterCourtId, setFilterCourtId] = useState('');
    const [filterSliceId, setFilterSliceId] = useState('');
    const [filterSliceMask, setFilterSliceMask] = useState(0);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Form State
    const [formBranchId, setFormBranchId] = useState('');
    const [formData, setFormData] = useState({
        court_id: '',
        block_date: new Date().toISOString().split('T')[0],
        end_date: '',
        start_time: '10:00',
        end_time: '11:00',
        reason: 'Maintenance',
        slice_mask: 0,
        blocked_capacity: 0,
        sync_partners: ['district', 'playo', 'hudle']
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchBlocks();
    }, [filterBranchId, filterCourtId, filterDate, courts]);

    const fetchInitialData = async () => {
        try {
            const [branchesData, courtsData] = await Promise.all([
                branchesApi.getAll(),
                courtsApi.getAll({ limit: 1000 })
            ]);
            setBranches(branchesData?.items || branchesData || []);
            // Keep master list of all courts for name resolution, even inactive ones
            const allCourts = courtsData?.items || courtsData || [];
            setCourts(allCourts);
        } catch (error) {
            console.error('Error fetching meta data:', error);
        }
    };

    const handleFilterBranchChange = async (id) => {
        setFilterBranchId(id);
        setFilterCourtId('');
        setFilterSliceId('');
        setFilterSliceMask(0);
        setBranchCourts([]);

        if (id) {
            try {
                const courtsData = await courtsApi.getAll({ branch_id: id, limit: 1000 });
                const bCourts = courtsData?.items || courtsData || [];
                setBranchCourts(bCourts);
            } catch (error) {
                console.error('Error fetching branch courts:', error);
            }
        }
    };

    const fetchBlocks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterBranchId) params.branch_id = filterBranchId;
            if (filterCourtId) params.court_id = filterCourtId;
            if (filterDate) {
                params.start_date = filterDate;
                params.end_date = filterDate;
            }
            
            // Parallel fetch for blocks and bookings
            const [blocksData, bookingsData] = await Promise.all([
                blocksApi.getBlocks(params),
                bookingsApi.getAll(filterBranchId)
            ]);

            // Enrich blocks and bookings with facility name fallbacks if they are from webapp/api
            const courtMap = (branchCourts.length ? branchCourts : courts).reduce((acc, c) => {
                acc[String(c.id).toLowerCase()] = c;
                return acc;
            }, {});

            const enrichItem = (item) => {
                const cId = String(item.court_id).toLowerCase().trim();
                const courtInfo = courtMap[cId];
                return {
                    ...item,
                    court_name: item.court_name || courtInfo?.name || 'Unnamed Facility',
                    branch_name: item.branch_name || courtInfo?.branch?.name || 'Unknown Venue'
                };
            };

            setBlocks((blocksData || []).map(enrichItem));
            
            // Filter bookings for the selected date
            const filteredBookings = (bookingsData?.items || bookingsData || []).filter(b => {
                const bDate = b.booking_date?.toString().split('T')[0];
                const blockCourtIdStr = String(b.court_id).toLowerCase().trim();
                const filterCourtIdStr = filterCourtId ? String(filterCourtId).toLowerCase().trim() : null;

                const siblingToGroup = {};
                if (courts && courts.length > 0) {
                    courts.forEach(c => { 
                        if(c.shared_group_id) siblingToGroup[String(c.id).toLowerCase()] = String(c.shared_group_id).toLowerCase(); 
                    });
                }

                const targetGroupId = filterCourtIdStr ? siblingToGroup[filterCourtIdStr] : null;

                return bDate === filterDate && 
                    b.status !== 'cancelled' &&
                    (!filterCourtIdStr || blockCourtIdStr === filterCourtIdStr || (targetGroupId && siblingToGroup[blockCourtIdStr] === targetGroupId));
            }).map(enrichItem);
            
            setBookings(filteredBookings);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBlock = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const submissionData = { ...formData };
            if (!submissionData.end_date) delete submissionData.end_date;
            if (selectedFormCourt?.logic_type !== 'capacity') {
                delete submissionData.blocked_capacity;
            }

            await blocksApi.createBlock(submissionData);
            setMessage({ type: 'success', text: 'Court blocked successfully.' });
            setIsDrawerOpen(false);
            fetchBlocks();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to create block.' });
            setIsDrawerOpen(false); // Close drawer on conflict/error as requested
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBlock = async (id) => {
        if (!window.confirm('Are you sure you want to lift this block?')) return;
        try {
            setLoading(true);
            await blocksApi.deleteBlock(id);
            setMessage({ type: 'success', text: 'Block lifted successfully.' });
            fetchBlocks();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to lift block.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredFormCourts = courts.filter(c => c.branch_id === formBranchId);
    const selectedFormCourt = courts.find(c => c.id === formData.court_id);

    return (
        <Layout>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-black uppercase">Court Blocking</h1>
                    <p className="text-sm text-body">Manage manual availability gaps for maintenance or tournaments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray p-1 rounded-xl border border-stroke mr-4">
                        <button 
                            onClick={() => setViewMode('timeline')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-white text-primary shadow-sm' : 'text-bodydark2 hover:text-body'}`}
                        >
                            TIMELINE
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-bodydark2 hover:text-body'}`}
                        >
                            LIST VIEW
                        </button>
                    </div>
                    <button 
                        onClick={() => {
                            setFormBranchId('');
                            setFormData({...formData, court_id: '', block_date: new Date().toISOString().split('T')[0]});
                            setIsDrawerOpen(true);
                        }}
                        className="flex items-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all uppercase text-sm"
                    >
                        <Plus className="w-5 h-5" />
                        New Manual Block
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-xl border border-stroke mb-8 flex flex-wrap gap-4 items-end shadow-sm">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-bodydark2 uppercase mb-2 tracking-widest">Select Venue</label>
                    <select 
                        className="w-full bg-gray border border-stroke rounded-lg px-4 py-2.5 outline-none focus:border-primary font-bold text-sm"
                        value={filterBranchId}
                        onChange={(e) => handleFilterBranchChange(e.target.value)}
                    >
                        <option value="" disabled>SELECT A VENUE...</option>
                        <option value="">ALL VENUES</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-bodydark2 uppercase mb-2 tracking-widest">Select Court / Unit</label>
                    <select 
                        className={`w-full bg-gray border border-stroke rounded-lg px-4 py-2.5 outline-none focus:border-primary font-bold text-sm ${!filterBranchId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={filterSliceId ? `${filterCourtId}:${filterSliceId}` : filterCourtId}
                        disabled={!filterBranchId}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes(':')) {
                                const [cid, sid] = val.split(':');
                                setFilterCourtId(cid);
                                setFilterSliceId(sid);
                                const court = branchCourts.find(c => c.id === cid);
                                const slice = court?.sport_slices?.find(s => s.id === sid);
                                setFilterSliceMask(slice?.mask || 0);
                            } else {
                                setFilterCourtId(val);
                                setFilterSliceId('');
                                setFilterSliceMask(0);
                            }
                        }}
                    >
                        <option value="" disabled>SELECT A COURT UNIT...</option>
                        <option value="">ALL COURTS</option>
                        {branchCourts.filter(c => c.is_active !== false).map(c => (
                            c.sport_slices?.length > 0 ? (
                                <optgroup key={c.id} label={c.name.toUpperCase()}>
                                    {c.sport_slices.map(slice => (
                                        <option key={slice.id} value={`${c.id}:${slice.id}`}>
                                            {slice.name.toUpperCase()} (SLICE)
                                        </option>
                                    ))}
                                </optgroup>
                            ) : (
                                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                            )
                        ))}
                    </select>
                </div>
                <div className="w-[180px]">
                    <label className="block text-[10px] font-bold text-bodydark2 uppercase mb-2 tracking-widest">Target Date</label>
                    <input 
                        type="date"
                        className="w-full bg-gray border border-stroke rounded-lg px-4 py-2.5 outline-none focus:border-primary font-bold text-sm"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchBlocks}
                        className="p-2.5 bg-gray border border-stroke rounded-lg hover:bg-whiten transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 text-bodydark2 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => {
                            setFilterBranchId(''); 
                            setFilterCourtId(''); 
                            setFilterSliceId(''); 
                            setFilterSliceMask(0);
                            setBranchCourts([]);
                            setFilterDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="px-3 py-2.5 text-xs text-primary font-black uppercase hover:underline"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {message.text && (
                <div className={`mb-8 p-4 rounded-lg flex items-center justify-between border ${message.type === 'success' ? 'bg-green-50 text-success border-green-100' : 'bg-red-50 text-danger border-red-100'}`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold tracking-tight">{message.text}</span>
                    </div>
                </div>
            )}

            {viewMode === 'list' ? (
                /* List View */
                <div className="bg-white border border-stroke rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray border-b border-stroke">
                                <th className="px-6 py-4 text-[10px] font-bold text-bodydark2 uppercase tracking-widest">Court Details</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-bodydark2 uppercase tracking-widest">Schedule</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-bodydark2 uppercase tracking-widest">Reason</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-bodydark2 uppercase tracking-widest">Sync</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-bodydark2 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stroke">
                            {(() => {
                                const unifiedList = [
                                    ...blocks.map(b => ({ ...b, unifiedType: 'block' })),
                                    ...bookings.map(bk => ({ 
                                        ...bk, 
                                        unifiedType: 'booking',
                                        court_name: bk.court?.name || bk.court_name,
                                        branch_name: bk.court?.branch?.name || bk.branch_name,
                                        slice_mask: bk.slice_mask || 0,
                                        reason: bk.customer_name || 'Customer Booking'
                                    }))
                                ].sort((a, b) => {
                                    const dateA = a.block_date || a.booking_date;
                                    const dateB = b.block_date || b.booking_date;
                                    if (dateA !== dateB) return dateA > dateB ? 1 : -1;
                                    return (a.start_time || '') > (b.start_time || '') ? 1 : -1;
                                }).filter(item => {
                                    // Apply court filter if set
                                    if (filterCourtId) {
                                        const itemCid = String(item.court_id).toLowerCase().trim();
                                        const targetCid = String(filterCourtId).toLowerCase().trim();
                                        
                                        // Robust sibling check if we have group info
                                        const siblingToGroup = {};
                                        if (courts && courts.length > 0) {
                                            courts.forEach(c => { 
                                                if(c.shared_group_id) siblingToGroup[String(c.id).toLowerCase()] = String(c.shared_group_id).toLowerCase(); 
                                            });
                                        }
                                        
                                        const itemGroupId = siblingToGroup[itemCid];
                                        const targetGroupId = siblingToGroup[targetCid];
                                        
                                        if (itemCid !== targetCid && (!itemGroupId || itemGroupId !== targetGroupId)) return false;
                                    }
                                    
                                    // Apply slice mask filter if set
                                    if (filterSliceMask) {
                                        return !item.slice_mask || (item.slice_mask & filterSliceMask);
                                    }
                                    return true;
                                });

                                if (loading && !unifiedList.length) {
                                    return <tr><td colSpan="5" className="py-20 text-center text-body italic text-sm">Loading occupancy schedule...</td></tr>
                                }

                                if (unifiedList.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="5" className="py-24 text-center">
                                                <Info className="w-10 h-10 text-bodydark2 mx-auto mb-4 opacity-20" />
                                                <p className="text-body font-bold text-sm uppercase tracking-widest">No active occupancy found</p>
                                            </td>
                                        </tr>
                                    )
                                }

                                return unifiedList.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-gray/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.unifiedType === 'block' ? 'bg-danger/10' : 'bg-primary/10'}`}>
                                                    {item.unifiedType === 'block' ? <Lock className="w-5 h-5 text-danger" /> : <CheckCircle className="w-5 h-5 text-primary" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-black uppercase text-sm leading-none">{item.court_name}</h4>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.unifiedType === 'block' ? 'bg-danger text-white' : 'bg-primary text-white'}`}>
                                                            {item.unifiedType === 'block' ? 'Manual Block' : 'Booking'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-bodydark2 uppercase mt-1 block">{item.branch_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-black">
                                                    <Calendar className="w-3.5 h-3.5 text-bodydark2" />
                                                    {item.block_date || item.booking_date}
                                                </div>
                                                <div className={`flex items-center gap-2 text-xs font-black italic ${item.unifiedType === 'block' ? 'text-danger' : 'text-primary'}`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {String(item.start_time || '').substring(0,5)} - {String(item.end_time || '').substring(0,5)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 underline decoration-gray-300 decoration-dotted underline-offset-4 text-xs font-medium text-body">
                                            "{item.reason}"
                                            {filterCourtId && String(item.court_id).toLowerCase().trim() !== String(filterCourtId).toLowerCase().trim() && (
                                                <div className="text-[9px] font-black text-danger mt-1">VIA {item.court_name}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-1.5 overflow-hidden">
                                                {(item.sync_partners || (item.booking_source ? [item.booking_source] : ['direct'])).map(p => (
                                                    <span key={p} className="text-[9px] font-black text-bodydark2 px-2 py-0.5 bg-gray rounded uppercase border border-stroke">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {item.unifiedType === 'block' ? (
                                                <button 
                                                    onClick={() => handleDeleteBlock(item.id)}
                                                    className="p-2 text-bodydark2 hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <span className="text-[9px] font-black text-bodydark2 uppercase bg-gray px-2 py-1 rounded">Locked</span>
                                            )}
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Visual Timeline View */
                <TimelineGrid 
                    selectedBranchId={filterBranchId}
                    selectedCourtId={filterCourtId}
                    selectedSliceId={filterSliceId}
                    selectedSliceMask={filterSliceMask}
                    selectedDate={filterDate}
                    branches={branches}
                    courts={branchCourts}
                    blocks={blocks}
                    bookings={bookings}
                    loading={loading}
                    onCreateBlock={(courtId, startTime) => {
                        setFormBranchId(filterBranchId);
                        setFormData({
                            ...formData, 
                            court_id: courtId, 
                            block_date: filterDate,
                            start_time: startTime,
                            end_time: `${parseInt(startTime.split(':')[0]) + 1}:00`,
                            slice_mask: filterSliceId ? filterSliceMask : 0
                        });
                        setIsDrawerOpen(true);
                    }}
                />
            )}

            {/* Standard Drawer for Block Creation */}
            <Drawer
                title="Schedule Manual Block"
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            >
                <form onSubmit={handleCreateBlock} className="flex flex-col h-full">
                    <div className="space-y-8 flex-1">
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                            <h5 className="text-[10px] font-black text-primary uppercase mb-2 tracking-widest">Global Master Synchronization</h5>
                            <p className="text-xs text-primary/80 leading-relaxed font-medium">
                                Creating this block will immediately revoke availability across all connected partner apps (District, Playo, Hudle) and the main mobile app.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Venue Selection */}
                            <div>
                                <label className="block text-[10px] font-bold text-bodydark2 uppercase tracking-widest mb-3 italic">01. Select Venue</label>
                                <select 
                                    className="w-full bg-gray border border-stroke rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-sm"
                                    value={formBranchId}
                                    onChange={(e) => {
                                        setFormBranchId(e.target.value);
                                        setFormData({...formData, court_id: ''});
                                    }}
                                    required
                                >
                                    <option value="">CHOOSE A VENUE...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Court Selection */}
                            <div>
                                <label className="block text-[10px] font-bold text-bodydark2 uppercase tracking-widest mb-3 italic">02. Select Target Court</label>
                                <select 
                                    className={`w-full bg-gray border border-stroke rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-sm ${!formBranchId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={formData.court_id}
                                    disabled={!formBranchId}
                                    onChange={(e) => setFormData({...formData, court_id: e.target.value})}
                                    required
                                >
                                    <option value="" disabled>{formBranchId ? '— CHOOSE A COURT —' : 'FIRST SELECT A VENUE'}</option>
                                    {filteredFormCourts.filter(c => c.is_active !== false).map(c => (
                                        c.sport_slices?.length > 0 ? (
                                            <optgroup key={c.id} label={c.name.toUpperCase()}>
                                                {c.sport_slices.map(slice => (
                                                    <option key={slice.id} value={`${c.id}:${slice.id}`}>
                                                        {slice.name.toUpperCase()}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ) : (
                                            <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                        )
                                    ))}
                                </select>
                            </div>

                            {/* Selection Mode for Divisible Courts */}
                            {selectedFormCourt && selectedFormCourt.sport_slices && selectedFormCourt.sport_slices.length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-3 italic flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        03. Selection Mode (Granular Block)
                                    </label>
                                    <select 
                                        className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-sm text-primary"
                                        value={formData.slice_mask}
                                        onChange={(e) => setFormData({...formData, slice_mask: parseInt(e.target.value)})}
                                    >
                                        <option value={0}>BLOCK ENTIRE FACILITY (ALL SPORTS)</option>
                                        {selectedFormCourt.sport_slices.map(slice => (
                                            <option key={slice.id} value={slice.mask}>
                                                ONLY {slice.name.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-[10px] text-bodydark2 font-medium">
                                        You can block a specific part of the court or the entire facility.
                                    </p>
                                </div>
                            )}

                            {/* Multi-day Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-bodydark2 uppercase tracking-widest mb-3 italic">03. Start Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-gray border border-stroke rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-sm"
                                        value={formData.block_date}
                                        onChange={(e) => setFormData({...formData, block_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-bodydark2 uppercase tracking-widest mb-3 italic">04. End Date (Optional)</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-gray border border-stroke rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-sm"
                                        value={formData.end_date}
                                        min={formData.block_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        placeholder="SINGLE DAY"
                                    />
                                </div>
                            </div>

                            {/* Capacity Blocking (Only for Capacity-based courts) */}
                            {selectedFormCourt?.logic_type === 'capacity' && (
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                    <label className="block text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3 italic flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        05. Capacity to Block
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="number"
                                            className="w-24 bg-white border border-orange-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400 font-bold text-sm text-orange-700"
                                            value={formData.blocked_capacity}
                                            min="0"
                                            max={selectedFormCourt.capacity_limit}
                                            onChange={(e) => setFormData({...formData, blocked_capacity: parseInt(e.target.value) || 0})}
                                        />
                                        <div>
                                            <p className="text-[11px] font-bold text-orange-800">
                                                {formData.blocked_capacity === 0 ? 'BLOCK ENTIRE FACILITY' : `BLOCK ${formData.blocked_capacity} SLOTS`}
                                            </p>
                                            <p className="text-[9px] text-orange-600 font-medium">
                                                Total Capacity: {selectedFormCourt.capacity_limit}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-6 border-t border-stroke space-y-6">
                                {/* Reason for the block */}
                                <div>
                                    <label className="block text-[10px] font-bold text-bodydark2 uppercase tracking-widest mb-3 italic">05. Reason / Event Name</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. MAINTENANCE, PRIVATE EVENT, TOURNAMENT"
                                        className="w-full px-4 py-3 bg-gray border border-stroke rounded-xl outline-none focus:border-primary font-bold text-sm uppercase"
                                        value={formData.reason}
                                        onChange={e => setFormData({...formData, reason: e.target.value})}
                                        required
                                    />
                                </div>

                                {/* Time Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-bodydark2 uppercase tracking-widest mb-3 italic">06. From Time</label>
                                        <input 
                                            required
                                            type="time"
                                            className="w-full px-4 py-3 bg-gray border border-stroke rounded-xl outline-none focus:border-primary font-black text-sm"
                                            value={formData.start_time}
                                            onChange={e => setFormData({...formData, start_time: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-bodydark2 uppercase tracking-widest mb-3 italic">07. Until Time</label>
                                        <input 
                                            required
                                            type="time"
                                            className="w-full px-4 py-3 bg-gray border border-stroke rounded-xl outline-none focus:border-primary font-black text-sm"
                                            value={formData.end_time}
                                            onChange={e => setFormData({...formData, end_time: e.target.value})}
                                        />
                                    </div>
                                </div>
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
                            disabled={loading || !formData.court_id}
                            className="flex-[2] px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-sm uppercase"
                        >
                            {loading ? 'DEPLOYING...' : 'Block Availability'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </Layout>
    );
};

// --- TIMELINE COMPONENTS ---

const TimelineGrid = ({ selectedBranchId, selectedCourtId, selectedSliceId, selectedSliceMask, selectedDate, branches, courts, blocks, bookings, loading, onCreateBlock }) => {
    const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, item: null, type: null });

    // Build a slice resolution map
    const sliceMap = useMemo(() => {
        const map = {};
        courts.forEach(c => {
            if (c.sport_slices) {
                map[String(c.id).toLowerCase()] = c.sport_slices.reduce((acc, s) => {
                    acc[s.mask] = s.name;
                    return acc;
                }, {});
            }
        });
        return map;
    }, [courts]);

    const getSliceName = (courtId, mask) => {
        if (!mask) return null;
        return sliceMap[String(courtId).toLowerCase()]?.[mask];
    };

    const handleMouseEnter = (e, item, type) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            show: true,
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY - 10,
            item,
            type
        });
    };

    const handleMouseLeave = () => {
        setTooltip({ ...tooltip, show: false });
    };
    
    if (!selectedBranchId) {
        return (
            <div className="bg-white border border-stroke rounded-xl p-20 text-center shadow-sm">
                <MapPin className="w-12 h-12 text-bodydark2 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-black uppercase tracking-widest mb-2">Venue Not Selected</h3>
                <p className="text-body text-sm">Please select a venue from the filters above to view the visual timeline.</p>
            </div>
        );
    }

    const filteredCourts = courts.filter(c => 
        c.branch_id === selectedBranchId && 
        c.is_active !== false &&
        (!selectedCourtId || c.id === selectedCourtId)
    );

    return (
        <div className="bg-white border border-stroke rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <div className="inline-flex flex-col min-w-full">
                    {/* Unified Timeline Header */}
                    <div className="flex bg-gray/80 backdrop-blur-sm sticky top-0 z-30 border-b border-stroke">
                        <div className="w-[180px] p-4 border-r border-stroke flex-shrink-0 bg-gray sticky left-0 z-40">
                            <span className="text-[10px] font-black text-bodydark2 uppercase tracking-widest">Court / Time</span>
                        </div>
                        <div className="flex-1 flex">
                            {HOURS.map(hour => (
                                <div key={hour} className="flex-1 min-w-[100px] p-4 text-center border-r border-stroke last:border-r-0">
                                    <span className="text-[11px] font-black text-black">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Rows */}
                    <div className="divide-y divide-stroke">
                        {filteredCourts.length === 0 ? (
                            <div className="p-10 text-center text-body italic text-sm">No courts found for this venue.</div>
                        ) : (() => {
                            // Definitive Client-Side Group Mapping for Robust Synchronization
                            const courtToGroup = {};
                            courts.forEach(c => {
                                if (c.shared_group_id) {
                                    courtToGroup[String(c.id).toLowerCase()] = String(c.shared_group_id).toLowerCase();
                                }
                            });

                            return filteredCourts.map(court => {
                                const cId = String(court.id || '').toLowerCase().trim();
                                const cGroupId = courtToGroup[cId];

                                const courtBlocks = blocks.filter(b => {
                                    const bCourtId = String(b.court_id || '').toLowerCase().trim();
                                    
                                    // 1. Direct match
                                    if (bCourtId === cId) return true;

                                    // 2. Shared Group match (Definitive client-side check)
                                    const bGroupId = courtToGroup[bCourtId];
                                    const isSibling = (bGroupId && cGroupId) && (bGroupId === cGroupId);
                                    
                                    if (!isSibling) return false;

                                    // 3. Slice overlap (If filtering for a specific Turf)
                                    if (selectedSliceMask) {
                                        return !b.slice_mask || (b.slice_mask & selectedSliceMask);
                                    }
                                    return true;
                                });

                                const courtBookings = bookings.filter(bk => {
                                    const bkCourtId = String(bk.court_id || '').toLowerCase().trim();
                                    
                                    // 1. Direct match
                                    if (bkCourtId === cId) return true;

                                    // 2. Shared Group match
                                    const bkGroupId = courtToGroup[bkCourtId];
                                    const isSibling = (bkGroupId && cGroupId) && (bkGroupId === cGroupId);
                                    
                                    if (!isSibling) return false;

                                    // 3. Slice overlap
                                    if (selectedSliceMask) {
                                        return !bk.slice_mask || (bk.slice_mask & selectedSliceMask);
                                    }
                                    return true;
                                });
                                
                                return (
                                    <TimelineRow 
                                        key={court.id}
                                        court={court}
                                        blocks={courtBlocks}
                                        bookings={courtBookings}
                                        hours={HOURS}
                                        onCreateBlock={onCreateBlock}
                                        onHover={handleMouseEnter}
                                        onLeave={handleMouseLeave}
                                        getSliceName={getSliceName}
                                    />
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            {/* Custom Tooltip */}
            {tooltip.show && (
                <div 
                    className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700/50 min-w-[200px]"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 mb-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${tooltip.type === 'block' ? 'bg-danger text-white' : 'bg-primary text-white'}`}>
                                {tooltip.type === 'block' ? 'Manual Block' : 'Customer Booking'}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                                <Clock className="w-3 h-3" />
                                {tooltip.item.start_time || tooltip.item.time_slots?.[0]?.start_time} - {tooltip.item.end_time || tooltip.item.time_slots?.[tooltip.item.time_slots.length-1]?.end_time}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Facility</p>
                                <p className="text-sm font-black text-white">
                                    {tooltip.item.court_name}
                                    {getSliceName(tooltip.item.court_id, tooltip.item.slice_mask) && (
                                        <span className="text-primary ml-2 uppercase text-[11px]">
                                            ({getSliceName(tooltip.item.court_id, tooltip.item.slice_mask)})
                                        </span>
                                    )}
                                </p>
                            </div>
                            
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {tooltip.type === 'block' ? 'Reason / Event' : 'Customer Name'}
                                </p>
                                <p className="text-sm font-bold text-slate-100 italic">
                                    "{tooltip.type === 'block' ? tooltip.item.reason : tooltip.item.customer_name}"
                                </p>
                            </div>

                            {tooltip.type === 'booking' && (
                                <div className="pt-1 border-t border-white/10">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <MapPin className="w-3 h-3" />
                                        {tooltip.item.branch_name}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-8 border-transparent border-t-slate-900" />
                </div>
            )}

            {/* Legend */}
            <div className="p-4 bg-white border-t border-stroke flex flex-wrap gap-6 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded shadow-sm"></div>
                    <span className="text-[11px] font-extrabold text-black uppercase tracking-wider">MyRush App</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded shadow-sm"></div>
                    <span className="text-[11px] font-extrabold text-black uppercase tracking-wider">Partner (District/Playo)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-danger rounded shadow-sm"></div>
                    <span className="text-[11px] font-extrabold text-black uppercase tracking-wider">Manual Block</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white border border-stroke border-dashed rounded"></div>
                    <span className="text-[11px] font-extrabold text-black uppercase tracking-wider">Free Slot</span>
                </div>
            </div>
        </div>
    );
};

const TimelineRow = ({ court, blocks, bookings, hours, onCreateBlock, onHover, onLeave, getSliceName }) => {
    const timeToX = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        const startHour = hours[0];
        const totalHours = hours.length;
        return ((h - startHour + (m || 0) / 60) / totalHours) * 100;
    };

    const durationToWidth = (start, end) => {
        if (!start || !end) return 0;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let duration = (eh - sh) + ((em || 0) - (sm || 0)) / 60;
        if (duration < 0) duration += 24; // Handle midnight wrap
        return (duration / hours.length) * 100;
    };

    const formatTimeLabel = (timeStr) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        return `${h}:${m || '00'}`;
    };

    return (
        <div className="flex group hover:bg-gray/5 transition-colors h-[90px] relative">
            {/* Sticky Court Info */}
            <div className="w-[180px] p-4 border-r border-stroke flex-shrink-0 flex flex-col justify-center bg-white sticky left-0 z-20 group-hover:bg-gray/10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] border-b border-stroke">
                <h4 className="font-extrabold text-black uppercase text-[10px] leading-tight truncate">{court.name}</h4>
                <span className="text-[8px] font-bold text-primary uppercase italic mt-1">{court.game_type?.name || 'Sports'}</span>
            </div>

            {/* Scrollable Timeline Context */}
            <div className="flex-1 relative flex">
                {/* Background Grid Lines & Click Targets */}
                {hours.map((hour, idx) => (
                    <div key={hour} className="flex-1 min-w-[100px] border-r border-stroke/30 last:border-r-0 relative group/slot">
                        <div className="absolute inset-0 flex">
                            {(() => {
                                const time00 = `${hour.toString().padStart(2, '0')}:00`;
                                const time30 = `${hour.toString().padStart(2, '0')}:30`;
                                
                                const isOccupied = (t) => {
                                    // If capacity court, we only consider it "Occupied" (blocked from new clicks) if full
                                    if (court.logic_type === 'capacity') {
                                        const bookedCap = bookings.filter(bk => {
                                            const bStart = bk.time_slots?.[0]?.start_time || bk.start_time;
                                            const bEnd = bk.time_slots?.[bk.time_slots.length - 1]?.end_time || bk.end_time;
                                            return bStart <= t && bEnd > t;
                                        }).reduce((sum, bk) => sum + (bk.num_tickets || 1), 0);
                                        
                                        const blockedCap = blocks.filter(b => b.start_time <= t && b.end_time > t)
                                            .reduce((sum, b) => sum + (b.blocked_capacity || court.capacity_limit), 0);
                                            
                                        return (bookedCap + blockedCap) >= court.capacity_limit;
                                    }

                                    // Check blocks
                                    const hasBlock = blocks.some(b => b.start_time <= t && b.end_time > t);
                                    // Check bookings
                                    const hasBooking = bookings.some(bk => {
                                        const bStart = bk.time_slots?.[0]?.start_time || bk.start_time;
                                        const bEnd = bk.time_slots?.[bk.time_slots.length - 1]?.end_time || bk.end_time;
                                        return bStart <= t && bEnd > t;
                                    });
                                    return hasBlock || hasBooking;
                                };

                                return (
                                    <>
                                        {!isOccupied(time00) && (
                                            <button 
                                                onClick={() => onCreateBlock(court.id, time00)}
                                                className="flex-1 opacity-0 hover:opacity-100 hover:bg-primary/5 transition-all text-[8px] font-black text-primary/40 flex items-center justify-center"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                        {isOccupied(time00) && <div className="flex-1" />}
                                        
                                        {!isOccupied(time30) && (
                                            <button 
                                                onClick={() => onCreateBlock(court.id, time30)}
                                                className="flex-1 opacity-0 hover:opacity-100 hover:bg-primary/5 transition-all text-[8px] font-black text-primary/40 flex items-center justify-center border-l border-stroke/10"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                        {isOccupied(time30) && <div className="flex-1 border-l border-stroke/10" />}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                ))}

                {/* Occupancy Blocks */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {bookings.map(booking => {
                        const startTime = booking.time_slots?.[0]?.start_time || booking.start_time;
                        const endTime = booking.time_slots?.[booking.time_slots.length - 1]?.end_time || booking.end_time;
                        
                        if (!startTime || !endTime) return null;
                        
                        const left = timeToX(startTime);
                        const width = durationToWidth(startTime, endTime);
                        const isPartner = booking.booking_source && booking.booking_source !== 'direct';
                        const isSibling = String(booking.court_id).toLowerCase().trim() !== String(court.id).toLowerCase().trim();
                        
                        return (
                            <div 
                                key={booking.id}
                                className={`absolute top-2 bottom-2 rounded-xl border-2 shadow-md p-2 flex flex-col justify-center overflow-hidden pointer-events-auto transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer ${isSibling ? (isPartner ? 'bg-indigo-300 border-indigo-400' : 'bg-primary/40 border-primary/20') : (isPartner ? 'bg-indigo-500 border-indigo-600' : 'bg-primary border-primary/20')} text-white`}
                                style={{ left: `${left}%`, width: `${width}%` }}
                                onMouseEnter={(e) => onHover(e, booking, 'booking')}
                                onMouseLeave={onLeave}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-2.5 h-2.5 opacity-80" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                        {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase leading-none truncate mb-0.5">
                                    {booking.customer_name}
                                </span>
                                <span className="text-[8px] font-black uppercase opacity-90 truncate flex items-center gap-1">
                                    {booking.court_name}
                                    {getSliceName(booking.court_id, booking.slice_mask) && (
                                        <span className="text-[7px] bg-white/20 px-1 rounded italic">
                                            {getSliceName(booking.court_id, booking.slice_mask)}
                                        </span>
                                    )}
                                    {isSibling && <span className="text-[7px] bg-white/20 px-1 rounded">SHARED</span>}
                                </span>
                                <span className="text-[6px] font-bold opacity-70 uppercase tracking-widest mt-1">
                                    {isPartner ? `VIA ${booking.booking_source}` : 'APP RESERVED'}
                                </span>
                            </div>
                        );
                    })}

                    {blocks.map((block, idx) => {
                        const left = timeToX(block.start_time);
                        const width = durationToWidth(block.start_time, block.end_time);
                        const isSibling = String(block.court_id).toLowerCase().trim() !== String(court.id).toLowerCase().trim();

                        return (
                            <div 
                                key={block.id || idx}
                                className={`absolute top-2 bottom-2 ${isSibling ? 'bg-danger/50 border-2 border-dashed border-danger/50' : 'bg-danger/90 border-2 border-danger/20'} text-white rounded-xl shadow-md p-2 flex flex-col justify-center pointer-events-auto transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer`}
                                style={{ 
                                    left: `${left}%`, 
                                    width: `${width}%`,
                                    opacity: (court.logic_type === 'capacity' && block.blocked_capacity) ? 0.6 : 1,
                                    height: (court.logic_type === 'capacity' && block.blocked_capacity) ? '70%' : 'auto',
                                    top: (court.logic_type === 'capacity' && block.blocked_capacity) ? '15%' : '8px'
                                }}
                                onMouseEnter={(e) => onHover(e, block, 'block')}
                                onMouseLeave={onLeave}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Sibling blocks cannot be deleted from this view to prevent accidents
                                    if (isSibling) {
                                        alert(`This block originated from ${block.court_name}. Please switch to that court to manage it.`);
                                    } else {
                                        // Parent can handle deletion
                                    }
                                }}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <Lock className="w-2.5 h-2.5 opacity-80" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                        {formatTimeLabel(block.start_time)} - {formatTimeLabel(block.end_time)}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase leading-none truncate">
                                    {(court.logic_type === 'capacity' && block.blocked_capacity) ? `BLOCK ${block.blocked_capacity} SLOTS` : block.court_name}
                                    {getSliceName(block.court_id, block.slice_mask) && !block.blocked_capacity && (
                                        <span className="text-[8px] ml-1 opacity-80">({getSliceName(block.court_id, block.slice_mask)})</span>
                                    )}
                                </span>
                                <span className="text-[8px] font-bold opacity-90 truncate">
                                    {block.reason}
                                </span>
                                <span className="text-[6px] font-bold opacity-70 uppercase tracking-widest mt-1">
                                    {isSibling ? 'SHARED BLOCK' : (block.blocked_capacity ? 'PARTIAL BLOCK' : 'MANUAL BLOCK')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CourtBlocks;
