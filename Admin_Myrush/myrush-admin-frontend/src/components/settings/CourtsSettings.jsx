import { useState, useEffect } from 'react';
import { Edit2, Plus, Play, Eye, Trash2, X, Settings, Search, Building2, MapPin, Trophy, Coins, CheckCircle2, ChevronDown } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import AddCourtForm from './AddCourtForm';
import Drawer from './Drawer';
import { citiesApi, branchesApi, gameTypesApi, courtsApi, globalPriceConditionsApi, IMAGE_BASE_URL } from '../../services/adminApi';

function CourtsSettings() {
  const [courts, setCourts] = useState([]);
  const [cities, setCities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // View state
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [viewingCourt, setViewingCourt] = useState(null);

  // Global Price Conditions
  const [globalConditions, setGlobalConditions] = useState([]);
  const [showGlobalConditions, setShowGlobalConditions] = useState(false);
  const [editingGlobalCondition, setEditingGlobalCondition] = useState(null);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
    fetchGlobalConditions();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [citiesData, branchesData, gameTypesData, courtsData] = await Promise.all([
        citiesApi.getAll(),
        branchesApi.getAll(),
        gameTypesApi.getAll(),
        courtsApi.getAll()
      ]);

      setCities(citiesData);
      setBranches(branchesData);
      setGameTypes(gameTypesData);
      setCourts(courtsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalConditions = async () => {
    try {
      const conditions = await globalPriceConditionsApi.getAll();
      setGlobalConditions(conditions);
    } catch (err) {
      console.error('Error fetching global conditions:', err);
    }
  };

  // Filter branches and courts based on selections
  const filteredBranches = selectedCityId
    ? branches.filter(branch => branch.city_id === selectedCityId)
    : branches;

  const filteredCourts = courts.filter(court => {
    // 1. City Check
    if (selectedCityId) {
      let cityMatches = false;
      if (court.branch?.city?.id === selectedCityId) cityMatches = true;
      else if (court.branch?.city_id === selectedCityId) cityMatches = true;
      else {
        const branch = branches.find(b => b.id === court.branch_id);
        if (branch?.city_id === selectedCityId) cityMatches = true;
      }
      if (!cityMatches) return false;
    }

    // 2. Branch Check
    if (selectedBranchId && String(court.branch_id) !== String(selectedBranchId)) return false;

    // 3. Search Term
    if (searchTerm && !court.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    return true;
  });

  const handleCityChange = (cityId) => {
    setSelectedCityId(cityId);
    setSelectedBranchId('');
  };

  const handleAddClick = () => {
    setEditingCourt(null);
    setShowDrawer(true);
  };

  const handleEditClick = (court) => {
    setEditingCourt(court);
    setShowDrawer(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this court?')) {
      try {
        await courtsApi.delete(id);
        await fetchAllData();
      } catch (err) {
        console.error('Error deleting court:', err);
        setError('Failed to delete court');
      }
    }
  };

  const handleToggleCourt = async (court) => {
    try {
      // Optimistic
      setCourts(courts.map(c => c.id === court.id ? { ...c, is_active: !c.is_active } : c));

      const updateData = new FormData();
      updateData.append('name', court.name);
      updateData.append('branch_id', court.branch_id);
      updateData.append('game_type_id', court.game_type_id);
      updateData.append('price_per_hour', court.price_per_hour || court.default_price);
      updateData.append('is_active', !court.is_active);

      await courtsApi.update(court.id, updateData);
    } catch (err) {
      console.error('Error toggling court:', err);
      setError('Failed to update court status');
      fetchAllData(); // Revert
    }
  };

  const handleFormSuccess = async () => {
    await fetchAllData();
    setShowDrawer(false);
    setEditingCourt(null);
  };

  if (viewingCourt) {
    return <CourtViewModal court={viewingCourt} onClose={() => setViewingCourt(null)} />;
  }

  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {/* City Filter */}
          {/* City Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedCityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="">All Cities</option>
              {cities.filter(c => c.is_active).map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Branch Filter */}
          {selectedCityId && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
            >
              <option value="">All Branches</option>
              {filteredBranches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex w-full xl:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold">New Court</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <X className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Global Price Conditions Banner */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-green-100">
              <Settings className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Global Pricing Rules</h3>
              <p className="text-xs text-slate-500">Manage base rates and recurring price adjustments for all courts.</p>
            </div>
          </div>
          <button
            onClick={() => setShowGlobalConditions(!showGlobalConditions)}
            className="px-4 py-2 bg-white border border-green-200 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors shadow-sm"
          >
            {showGlobalConditions ? 'Close Rules' : 'Manage Rules'}
          </button>
        </div>

        {showGlobalConditions && (
          <div className="mt-4 pt-4 border-t border-green-200/50 animate-in slide-in-from-top-2 fade-in">
            <GlobalPriceConditionsSection
              conditions={globalConditions}
              onRefresh={fetchGlobalConditions}
              onEdit={setEditingGlobalCondition}
              editingCondition={editingGlobalCondition}
            />
          </div>
        )}
      </div>

      {/* Courts List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading courts...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Court Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pricing</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourts.map((court) => (
                    <tr key={court.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                            {court.images && court.images.length > 0 ? (
                              <img src={court.images[0]} alt={court.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-slate-50">
                                <Trophy className="h-5 w-5 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{court.name}</h4>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                              {court.game_type?.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            {court.branch?.name}
                          </div>
                          <span className="text-xs text-slate-500 pl-4.5">{court.branch?.city?.short_code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Coins className="h-3.5 w-3.5 text-slate-400" />
                          ₹{court.price_per_hour || court.default_price} <span className="text-xs text-slate-400 font-normal">/hr</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ToggleSwitch
                          isChecked={court.is_active}
                          onToggle={() => handleToggleCourt(court)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button onClick={() => setViewingCourt(court)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEditClick(court)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Edit Court">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(court.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Court">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCourts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center">
                          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="font-medium">No courts found</p>
                          <p className="text-sm text-slate-400">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {filteredCourts.map((court) => (
                <div key={court.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                        {court.images && court.images.length > 0 ? (
                          <img src={court.images[0]} alt={court.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-slate-50">
                            <Trophy className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{court.name}</h4>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                          {court.game_type?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex">
                      <button onClick={() => setViewingCourt(court)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-bold uppercase">Branch</span>
                      <span className="font-medium text-slate-800">{court.branch?.name} ({court.branch?.city?.short_code})</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-bold uppercase">Price</span>
                      <span className="font-medium text-green-600">₹{court.price_per_hour || court.default_price}/hr</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                      <ToggleSwitch
                        isChecked={court.is_active}
                        onToggle={() => handleToggleCourt(court)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(court)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(court.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCourts.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="font-medium">No courts found</p>
                    <p className="text-sm text-slate-400">Try adjusting your filters</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Drawer for Add/Edit */}
      <Drawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingCourt ? 'Edit Court Details' : 'Add New Court'}
      >
        <AddCourtForm
          onCancel={() => setShowDrawer(false)}
          onSuccess={handleFormSuccess}
          initialData={editingCourt}
        />
      </Drawer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub-components (View Modal, Global Conditions, etc.)
// ----------------------------------------------------------------------

function CourtViewModal({ court, onClose }) {
  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">View Court Details</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Images & Videos Gallery */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {(!court.images?.length && !court.videos?.length) && (
              <div className="w-full h-64 bg-green-50 rounded-xl flex items-center justify-center border-2 border-dashed border-green-100 flex-shrink-0">
                <Play className="h-16 w-16 text-green-200" />
              </div>
            )}
            {court.images?.map((img, idx) => (
              <div key={`img-${idx}`} className="h-64 aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0 snap-center">
                <img src={`${IMAGE_BASE_URL}${img}`} alt={`Court ${idx}`} className="w-full h-full object-cover" onError={(e) => { e.target.closest('div').style.display = 'none'; }} />
              </div>
            ))}
            {court.videos?.map((vid, idx) => (
              <div key={`vid-${idx}`} className="h-64 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black flex-shrink-0 snap-center">
                <video src={`${IMAGE_BASE_URL}${vid}`} className="w-full h-full object-cover" controls onError={(e) => { e.target.closest('div').style.display = 'none'; }} />
              </div>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b pb-2">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Name</label>
                <p className="font-medium text-slate-900">{court.name}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Sport</label>
                <p className="font-medium text-slate-900">{court.game_type?.name}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Price</label>
                <p className="font-medium text-green-700">₹{court.price_per_hour || court.default_price}/hr</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b pb-2">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Branch</label>
                <p className="font-medium text-slate-900">{court.branch?.name}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">City</label>
                <p className="font-medium text-slate-900">{court.branch?.city?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span className="text-sm font-medium text-slate-700">Current Status:</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${court.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {court.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}


function GlobalPriceConditionsSection({ conditions, onRefresh, onEdit, editingCondition }) {
  // Note: Reusing the same logic as before, just ensuring styling matches
  const [isAdding, setIsAdding] = useState(false);
  const [conditionType, setConditionType] = useState('recurring');
  const [newCondition, setNewCondition] = useState({
    days: [],
    dates: [],
    slotFrom: '06:00',
    slotTo: '07:00',
    price: ''
  });
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (editingCondition) {
      setIsAdding(true);
      setConditionType(editingCondition.condition_type || 'recurring');
      setNewCondition({
        days: editingCondition.days || [],
        dates: editingCondition.dates || [],
        slotFrom: editingCondition.slot_from,
        slotTo: editingCondition.slot_to,
        price: editingCondition.price
      });
    }
  }, [editingCondition]);

  const daysOfWeek = [
    { id: 'mon', label: 'Mon' }, { id: 'tue', label: 'Tue' }, { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' }, { id: 'fri', label: 'Fri' }, { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' }
  ];

  const toggleDay = (dayId) => {
    setNewCondition(prev => ({
      ...prev,
      days: prev.days.includes(dayId) ? prev.days.filter(d => d !== dayId) : [...prev.days, dayId]
    }));
  };

  const addDate = () => {
    if (selectedDate && !newCondition.dates.includes(selectedDate)) {
      setNewCondition(prev => ({ ...prev, dates: [...prev.dates, selectedDate] }));
      setSelectedDate('');
    }
  };

  const removeDate = (dateToRemove) => setNewCondition(prev => ({ ...prev, dates: prev.dates.filter(d => d !== dateToRemove) }));

  const handleSave = async () => {
    if (conditionType === 'recurring' && (!newCondition.days || newCondition.days.length === 0)) return alert('Select days');
    if (conditionType === 'date' && (!newCondition.dates || newCondition.dates.length === 0)) return alert('Select dates');
    if (!newCondition.price || !newCondition.slotFrom || !newCondition.slotTo) return alert('Fill all fields');

    try {
      const data = {
        condition_type: conditionType,
        days: conditionType === 'recurring' ? newCondition.days : [],
        dates: conditionType === 'date' ? newCondition.dates : [],
        slot_from: newCondition.slotFrom,
        slot_to: newCondition.slotTo,
        price: newCondition.price
      };

      if (editingCondition) {
        await globalPriceConditionsApi.update(editingCondition.id, data);
        await globalPriceConditionsApi.applyToAllCourts();
      } else {
        await globalPriceConditionsApi.create(data.days, data.dates, data.slot_from, data.slot_to, data.price, data.condition_type);
        await globalPriceConditionsApi.applyToAllCourts();
      }

      setNewCondition({ days: [], dates: [], slotFrom: '06:00', slotTo: '07:00', price: '' });
      setConditionType('recurring');
      setIsAdding(false);
      onEdit(null);
      onRefresh();
    } catch (err) {
      alert('Failed to save global condition: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this condition?')) {
      try {
        await globalPriceConditionsApi.delete(id);
        onRefresh();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {!isAdding && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conditions.map(condition => (
            <div key={condition.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{condition.condition_type}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(condition)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(condition.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mb-3">
                {condition.condition_type === 'recurring' ? (
                  <div className="flex flex-wrap gap-1">
                    {condition.days.map(d => <span key={d} className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{d}</span>)}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {condition.dates.map(d => <span key={d} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{new Date(d).toLocaleDateString()}</span>)}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                <div>
                  <p className="text-xs text-slate-400">Time Slot</p>
                  <p className="text-sm font-semibold text-slate-700">{condition.slot_from} - {condition.slot_to}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Price</p>
                  <p className="text-lg font-bold text-green-600">₹{condition.price}</p>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-green-600 hover:border-green-300 hover:bg-green-50/30 transition-all min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white"><Plus className="h-5 w-5" /></div>
            <span className="text-sm font-semibold">Add New Rule</span>
          </button>
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">{editingCondition ? 'Edit Pricing Rule' : 'New Pricing Rule'}</h3>
            <button onClick={() => { setIsAdding(false); onEdit(null); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rule Type</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button onClick={() => setConditionType('recurring')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${conditionType === 'recurring' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Recurring Days</button>
                  <button onClick={() => setConditionType('date')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${conditionType === 'date' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Specific Dates</button>
                </div>
              </div>

              {conditionType === 'recurring' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`w-10 h-10 rounded-lg text-xs font-bold uppercase transition-all ${newCondition.days.includes(day.id) ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'bg-white border border-slate-200 text-slate-500 hover:border-green-400'}`}
                      >
                        {day.label.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {conditionType === 'date' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selected Dates</label>
                  <div className="flex gap-2">
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500" />
                    <button onClick={addDate} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newCondition.dates.map(date => (
                      <span key={date} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                        {date}
                        <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => removeDate(date)} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">From</label>
                  <input type="time" value={newCondition.slotFrom} onChange={(e) => setNewCondition({ ...newCondition, slotFrom: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">To</label>
                  <input type="time" value={newCondition.slotTo} onChange={(e) => setNewCondition({ ...newCondition, slotTo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:border-green-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Override Price (₹)</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input type="number" value={newCondition.price} onChange={(e) => setNewCondition({ ...newCondition, price: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-900 focus:border-green-500 outline-none" placeholder="0.00" />
                </div>
              </div>

              <button onClick={handleSave} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-transform active:scale-95">
                {editingCondition ? 'Update Rule' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourtsSettings;
