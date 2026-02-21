import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Building2, Users, Edit3, Save, X, Trash2, Plus, Edit2, Settings } from 'lucide-react';
import { courtsApi, branchesApi, citiesApi } from '../../services/adminApi';
import Layout from '../Layout';
import Modal from './Modal';
import ToggleSwitch from './ToggleSwitch';

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
  const [showDayDetail, setShowDayDetail] = useState(false);

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

    // Build slots for each date by aggregating
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeekFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      const dayOfWeekShort = dayOfWeekFull.toLowerCase().substring(0, 3);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const aggregatedSlots = {};

      // In Bulk Mode, we only want to show OVERRIDES (Template view)
      // This makes it a "Separate Calendar" for adjustments
      filteredCourts.forEach(court => {
        let priceConditions = court.price_conditions || [];
        if (typeof priceConditions === 'string') {
          try { priceConditions = JSON.parse(priceConditions); } catch (e) { priceConditions = []; }
        }

        const formattedGlobalConditions = globalConditions.map(gc => ({
          ...gc,
          days: gc.days || (gc.condition_type === 'recurring' ? gc.days : []),
          dates: gc.dates || (gc.condition_type === 'date' ? gc.dates : []),
          slotFrom: gc.slot_from,
          slotTo: gc.slot_to,
          price: gc.price
        }));

        const allConditions = [...formattedGlobalConditions, ...priceConditions];

        // Filter ONLY date-specific overrides for Bulk Mode display
        const dateSpecificSlots = allConditions.filter(pc => pc.dates && pc.dates.includes(dateKey));

        dateSpecificSlots.forEach(cond => {
          const condFrom = cond.slotFrom || cond.slot_from || '';
          const condTo = cond.slotTo || cond.slot_to || '';
          const condPrice = cond.price || cond.price_per_hour || court.price_per_hour;

          if (condFrom && condTo) {
            const startH = parseInt(condFrom.split(':')[0]);
            const endH = parseInt(condTo.split(':')[0]);

            for (let h = startH; h < endH; h++) {
              const sFrom = `${String(h).padStart(2, '0')}:00`;
              const sTo = `${String(h + 1).padStart(2, '0')}:00`;
              const slotKey = `${sFrom}-${sTo}`;

              if (!aggregatedSlots[slotKey]) {
                aggregatedSlots[slotKey] = {
                  slotFrom: sFrom,
                  slotTo: sTo,
                  price: condPrice,
                  courts: [],
                  isDateSpecific: true,
                  isOverride: true
                };
              }
              if (!aggregatedSlots[slotKey].courts.includes(court.id)) {
                aggregatedSlots[slotKey].courts.push(court.id);
              }
            }
          }
        });
      });

      slotsByDate[dateKey] = Object.values(aggregatedSlots)
        .sort((a, b) => a.slotFrom.localeCompare(b.slotFrom))
        .map((slot, idx) => ({
          id: `${dateKey}-${slot.slotFrom}-${slot.slotTo}-${idx}`,
          slotFrom: slot.slotFrom,
          slotTo: slot.slotTo,
          price: slot.price,
          courtCount: slot.courts.length,
          isDateSpecific: slot.isDateSpecific,
          isOverride: slot.isOverride
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
      const dayOfWeekShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
      const dayOfWeekFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const branch = branches.find(b => String(b.id) === String(selectedCourt.branch_id));
      const openingHours = branch ? (typeof branch.opening_hours === 'string' ? JSON.parse(branch.opening_hours) : branch.opening_hours) : {};
      const dayConfig = (openingHours && openingHours[dayOfWeekFull]) || {};

      let daySlots = [];

      // 1. Generate Base Slots from Branch Opening Hours
      if (dayConfig.isActive && dayConfig.open && dayConfig.close) {
        try {
          const startH = parseInt(dayConfig.open.split(':')[0]);
          const endH = parseInt(dayConfig.close.split(':')[0]);
          for (let h = startH; h < endH; h++) {
            daySlots.push({
              id: `${dateKey}-${h}`,
              slotFrom: `${String(h).padStart(2, '0')}:00`,
              slotTo: `${String(h + 1).padStart(2, '0')}:00`,
              price: selectedCourt.price_per_hour,
              isDefault: true,
              isDateSpecific: false
            });
          }
        } catch (e) {
          console.error("Error generating base slots", e);
        }
      }

      // 2. Load and Split Overrides
      const activeConditions = allConditions.filter(pc =>
        (pc.dates && pc.dates.includes(dateKey)) ||
        (pc.days && pc.days.includes(dayOfWeekShort))
      );

      activeConditions.forEach(cond => {
        const condFrom = cond.slotFrom || cond.slot_from || '';
        const condTo = cond.slotTo || cond.slot_to || '';
        const condPrice = cond.price || cond.price_per_hour || selectedCourt.price_per_hour;

        if (condFrom && condTo) {
          const startH = parseInt(condFrom.split(':')[0]);
          const endH = parseInt(condTo.split(':')[0]);

          for (let h = startH; h < endH; h++) {
            const sFrom = `${String(h).padStart(2, '0')}:00`;
            const sTo = `${String(h + 1).padStart(2, '0')}:00`;

            const existingIdx = daySlots.findIndex(s => s.slotFrom === sFrom && s.slotTo === sTo);
            const isDateSpecific = !!(cond.dates && cond.dates.includes(dateKey));

            if (existingIdx !== -1) {
              daySlots[existingIdx] = {
                ...daySlots[existingIdx],
                price: condPrice,
                isDefault: false,
                isOverride: true,
                isDateSpecific
              };
            } else {
              daySlots.push({
                id: `${dateKey}-${h}-override`,
                slotFrom: sFrom,
                slotTo: sTo,
                price: condPrice,
                isDefault: false,
                isOverride: true,
                isDateSpecific
              });
            }
          }
        }
      });

      // 3. Filter Unavailability
      let unavailability = selectedCourt.unavailability_slots || [];
      if (typeof unavailability === 'string') {
        try { unavailability = JSON.parse(unavailability); } catch (e) { unavailability = []; }
      }

      const disabledTimes = new Set();
      unavailability.forEach(un => {
        const applies = (un.dates && un.dates.includes(dateKey)) || (un.days && un.days.includes(dayOfWeekShort));
        if (applies && un.times) {
          un.times.forEach(t => {
            const timeMatch = t.split(':')[0] + ':00';
            disabledTimes.add(timeMatch);
          });
        }
      });

      daySlots = daySlots.filter(slot => !disabledTimes.has(slot.slotFrom));

      slotsByDate[dateKey] = daySlots.sort((a, b) => a.slotFrom.localeCompare(b.slotFrom));
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
    setShowDayDetail(true);
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
    setShowDayDetail(false);
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
    setShowDayDetail(false);
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
        const freshCourt = courts.find(c => c.id === selectedCourt.id) || selectedCourt;
        let existingConditions = [];
        try {
          existingConditions = typeof freshCourt.price_conditions === 'string'
            ? JSON.parse(freshCourt.price_conditions)
            : (freshCourt.price_conditions || []);
        } catch (e) { existingConditions = []; }

        let updatedConditions = [...existingConditions];

        // 2. Identify if we are UPDATING an existing date-specific rule or ADDING a new one
        if (!isAddingNew && editingSlot && editingSlot.isDateSpecific) {
          const originalFrom = editingSlot.slotFrom;
          const originalTo = editingSlot.slotTo;

          // Filter OUT the old one
          updatedConditions = updatedConditions.filter(pc => {
            const isMatch = pc.dates && pc.dates.includes(dateKey) && pc.slotFrom === originalFrom && pc.slotTo === originalTo;
            return !isMatch;
          });
        }

        // 3. Add the NEW/UPDATED condition
        const newCondition = {
          id: Date.now(),
          type: 'date',
          dates: [dateKey],
          slotFrom: tempEditData.slotFrom,
          slotTo: tempEditData.slotTo,
          price: tempEditData.price
        };

        updatedConditions.push(newCondition);

        // Preserve & Clean Unavailability (Ensure new/updated slot isn't hidden by a previous delete)
        let updatedUnavailability = [];
        try {
          updatedUnavailability = typeof freshCourt.unavailability_slots === 'string'
            ? JSON.parse(freshCourt.unavailability_slots)
            : (freshCourt.unavailability_slots || []);
        } catch (e) { updatedUnavailability = []; }

        // Remove this specific slot from unavailability if it exists
        updatedUnavailability = updatedUnavailability.filter(un => {
          const isMatch = un.dates && un.dates.includes(dateKey) && un.times && un.times.includes(tempEditData.slotFrom);
          return !isMatch;
        });

        // --- ROBOT STATE PRESERVATION ---
        const formData = new FormData();
        formData.append('name', freshCourt.name);
        formData.append('branch_id', freshCourt.branch_id);
        formData.append('game_type_id', freshCourt.game_type_id);
        formData.append('price_per_hour', freshCourt.price_per_hour);
        formData.append('is_active', freshCourt.is_active);
        formData.append('price_conditions', JSON.stringify(updatedConditions));
        formData.append('unavailability_slots', JSON.stringify(updatedUnavailability));

        // Preserve Terms
        if (freshCourt.terms_and_conditions) {
          formData.append('terms_and_conditions', freshCourt.terms_and_conditions);
        }

        // Preserve Amenities
        if (freshCourt.amenities) {
          const amData = typeof freshCourt.amenities === 'string' ? freshCourt.amenities : JSON.stringify(freshCourt.amenities);
          formData.append('amenities', amData);
        }

        // Preserve Media
        if (freshCourt.images) {
          const imgs = typeof freshCourt.images === 'string' ? JSON.parse(freshCourt.images) : freshCourt.images;
          imgs.forEach(img => formData.append('existing_images', img));
        }
        if (freshCourt.videos) {
          const vids = typeof freshCourt.videos === 'string' ? JSON.parse(freshCourt.videos) : freshCourt.videos;
          vids.forEach(vid => formData.append('existing_videos', vid));
        }

        await courtsApi.update(selectedCourt.id, formData);

        // 4. Update local state
        const updatedCourt = { ...freshCourt, price_conditions: updatedConditions };
        setSelectedCourt(updatedCourt);
        setCourts(prev => prev.map(c => c.id === updatedCourt.id ? updatedCourt : c));

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
        await courtsApi.bulkDeleteSlots(
          dateKey,
          editingSlot.slotFrom,
          editingSlot.slotTo,
          selectedBranchId || null,
          null
        );
        await fetchData();
        loadMasterSlots();
        closeModal();
        return;
      }

      // Single Court Delete
      const freshCourt = courts.find(c => c.id === selectedCourt.id) || selectedCourt;
      let existingConditions = [];
      try {
        existingConditions = typeof freshCourt.price_conditions === 'string'
          ? JSON.parse(freshCourt.price_conditions)
          : (freshCourt.price_conditions || []);
      } catch (e) { existingConditions = []; }

      let unavailability = [];
      try {
        unavailability = typeof freshCourt.unavailability_slots === 'string'
          ? JSON.parse(freshCourt.unavailability_slots)
          : (freshCourt.unavailability_slots || []);
      } catch (e) { unavailability = []; }

      const originalFrom = editingSlot.slotFrom;
      const originalTo = editingSlot.slotTo;

      // 1. Remove from Overrides (if it was one)
      const updatedConditions = existingConditions.filter(pc => {
        const isMatch = pc.dates && pc.dates.includes(dateKey) && pc.slotFrom === originalFrom && pc.slotTo === originalTo;
        return !isMatch;
      });

      // 2. Add to Unavailability (to hide standard/recurring slots)
      // Check if already in unavailability
      const alreadyUnavailable = unavailability.some(un =>
        un.dates && un.dates.includes(dateKey) && un.times && un.times.includes(originalFrom)
      );

      let updatedUnavailability = [...unavailability];
      if (!alreadyUnavailable) {
        updatedUnavailability.push({
          type: 'date',
          dates: [dateKey],
          times: [originalFrom] // Backend logic uses index/hour often, but front-end filter matches on slotFrom[:hour]
        });
      }

      // --- ROBOT STATE PRESERVATION ---
      const formData = new FormData();
      formData.append('name', freshCourt.name);
      formData.append('branch_id', freshCourt.branch_id);
      formData.append('game_type_id', freshCourt.game_type_id);
      formData.append('price_per_hour', freshCourt.price_per_hour);
      formData.append('is_active', freshCourt.is_active);
      formData.append('price_conditions', JSON.stringify(updatedConditions));
      formData.append('unavailability_slots', JSON.stringify(updatedUnavailability));

      // Preserve Media & Amenities
      if (freshCourt.terms_and_conditions) formData.append('terms_and_conditions', freshCourt.terms_and_conditions);
      if (freshCourt.amenities) {
        const amData = typeof freshCourt.amenities === 'string' ? freshCourt.amenities : JSON.stringify(freshCourt.amenities);
        formData.append('amenities', amData);
      }
      if (freshCourt.images) {
        const imgs = typeof freshCourt.images === 'string' ? JSON.parse(freshCourt.images) : freshCourt.images;
        imgs.forEach(img => formData.append('existing_images', img));
      }
      if (freshCourt.videos) {
        const vids = typeof freshCourt.videos === 'string' ? JSON.parse(freshCourt.videos) : freshCourt.videos;
        vids.forEach(vid => formData.append('existing_videos', vid));
      }

      await courtsApi.update(selectedCourt.id, formData);

      // Update local state
      const updatedCourt = { ...freshCourt, price_conditions: updatedConditions, unavailability_slots: updatedUnavailability };
      setSelectedCourt(updatedCourt);
      setCourts(prev => prev.map(c => c.id === updatedCourt.id ? updatedCourt : c));

      // Refetch for consistency
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
    setShowDayDetail(false);
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

          <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Bulk Edit Mode</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Venue-Wide Manager</span>
            </div>
            <ToggleSwitch
              isChecked={bulkEditMode}
              onToggle={() => {
                setBulkEditMode(!bulkEditMode);
                setSelectedCourt(null);
              }}
            />
          </div>
        </div>

        {/* Filters Bar & Bulk Banner */}
        <div className="space-y-4">
          {bulkEditMode && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-green-100">
                    <Settings className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Venue-Wide Manager Enabled</h3>
                    <p className="text-xs text-slate-500">Creating a slot here will apply it to ALL matching courts in the selected city/branch.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 w-full md:w-auto relative group">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-green-600" />
              <select
                value={selectedCityId}
                onChange={(e) => { setSelectedCityId(e.target.value); setSelectedBranchId(''); setSelectedCourt(null); }}
                className="w-full pl-9 pr-4 py-2 bg-transparent text-slate-700 rounded-lg font-medium outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors"
              >
                <option value="" className="text-slate-900">All Cities</option>
                {cities.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
              </select>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden md:block" />
            <div className="flex-1 w-full md:w-auto relative group">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-green-600" />
              <select
                value={selectedBranchId}
                onChange={(e) => { setSelectedBranchId(e.target.value); setSelectedCourt(null); }}
                className="w-full pl-9 pr-4 py-2 bg-transparent text-slate-700 rounded-lg font-medium outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors"
                disabled={!selectedCityId && !bulkEditMode}
              >
                <option value="" className="text-slate-900">All Branches</option>
                {filteredBranches.map(b => <option key={b.id} value={b.id} className="text-slate-900">{b.name}</option>)}
              </select>
            </div>

            {!bulkEditMode ? (
              <>
                <div className="w-px h-8 bg-slate-200 hidden md:block" />
                <div className="flex-[2] w-full md:w-auto relative group">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-green-600" />
                  <select
                    value={selectedCourt?.id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCourt(courts.find(c => String(c.id) === String(val)));
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-transparent rounded-lg font-bold text-slate-900 outline-none focus:bg-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <option value="">Select Court to Manage...</option>
                    {filteredCourts.map(c => <option key={c.id} value={c.id}>{c.name} ({branches.find(b => b.id === c.branch_id)?.name})</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="flex-[2] px-4 py-2 flex items-center gap-2 font-bold rounded-lg text-green-700 bg-green-50/50">
                <Users className="h-4 w-4" />
                Bulk Template Selected
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {(selectedCourt || bulkEditMode) ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
            {/* Calendar Header */}
            <div className={`flex items-center justify-between p-6 border-b ${bulkEditMode ? 'border-green-100 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-slate-100 bg-white'}`}>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                {bulkEditMode && (
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-green-600 mt-1">
                    <Settings className="h-3 w-3" />
                    Global Overrides Tool
                  </div>
                )}
              </div>
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

                      <div className="space-y-1">
                        {daySlots.slice(0, 6).map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={(e) => { e.stopPropagation(); openSlotEdit(date, slot); }}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border truncate transition-colors ${slot.isDateSpecific
                              ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                              : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                              }`}
                          >
                            {formatTime12Hour(slot.slotFrom)} - {formatTime12Hour(slot.slotTo)}
                          </div>
                        ))}
                        {daySlots.length > 6 && (
                          <div
                            onClick={(e) => { e.stopPropagation(); handleDayClick(date); }}
                            className="text-[9px] text-slate-500 font-bold pl-1 mt-1 uppercase tracking-tighter hover:text-green-600 cursor-pointer transition-colors"
                          >
                            + {daySlots.length - 6} Slots
                          </div>
                        )}
                        {daySlots.length === 0 && (
                          <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-bold italic pt-6">
                            {bulkEditMode ? 'No Overrides' : 'Closed'}
                          </div>
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
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              Select a City and Venue above to view availability, or toggle{' '}
              <button
                onClick={() => setBulkEditMode(true)}
                className="font-bold text-green-600 hover:text-green-700 hover:underline focus:outline-none"
              >
                Bulk Edit Mode
              </button>{' '}
              to manage across all locations.
            </p>
          </div>
        )}
      </div>

      {/* --- Edit Modal --- */}
      {(editingSlot || isAddingNew) && selectedDate && (
        <Modal title={isAddingNew ? `Add Slot on ${selectedDate.toDateString()}` : `Edit Slot (${formatTime12Hour(tempEditData.slotFrom)})`} onClose={closeModal}>
          {/* ... existing edit modal content ... */}
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
                className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition-all ${bulkEditMode
                  ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
                  : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
              >
                {isAddingNew ? 'Add Slot' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- Day Detail Modal --- */}
      {showDayDetail && selectedDate && (
        <Modal
          title={`All Slots for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 gap-2">
                {(bulkEditMode ? masterSlots[getDateKey(selectedDate)] : slots[getDateKey(selectedDate)])?.map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => openSlotEdit(selectedDate, slot)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md ${slot.isDateSpecific
                      ? 'bg-blue-50 border-blue-200 hover:border-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:border-green-500'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${slot.isDateSpecific ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">
                          {formatTime12Hour(slot.slotFrom)} - {formatTime12Hour(slot.slotTo)}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                          {slot.isDateSpecific ? 'Custom Override' : (slot.isDefault ? 'Standard Slot' : 'Recurring Override')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-sm font-black text-slate-900">₹{slot.price}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Price</div>
                      </div>
                      <Edit2 className="h-4 w-4 text-slate-400 group-hover:text-green-600" />
                    </div>
                  </div>
                ))}
                {(!bulkEditMode && (!slots[getDateKey(selectedDate)] || slots[getDateKey(selectedDate)].length === 0)) && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Calendar className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-bold italic">No slots available for this date.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => openAddSlot(selectedDate)}
                className={`w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all shadow-lg ${bulkEditMode
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
              >
                <Plus className="h-5 w-5" />
                Add New Time Slot
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
