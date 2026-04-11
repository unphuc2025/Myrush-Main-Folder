import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, RefreshCw, AlertCircle, Info, Lock, CheckCircle, X, ChevronRight, MapPin, Search } from 'lucide-react';
import Layout from '../components/Layout';
import Drawer from '../components/settings/Drawer';
import { blocksApi, branchesApi, courtsApi, bookingsApi } from '../services/adminApi';

const CourtBlocks = () => {
    const [blocks, setBlocks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState('timeline'); // Default to visual timeline for better UX
    const [bookings, setBookings] = useState([]);
    
    // Filters
    const [filterBranchId, setFilterBranchId] = useState('');
    const [filterCourtId, setFilterCourtId] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Form State
    const [formBranchId, setFormBranchId] = useState('');
    const [formData, setFormData] = useState({
        court_id: '',
        block_date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00',
        reason: 'Maintenance',
        slice_mask: 0,
        sync_partners: ['district', 'playo', 'hudle']
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchBlocks();
    }, [filterBranchId, filterCourtId, filterDate]);

    const fetchInitialData = async () => {
        try {
            const [branchesData, courtsData] = await Promise.all([
                branchesApi.getAll(),
                courtsApi.getAll({ limit: 1000 })
            ]);
            setBranches(branchesData?.items || branchesData || []);
            setCourts(courtsData?.items || courtsData || []);
        } catch (error) {
            console.error('Error fetching meta data:', error);
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

            setBlocks(blocksData || []);
            
            // Filter bookings for the selected date if they were fetched for the whole branch
            const filteredBookings = (bookingsData?.items || bookingsData || []).filter(b => {
                const bDate = b.booking_date?.toString().split('T')[0];
                return bDate === filterDate && 
                    b.status !== 'cancelled' &&
                    (!filterCourtId || b.court_id === filterCourtId);
            });
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
            await blocksApi.createBlock(formData);
            setMessage({ type: 'success', text: 'Court blocked successfully.' });
            setIsDrawerOpen(false);
            fetchBlocks();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to create block.' });
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
    const filteredFilterCourts = courts.filter(c => c.branch_id === filterBranchId);
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
                        onChange={(e) => {
                            setFilterBranchId(e.target.value);
                            setFilterCourtId('');
                        }}
                    >
                        <option value="">All Venues</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-bodydark2 uppercase mb-2 tracking-widest">Select Court</label>
                    <select 
                        className={`w-full bg-gray border border-stroke rounded-lg px-4 py-2.5 outline-none focus:border-primary font-bold text-sm ${!filterBranchId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={filterCourtId}
                        disabled={!filterBranchId}
                        onChange={(e) => setFilterCourtId(e.target.value)}
                    >
                        <option value="">All Courts</option>
                        {filteredFilterCourts.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
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
                        onClick={() => {setFilterBranchId(''); setFilterCourtId(''); setFilterDate(new Date().toISOString().split('T')[0])}}
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
                /* List View (Existing Table) */
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
                        {loading && !blocks.length ? (
                            <tr><td colSpan="5" className="py-20 text-center text-body italic text-sm">Loading block schedule...</td></tr>
                        ) : blocks.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-24 text-center">
                                    <Info className="w-10 h-10 text-bodydark2 mx-auto mb-4 opacity-20" />
                                    <p className="text-body font-bold text-sm uppercase tracking-widest">No active blocks found</p>
                                </td>
                            </tr>
                        ) : (
                            blocks.map(block => (
                                <tr key={block.id} className="hover:bg-gray/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-danger/10 rounded-lg flex items-center justify-center">
                                                <Lock className="w-5 h-5 text-danger" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-black uppercase text-sm leading-none mb-1">{block.court_name}</h4>
                                                <span className="text-[10px] font-bold text-bodydark2 uppercase">{block.branch_name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-black">
                                                <Calendar className="w-3.5 h-3.5 text-bodydark2" />
                                                {block.block_date}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-black text-primary italic">
                                                <Clock className="w-3.5 h-3.5" />
                                                {block.start_time.substring(0,5)} - {block.end_time.substring(0,5)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 underline decoration-gray-300 decoration-dotted underline-offset-4 text-xs font-medium text-body">
                                        "{block.reason}"
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-1.5 overflow-hidden">
                                            {block.sync_partners?.map(p => (
                                                <span key={p} className="text-[9px] font-black text-bodydark2 px-2 py-0.5 bg-gray rounded uppercase border border-stroke">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button 
                                            onClick={() => handleDeleteBlock(block.id)}
                                            className="p-2 text-bodydark2 hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            ) : (
                /* Visual Timeline View */
                <TimelineGrid 
                    selectedBranchId={filterBranchId}
                    selectedDate={filterDate}
                    branches={branches}
                    courts={courts}
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
                            slice_mask: 0
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
                                    <option value="">{formBranchId ? 'SELECT A COURT...' : 'FIRST SELECT A VENUE'}</option>
                                    {filteredFormCourts.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name.toUpperCase()}
                                        </option>
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


                            {/* Rest of Form */}
                            <div className="pt-6 border-t border-stroke space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-bodydark2 uppercase mb-2 ml-1">Date</label>
                                        <input 
                                            required
                                            type="date"
                                            className="w-full px-4 py-3 bg-gray border border-stroke rounded-xl outline-none focus:border-primary font-bold text-sm"
                                            value={formData.block_date}
                                            onChange={e => setFormData({...formData, block_date: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-bodydark2 uppercase mb-2 ml-1">Reason</label>
                                        <input 
                                            type="text"
                                            placeholder="Tournament"
                                            className="w-full px-4 py-3 bg-gray border border-stroke rounded-xl outline-none focus:border-primary font-bold text-sm"
                                            value={formData.reason}
                                            onChange={e => setFormData({...formData, reason: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-bodydark2 uppercase mb-2 ml-1">From</label>
                                        <input 
                                            required
                                            type="time"
                                            className="w-full px-4 py-3 bg-gray border border-stroke rounded-xl outline-none focus:border-primary font-black text-sm"
                                            value={formData.start_time}
                                            onChange={e => setFormData({...formData, start_time: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-bodydark2 uppercase mb-2 ml-1">Until</label>
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

const TimelineGrid = ({ selectedBranchId, selectedDate, courts, blocks, bookings, loading, onCreateBlock }) => {
    const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00
    
    if (!selectedBranchId) {
        return (
            <div className="bg-white border border-stroke rounded-xl p-20 text-center shadow-sm">
                <MapPin className="w-12 h-12 text-bodydark2 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-black uppercase tracking-widest mb-2">Venue Not Selected</h3>
                <p className="text-body text-sm">Please select a venue from the filters above to view the visual timeline.</p>
            </div>
        );
    }

    const filteredCourts = courts.filter(c => c.branch_id === selectedBranchId);

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
                        ) : (
                            filteredCourts.map(court => {
                                const courtBlocks = blocks.filter(b => b.court_id === court.id);
                                const courtBookings = bookings.filter(b => b.court_id === court.id);
                                
                                return (
                                    <TimelineRow 
                                        key={court.id}
                                        court={court}
                                        blocks={courtBlocks}
                                        bookings={courtBookings}
                                        hours={HOURS}
                                        onCreateBlock={onCreateBlock}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

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

const TimelineRow = ({ court, blocks, bookings, hours, onCreateBlock }) => {
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
                <h4 className="font-extrabold text-black uppercase text-[10px] leading-tight truncate" title={court.name}>{court.name}</h4>
                <span className="text-[8px] font-bold text-primary uppercase italic mt-1">{court.game_type?.name || 'Sports'}</span>
            </div>

            {/* Scrollable Timeline Context */}
            <div className="flex-1 relative flex">
                {/* Background Grid Lines & Click Targets */}
                {hours.map((hour, idx) => (
                    <div key={hour} className="flex-1 min-w-[100px] border-r border-stroke/30 last:border-r-0 relative group/slot">
                        <div className="absolute inset-0 flex">
                            <button 
                                onClick={() => onCreateBlock(court.id, `${hour.toString().padStart(2, '0')}:00`)}
                                className="flex-1 opacity-0 hover:opacity-100 hover:bg-primary/5 transition-all text-[8px] font-black text-primary/40 flex items-center justify-center"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onCreateBlock(court.id, `${hour.toString().padStart(2, '0')}:30`)}
                                className="flex-1 opacity-0 hover:opacity-100 hover:bg-primary/5 transition-all text-[8px] font-black text-primary/40 flex items-center justify-center border-l border-stroke/10"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Occupancy Blocks */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {bookings.map(booking => {
                        const startTime = booking.time_slots?.[0]?.start_time || booking.time_slots?.[0]?.start || booking.start_time;
                        const endTime = booking.time_slots?.[booking.time_slots.length - 1]?.end_time || booking.time_slots?.[booking.time_slots.length - 1]?.end || booking.end_time;
                        
                        if (!startTime || !endTime) return null;
                        
                        const left = timeToX(startTime);
                        const width = durationToWidth(startTime, endTime);
                        const isPartner = booking.booking_source && booking.booking_source !== 'direct';

                        return (
                            <div 
                                key={booking.id}
                                className={`absolute top-2 bottom-2 rounded-xl border-2 shadow-md p-2 flex flex-col justify-center overflow-hidden pointer-events-auto transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer ${isPartner ? 'bg-indigo-500 border-indigo-600 text-white' : 'bg-primary border-primary/20 text-white'}`}
                                style={{ left: `${left}%`, width: `${width}%` }}
                                title={`${booking.customer_name} | ${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-2.5 h-2.5 opacity-80" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                        {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase leading-none truncate">
                                    {booking.customer_name}
                                </span>
                                <span className="text-[7px] font-bold opacity-70 uppercase tracking-widest mt-0.5">
                                    {isPartner ? booking.booking_source : 'Confirmed App'}
                                </span>
                            </div>
                        );
                    })}

                    {blocks.map(block => {
                        const left = timeToX(block.start_time);
                        const width = durationToWidth(block.start_time, block.end_time);

                        return (
                            <div 
                                key={block.id}
                                className="absolute top-2 bottom-2 bg-danger/90 border-2 border-danger/20 text-white rounded-xl shadow-md p-2 flex flex-col justify-center pointer-events-auto transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer"
                                style={{ left: `${left}%`, width: `${width}%` }}
                                title={`Manual Block: ${block.reason} | ${formatTimeLabel(block.start_time)} - ${formatTimeLabel(block.end_time)}`}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <Lock className="w-2.5 h-2.5 opacity-80" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                        {formatTimeLabel(block.start_time)} - {formatTimeLabel(block.end_time)}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase leading-none truncate">{block.reason || 'Manual Block'}</span>
                                <span className="text-[7px] font-bold opacity-70 uppercase tracking-widest mt-0.5">ADMIN BLOCKED</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CourtBlocks;
