import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Building2, Users, Edit3, Save, X, Trash2, Plus, Edit2 } from 'lucide-react';
import { courtsApi, branchesApi, citiesApi } from '../../services/adminApi';
import Layout from '../Layout';
import Modal from './Modal';

// Helper function to format time from 24-hour to 12-hour with AM/PM
function formatTime12Hour(time24) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

function CourtSlotsCalendar() {
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null); // Used for popup editing
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState({});

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [masterSlots, setMasterSlots] = useState({}); // Aggregated slots from all courts

  // Edit State
  const [editingSlot, setEditingSlot] = useState(null); // Slot being edited in modal
  const [isAddingNew, setIsAddingNew] = useState(false); // Adding new slot in modal
  const [tempEditData, setTempEditData] = useState({});

  const [globalConditions, setGlobalConditions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (bulkEditMode) {
      loadMasterSlots();
    } else if (selectedCourt) {
      loadCourtSlots();
    }
  }, [selectedCourt, currentMonth, bulkEditMode, courts, globalConditions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Dynamically import to avoid circular dependency issues if any, or just strictly use the api
      const { globalPriceConditionsApi } = await import('../../services/adminApi');

      const [courtsData, branchesData, citiesData, globalConditionsData] = await Promise.all([
        courtsApi.getAll(),
        branchesApi.getAll(),
        citiesApi.getAll(),
        globalPriceConditionsApi.getAll()
      ]);
      setCourts(courtsData);
      setBranches(branchesData);
      setCities(citiesData);
      setGlobalConditions(globalConditionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterSlots = () => {
    // ... (Use existing logic for aggregating slots)
    // Aggregate slots from all courts to show default slots for all dates
    const slotsByDate = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get all active courts (optionally filtered)
    const filteredCourts = courts.filter(court => {
      if (!court.is_active) return false;
      if (selectedBranchId && String(court.branch_id) !== String(selectedBranchId)) return false;
      if (selectedCityId) {
        const branch = branches.find(b => String(b.id) === String(court.branch_id));
        if (!branch || String(branch.city_id) !== String(selectedCityId)) return false;
      }
      return true;
    });

    // Build slots for each date by aggregating from all courts
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const aggregatedSlots = {};

      // Process each court's slots
      filteredCourts.forEach(court => {
        let priceConditions = court.price_conditions || [];
        if (typeof priceConditions === 'string') {
          try { priceConditions = JSON.parse(priceConditions); } catch (e) { priceConditions = []; }
        }

        // Merge global conditions
        const formattedGlobalConditions = globalConditions.map(gc => ({
          ...gc,
          days: gc.days || (gc.condition_type === 'recurring' ? gc.days : []),
          dates: gc.dates || (gc.condition_type === 'date' ? gc.dates : []),
          slotFrom: gc.slot_from,
          slotTo: gc.slot_to,
          price: gc.price
        }));

        const allConditions = [...formattedGlobalConditions, ...priceConditions];

        const recurringSlots = allConditions.filter(pc => pc.days && pc.days.includes(dayOfWeek));
        const dateSpecificSlots = allConditions.filter(pc => pc.dates && pc.dates.includes(dateKey));

        [...recurringSlots, ...dateSpecificSlots].forEach(slot => {
          // Robust check for different property conventions
          const slotFrom = slot.slotFrom || slot.slot_from || slot.start || slot.startTime || slot.start_time || slot.from || '';
          const slotTo = slot.slotTo || slot.slot_to || slot.end || slot.endTime || slot.end_time || slot.to || '';
          const maxPrice = slot.price || slot.price_per_hour || slot.cost || court.price_per_hour;

          const slotKey = `${slotFrom}-${slotTo}`;
          if (slotKey && slotFrom && slotTo) {
            if (!aggregatedSlots[slotKey]) {
              aggregatedSlots[slotKey] = {
                slotFrom,
                slotTo,
                price: maxPrice,
                courts: []
              };
            }
            aggregatedSlots[slotKey].courts.push(court.id);
          }
        });
      });

      slotsByDate[dateKey] = Object.values(aggregatedSlots).map((slot, idx) => ({
        id: `${dateKey}-${slot.slotFrom}-${slot.slotTo}-${idx}`,
        slotFrom: slot.slotFrom,
        slotTo: slot.slotTo,
        price: slot.price,
        courtCount: slot.courts.length,
        isDateSpecific: false
      }));
    }

    setMasterSlots(slotsByDate);
  };

  const loadCourtSlots = () => {
    if (!selectedCourt) return;

    let priceConditions = selectedCourt.price_conditions || [];
    if (typeof priceConditions === 'string') {
      try { priceConditions = JSON.parse(priceConditions); } catch (e) { priceConditions = []; }
    }

    // Merge global conditions
    const formattedGlobalConditions = globalConditions.map(gc => ({
      ...gc,
      days: gc.days || (gc.condition_type === 'recurring' ? gc.days : []),
      dates: gc.dates || (gc.condition_type === 'date' ? gc.dates : []),
      slotFrom: gc.slot_from,
      slotTo: gc.slot_to,
      price: gc.price
    }));

    const allConditions = [...formattedGlobalConditions, ...priceConditions];

    const recurringSlots = allConditions.filter(pc => !pc.dates || pc.dates.length === 0);
    const dateSpecificSlots = allConditions.filter(pc => pc.dates && pc.dates.length > 0);

    const slotsByDate = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const recurringDaySlots = recurringSlots.filter(pc => pc.days && pc.days.includes(dayOfWeek));
      const dateSpecificDaySlots = dateSpecificSlots.filter(pc => pc.dates && pc.dates.includes(dateKey));

      const allDaySlots = [...recurringDaySlots, ...dateSpecificDaySlots];

      slotsByDate[dateKey] = allDaySlots.map(slot => {
        // Robust check for different property conventions
        const slotFrom = slot.slotFrom || slot.slot_from || slot.start || slot.startTime || slot.start_time || slot.from || '';
        const slotTo = slot.slotTo || slot.slot_to || slot.end || slot.endTime || slot.end_time || slot.to || '';
        const price = slot.price || slot.price_per_hour || slot.cost || selectedCourt.price_per_hour;

        return {
          ...slot,
          slotFrom,
          slotTo,
          price,
          id: slot.id || `${dateKey}-${slotFrom}-${slotTo}`,
          isDateSpecific: slot.dates && slot.dates.length > 0
        };
      });
    }

    setSlots(slotsByDate);
  };

  const updateSlots = (updatedSlots) => {
    // Helper to update state locally before saving logic would apply
    if (bulkEditMode) setMasterSlots(updatedSlots);
    else setSlots(updatedSlots);
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const getDateKey = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Modal Actions ---

  const handleDayClick = (date) => {
    if (!selectedCourt && !bulkEditMode) return;
    setSelectedDate(date);
    // Just set selected date, user can then click a slot to edit or "add"
  };

  const openSlotEdit = (date, slot) => {
    setSelectedDate(date);
    setEditingSlot(slot);
    setTempEditData({
      slotFrom: slot.slotFrom,
      slotTo: slot.slotTo,
      price: slot.price
    });
    setIsAddingNew(false);
  };

  const openAddSlot = (date) => {
    setSelectedDate(date);
    setEditingSlot(null);
    setTempEditData({
      slotFrom: '09:00',
      slotTo: '10:00',
      price: selectedCourt?.price_per_hour || ''
    });
    setIsAddingNew(true);
  };

  const handleCommitChange = async () => {
    if (!selectedDate) return;
    const dateKey = getDateKey(selectedDate);

    try {
      if (bulkEditMode) {
        // Bulk update is simpler as it pushes a specific override to all matching courts
        await courtsApi.bulkUpdateSlots(
          dateKey,
          tempEditData.slotFrom,
          tempEditData.slotTo,
          tempEditData.price,
          selectedBranchId || null,
          null
        );
        // Full refresh to ensure consistency
        await fetchData();
        loadMasterSlots();
        closeModal();
      } else {
        // Single Court Logic - Need to handle Price Condition Array manually
        // 1. Get fresh copy of conditions
        let existingConditions = [];
        try {
          // We use courts.find to ensure we aren't using stale state if possible, though selectedCourt should be okay if we update it
          const freshCourt = courts.find(c => c.id === selectedCourt.id) || selectedCourt;
          existingConditions = typeof freshCourt.price_conditions === 'string'
            ? JSON.parse(freshCourt.price_conditions)
            : (freshCourt.price_conditions || []);
        } catch (e) { existingConditions = []; }

        let updatedConditions = [...existingConditions];

        // 2. Identify if we are UPDATING an existing date-specific rule or ADDING a new one
        if (!isAddingNew && editingSlot && editingSlot.isDateSpecific) {
          // We are editing an existing override. We need to find it and replace it.
          // But 'editingSlot.id' might be synthetic.
          // Strategy: Find a condition that matches the DATE and the OLD TIME.
          // If ID matches, great. If not, match by properties.

          const originalFrom = editingSlot.slotFrom;
          const originalTo = editingSlot.slotTo;

          // Filter OUT the old one
          updatedConditions = updatedConditions.filter(pc => {
            // Keep if it DOESN'T match the one we are editing
            const isMatch = pc.dates && pc.dates.includes(dateKey) && pc.slotFrom === originalFrom && pc.slotTo === originalTo;
            return !isMatch;
          });
        }

        // 3. Add the NEW/UPDATED condition
        // We always add a new Condition object for this specific date override
        const newCondition = {
          id: Date.now(), // Generate new ID
          type: 'date',
          dates: [dateKey],
          slotFrom: tempEditData.slotFrom,
          slotTo: tempEditData.slotTo,
          price: tempEditData.price
        };

        updatedConditions.push(newCondition);

        const formData = new FormData();
        formData.append('name', selectedCourt.name);
        formData.append('branch_id', selectedCourt.branch_id);
        formData.append('game_type_id', selectedCourt.game_type_id);
        formData.append('price_per_hour', selectedCourt.price_per_hour);
        formData.append('is_active', selectedCourt.is_active);
        formData.append('price_conditions', JSON.stringify(updatedConditions));

        await courtsApi.update(selectedCourt.id, formData);

        // 4. Update local state immediately to avoid "stale" feeling before refresh
        // This is critical. We need to update `courts` array and `selectedCourt`
        const updatedCourt = { ...selectedCourt, price_conditions: updatedConditions };
        setSelectedCourt(updatedCourt);
        setCourts(prev => prev.map(c => c.id === updatedCourt.id ? updatedCourt : c)); // Update global list

        // Re-calculate slots view
        // We can't easily call loadCourtSlots because it relies on state that might not be flushed.
        // So we manually trigger it next render or simple re-fetch

        // Force Refetch for safety
        const refreshedCourt = await courtsApi.getById(selectedCourt.id);
        setSelectedCourt(refreshedCourt);
        setCourts(prev => prev.map(c => c.id === refreshedCourt.id ? refreshedCourt : c));

        closeModal();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedDate || !editingSlot) return;
    const dateKey = getDateKey(selectedDate);

    try {
      if (bulkEditMode) {
        // Bulk delete: update slots with price 0 or remove override?
        // Actually, for bulk update, we might just want to remove the specific override for this time.
        // But existing bulkUpdateSlots logic adds/updates.
        // We need a way to DELETE.
        // For now, let's assume 'delete' means 'reset to default'.
        // If we send price=null or something?
        // The API might not support true delete in bulk mode easily without a specific flag.
        // Let's alert user that bulk delete isn't fully supported or implement a "remove" flag if backend supports.
        // Assuming we can just skip this for now or try sending empty values?
        alert("Bulk delete not fully supported yet.");
        return;
      }

      // Single Court Delete
      let existingConditions = [];
      try {
        const freshCourt = courts.find(c => c.id === selectedCourt.id) || selectedCourt;
        existingConditions = typeof freshCourt.price_conditions === 'string'
          ? JSON.parse(freshCourt.price_conditions)
          : (freshCourt.price_conditions || []);
      } catch (e) { existingConditions = []; }

      // Filter out the slot we are deleting
      const originalFrom = editingSlot.slotFrom;
      const originalTo = editingSlot.slotTo;

      const updatedConditions = existingConditions.filter(pc => {
        // We want to REMOVE the one that matches this date and time
        const isMatch = pc.dates && pc.dates.includes(dateKey) && pc.slotFrom === originalFrom && pc.slotTo === originalTo;
        return !isMatch;
      });

      const formData = new FormData();
      formData.append('name', selectedCourt.name);
      formData.append('branch_id', selectedCourt.branch_id);
      formData.append('game_type_id', selectedCourt.game_type_id);
      formData.append('price_per_hour', selectedCourt.price_per_hour);
      formData.append('is_active', selectedCourt.is_active);
      formData.append('price_conditions', JSON.stringify(updatedConditions));

      await courtsApi.update(selectedCourt.id, formData);

      // Update local state
      const updatedCourt = { ...selectedCourt, price_conditions: updatedConditions };
      setSelectedCourt(updatedCourt);
      setCourts(prev => prev.map(c => c.id === updatedCourt.id ? updatedCourt : c));

      // Refetch to be sure
      const refreshedCourt = await courtsApi.getById(selectedCourt.id);
      setSelectedCourt(refreshedCourt);
      setCourts(prev => prev.map(c => c.id === refreshedCourt.id ? refreshedCourt : c));

      closeModal();
    } catch (err) {
      console.error("Failed to delete slot:", err);
      alert("Failed to delete slot. Please try again.");
    }
  };

  const closeModal = () => {
    setEditingSlot(null);
    setIsAddingNew(false);
    // Don't clear selectedDate immediately to avoid flash
  };

  const filteredBranches = selectedCityId
    ? branches.filter(branch => String(branch.city_id) === String(selectedCityId))
    : branches;

  const filteredCourts = courts.filter(court => {
    if (!court.is_active) return false;
    const branchMatch = selectedBranchId ? String(court.branch_id) === String(selectedBranchId) : true;
    if (selectedCityId) {
      const branch = branches.find(b => String(b.id) === String(court.branch_id));
      if (!branch || String(branch.city_id) !== String(selectedCityId)) return false;
    }
    return branchMatch;
  });

  const displaySlots = bulkEditMode ? masterSlots : slots;

  return (
    <Layout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6 text-green-600" />
              Waitlist & Slots Calendar
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage availability and overrides across your venues.</p>
          </div>

          <label className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer ${bulkEditMode ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${bulkEditMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${bulkEditMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <input type="checkbox" checked={bulkEditMode} onChange={(e) => { setBulkEditMode(e.target.checked); setSelectedCourt(null); }} className="hidden" />
            <div className="flex flex-col">
              <span className={`text-sm font-bold ${bulkEditMode ? 'text-indigo-900' : 'text-slate-700'}`}>Bulk Edit Mode</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Apply to all matching courts</span>
            </div>
          </label>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-2">
          <div className="flex-1 w-full md:w-auto relative group">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-green-600" />
            <select
              value={selectedCityId}
              onChange={(e) => { setSelectedCityId(e.target.value); setSelectedBranchId(''); setSelectedCourt(null); }}
              className="w-full pl-9 pr-4 py-2 bg-transparent rounded-lg font-medium text-slate-700 outline-none focus:bg-slate-50 hover:bg-slate-50 transition-colors"
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden md:block" />
          <div className="flex-1 w-full md:w-auto relative group">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-green-600" />
            <select
              value={selectedBranchId}
              onChange={(e) => { setSelectedBranchId(e.target.value); setSelectedCourt(null); }}
              className="w-full pl-9 pr-4 py-2 bg-transparent rounded-lg font-medium text-slate-700 outline-none focus:bg-slate-50 hover:bg-slate-50 transition-colors"
              disabled={!selectedCityId && !bulkEditMode}
            >
              <option value="">All Branches</option>
              {filteredBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {!bulkEditMode && (
            <>
              <div className="w-px h-8 bg-slate-200 hidden md:block" />
              <div className="flex-[2] w-full md:w-auto relative group">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-green-600" />
                <select
                  value={selectedCourt?.id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Loose comparison or string conversion to find the court
                    setSelectedCourt(courts.find(c => String(c.id) === String(val)));
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-transparent rounded-lg font-bold text-slate-900 outline-none focus:bg-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <option value="">Select Court to Manage...</option>
                  {filteredCourts.map(c => <option key={c.id} value={c.id}>{c.name} ({branches.find(b => b.id === c.branch_id)?.name})</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Content Area */}
        {(selectedCourt || bulkEditMode) ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronRight className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-2 lg:gap-4">
                {getDaysInMonth().map((date, idx) => {
                  if (!date) return <div key={`empty-${idx}`} />;

                  const dateKey = getDateKey(date);
                  const daySlots = displaySlots[dateKey] || [];
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={dateKey}
                      onClick={() => handleDayClick(date)}
                      className={`min-h-[120px] bg-white border rounded-xl p-3 transition-all cursor-pointer group hover:shadow-md ${isToday ? 'border-green-500 ring-1 ring-green-500 shadow-sm' : 'border-slate-200 hover:border-green-400'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold ${isToday ? 'text-green-600' : 'text-slate-700'}`}>{date.getDate()}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); openAddSlot(date); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {daySlots.slice(0, 3).map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={(e) => { e.stopPropagation(); openSlotEdit(date, slot); }}
                            className={`text-[10px] font-semibold px-2 py-1 rounded-md border truncate transition-colors ${slot.isDateSpecific
                              ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
                              : (bulkEditMode ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100' : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100')
                              }`}
                          >
                            {formatTime12Hour(slot.slotFrom)} - ₹{slot.price}
                          </div>
                        ))}
                        {daySlots.length > 3 && (
                          <div className="text-[10px] text-slate-400 font-bold pl-1">+{daySlots.length - 3} more</div>
                        )}
                        {daySlots.length === 0 && (
                          <div className="h-full flex items-center justify-center text-[10px] text-slate-300 font-medium italic pt-4">No Slots</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-2xl border border-slate-200 border-dashed text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Calendar Selected</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Select a City and Venue above to view availability, or toggle <span className="font-bold text-indigo-600">Bulk Edit Mode</span> to manage across all locations.</p>
          </div>
        )}
      </div>

      {/* --- Edit Modal --- */}
      {(editingSlot || isAddingNew) && selectedDate && (
        <Modal title={isAddingNew ? `Add Slot on ${selectedDate.toDateString()}` : `Edit Slot (${formatTime12Hour(tempEditData.slotFrom)})`} onClose={closeModal}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start</label>
                <LocalTimePicker value={tempEditData.slotFrom} onChange={v => setTempEditData(p => ({ ...p, slotFrom: v }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End</label>
                <LocalTimePicker value={tempEditData.slotTo} onChange={v => setTempEditData(p => ({ ...p, slotTo: v }))} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={tempEditData.price}
                  onChange={e => setTempEditData(p => ({ ...p, price: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 border-2 border-slate-200 rounded-lg font-bold text-slate-900 focus:border-green-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              {!isAddingNew && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this slot override? This will revert to default recurring slots if any.')) {
                      await handleDeleteSlot();
                    }
                  }}
                  className="px-4 py-2 border border-red-100 text-red-600 font-bold rounded-lg hover:bg-red-50"
                >
                  Delete Override
                </button>
              )}
              <div className="flex-1" />
              <button onClick={closeModal} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
              <button
                onClick={handleCommitChange}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md shadow-green-200"
              >
                {isAddingNew ? 'Add Slot' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

// ... (LocalTimePicker remains the same)

// Minimal Local TimePicker to avoid circular deps if needed, or consistent style
const LocalTimePicker = ({ value, onChange }) => {
  // Robust Time Parsing
  const parseTime = (val) => {
    if (!val) return { h: 9, m: '00', ampm: 'AM' };
    // Handle "09:00", "9:00", "09:00:00"
    const parts = val.split(':');
    let h = parseInt(parts[0] || '9', 10);
    const m = (parts[1] || '00').substring(0, 2); // Ensure 2 chars
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { h, m, ampm };
  };

  const { h, m, ampm } = parseTime(value);

  const update = (nH, nM, nAmpm) => {
    let fitH = parseInt(nH, 10);
    if (nAmpm === 'PM' && fitH !== 12) {
      fitH = (fitH + 12);
      if (fitH === 24) fitH = 0; // Handle midnight edge case if any, though 12PM is 12. 12AM is 0.
    }
    if (nAmpm === 'AM' && fitH === 12) fitH = 0;

    // Ensure we don't accidentally set 24:00
    if (fitH === 24) fitH = 0;

    onChange(`${fitH.toString().padStart(2, '0')}:${nM}`);
  };

  return (
    <div className="flex gap-1">
      <select value={h} onChange={e => update(e.target.value, m, ampm)} className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm outline-none focus:border-green-500 text-center cursor-pointer hover:bg-slate-100 transition-colors">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="self-center font-bold text-slate-300">:</span>
      <select value={m} onChange={e => update(h, e.target.value, ampm)} className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm outline-none focus:border-green-500 text-center cursor-pointer hover:bg-slate-100 transition-colors">
        {['00', '15', '30', '45'].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <select value={ampm} onChange={e => update(h, m, e.target.value)} className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm outline-none focus:border-green-500 text-center cursor-pointer hover:bg-slate-100 transition-colors">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default CourtSlotsCalendar;
