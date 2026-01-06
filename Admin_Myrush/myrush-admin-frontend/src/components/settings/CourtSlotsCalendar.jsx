import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, DollarSign, Save, X, Users, Edit3 } from 'lucide-react';
import { courtsApi, branchesApi, citiesApi } from '../../services/adminApi';
import Layout from '../Layout';

function CourtSlotsCalendar() {
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlots, setEditedSlots] = useState({});
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [bulkEditMode, setBulkEditMode] = useState(false); // New: Bulk edit mode
  const [masterSlots, setMasterSlots] = useState({}); // Aggregated slots from all courts

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (bulkEditMode) {
      loadMasterSlots();
    } else if (selectedCourt) {
      loadCourtSlots();
    }
  }, [selectedCourt, currentMonth, bulkEditMode, courts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courtsData, branchesData, citiesData] = await Promise.all([
        courtsApi.getAll(),
        branchesApi.getAll(),
        citiesApi.getAll()
      ]);
      setCourts(courtsData);
      setBranches(branchesData);
      setCities(citiesData);
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
      if (selectedBranchId && court.branch_id !== selectedBranchId) return false;
      if (selectedCityId) {
        const branch = branches.find(b => b.id === court.branch_id);
        if (!branch || branch.city_id !== selectedCityId) return false;
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
          try {
            priceConditions = JSON.parse(priceConditions);
          } catch (e) {
            priceConditions = [];
          }
        }

        // Find recurring slots for this day
        const recurringSlots = priceConditions.filter(pc => 
          pc.days && pc.days.includes(dayOfWeek)
        );

        // Find date-specific slots for this date
        const dateSpecificSlots = priceConditions.filter(pc => 
          pc.dates && pc.dates.includes(dateKey)
        );

        // Combine and aggregate
        [...recurringSlots, ...dateSpecificSlots].forEach(slot => {
          const slotKey = `${slot.slotFrom || ''}-${slot.slotTo || ''}`;
          if (slotKey && slot.slotFrom && slot.slotTo) {
            if (!aggregatedSlots[slotKey]) {
              aggregatedSlots[slotKey] = {
                slotFrom: slot.slotFrom,
                slotTo: slot.slotTo,
                price: slot.price || court.price_per_hour,
                courts: []
              };
            }
            aggregatedSlots[slotKey].courts.push(court.id);
          }
        });
      });

      // Convert to array and use most common price if multiple courts have different prices
      slotsByDate[dateKey] = Object.values(aggregatedSlots).map((slot, idx) => ({
        id: `${dateKey}-${slot.slotFrom}-${slot.slotTo}-${idx}`,
        slotFrom: slot.slotFrom,
        slotTo: slot.slotTo,
        price: slot.price,
        courtCount: slot.courts.length,
        isDateSpecific: false // In bulk mode, we treat all as editable
      }));
    }

    setMasterSlots(slotsByDate);
    setEditedSlots(JSON.parse(JSON.stringify(slotsByDate)));
  };

  const loadCourtSlots = () => {
    if (!selectedCourt) return;
    
    // Parse price_conditions from the court
    let priceConditions = selectedCourt.price_conditions || [];
    if (typeof priceConditions === 'string') {
      try {
        priceConditions = JSON.parse(priceConditions);
      } catch (e) {
        priceConditions = [];
      }
    }

    // Separate recurring (day-based) and date-specific slots
    const recurringSlots = priceConditions.filter(pc => !pc.dates || pc.dates.length === 0);
    const dateSpecificSlots = priceConditions.filter(pc => pc.dates && pc.dates.length > 0);

    // Build slots structure by date
    const slotsByDate = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Find recurring slots that apply to this day of week
      const recurringDaySlots = recurringSlots.filter(pc => 
        pc.days && pc.days.includes(dayOfWeek)
      );

      // Find date-specific slots that apply to this exact date
      const dateSpecificDaySlots = dateSpecificSlots.filter(pc => 
        pc.dates && pc.dates.includes(dateKey)
      );

      // Combine both types of slots
      const allDaySlots = [...recurringDaySlots, ...dateSpecificDaySlots];

      slotsByDate[dateKey] = allDaySlots.map(slot => ({
        ...slot,
        id: slot.id || `${dateKey}-${slot.slotFrom}-${slot.slotTo}`,
        isDateSpecific: slot.dates && slot.dates.length > 0
      }));
    }

    setSlots(slotsByDate);
    setEditedSlots(JSON.parse(JSON.stringify(slotsByDate)));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i <startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

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

  const updateSlotForDate = (dateKey, slotId, field, value) => {
    setEditedSlots(prev => {
      const newSlots = { ...prev };
      if (!newSlots[dateKey]) newSlots[dateKey] = [];
      
      newSlots[dateKey] = newSlots[dateKey].map(slot =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      );
      
      return newSlots;
    });
  };

  const addSlotToDate = (dateKey) => {
    setEditedSlots(prev => {
      const newSlots = { ...prev };
      if (!newSlots[dateKey]) newSlots[dateKey] = [];
      
      // Get default price from first court or use empty
      const defaultPrice = bulkEditMode 
        ? (courts.length > 0 ? courts[0].price_per_hour : '')
        : (selectedCourt?.price_per_hour || selectedCourt?.default_price || '');
      
      const newSlot = {
        id: `${dateKey}-${Date.now()}`,
        days: [],
        slotFrom: '09:00',
        slotTo: '10:00',
        price: defaultPrice
      };
      
      newSlots[dateKey] = [...newSlots[dateKey], newSlot];
      return newSlots;
    });
  };

  const removeSlotFromDate = (dateKey, slotId) => {
    setEditedSlots(prev => {
      const newSlots = { ...prev };
      if (newSlots[dateKey]) {
        newSlots[dateKey] = newSlots[dateKey].filter(slot => slot.id !== slotId);
      }
      return newSlots;
    });
  };

  const saveBulkChanges = async () => {
    if (!isEditing || !selectedDate) return;

    try {
      const dateKey = getDateKey(selectedDate);
      const daySlots = editedSlots[dateKey] || [];

      // Update each slot for the selected date across all courts
      const updatePromises = daySlots.map(slot => 
        courtsApi.bulkUpdateSlots(
          dateKey,
          slot.slotFrom,
          slot.slotTo,
          slot.price,
          selectedBranchId || null,
          null
        )
      );

      await Promise.all(updatePromises);
      
      // Refresh data
      await fetchData();
      loadMasterSlots();
      setIsEditing(false);
      
      alert(`Successfully updated slots for ${daySlots.length} time slot(s) across all courts!`);
    } catch (err) {
      console.error('Error saving bulk slots:', err);
      alert('Failed to save slots. Please try again.');
    }
  };

  const saveChanges = async () => {
    if (bulkEditMode) {
      await saveBulkChanges();
      return;
    }

    if (!selectedCourt) return;

    try {
      // Convert edited slots back to price_conditions format
      // Separate recurring (day-based) and date-specific slots
      const recurringSlotMap = {};
      const dateSpecificSlotMap = {};
      
      Object.keys(editedSlots).forEach(dateKey => {
        const date = new Date(dateKey);
        const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
        
        editedSlots[dateKey].forEach(slot => {
          const slotKey = `${slot.slotFrom}-${slot.slotTo}-${slot.price}`;
          
          // If it's a date-specific slot (was originally date-specific or newly added for specific date)
          if (slot.isDateSpecific || slot.dates) {
            if (!dateSpecificSlotMap[slotKey]) {
              dateSpecificSlotMap[slotKey] = {
                id: Date.now() + Math.random() + Math.random(),
                type: 'date',
                dates: [],
                slotFrom: slot.slotFrom,
                slotTo: slot.slotTo,
                price: slot.price
              };
            }
            if (!dateSpecificSlotMap[slotKey].dates.includes(dateKey)) {
              dateSpecificSlotMap[slotKey].dates.push(dateKey);
            }
          } else {
            // Recurring slot
            if (!recurringSlotMap[slotKey]) {
              recurringSlotMap[slotKey] = {
                id: Date.now() + Math.random(),
                type: 'recurring',
                days: [],
                slotFrom: slot.slotFrom,
                slotTo: slot.slotTo,
                price: slot.price
              };
            }
            if (!recurringSlotMap[slotKey].days.includes(dayOfWeek)) {
              recurringSlotMap[slotKey].days.push(dayOfWeek);
            }
          }
        });
      });

      // Combine both types
      const priceConditions = [
        ...Object.values(recurringSlotMap),
        ...Object.values(dateSpecificSlotMap)
      ];

      const formData = new FormData();
      formData.append('name', selectedCourt.name);
      formData.append('branch_id', selectedCourt.branch_id);
      formData.append('game_type_id', selectedCourt.game_type_id);
      formData.append('price_per_hour', selectedCourt.price_per_hour);
      formData.append('is_active', selectedCourt.is_active);
      formData.append('price_conditions', JSON.stringify(priceConditions));
      
      if (selectedCourt.unavailability_slots) {
        formData.append('unavailability_slots', JSON.stringify(selectedCourt.unavailability_slots));
      }

      await courtsApi.update(selectedCourt.id, formData);
      
      // Refresh court data
      const updatedCourt = await courtsApi.getById(selectedCourt.id);
      setSelectedCourt(updatedCourt);
      setIsEditing(false);
      loadCourtSlots();
      
      alert('Slots updated successfully!');
    } catch (err) {
      console.error('Error saving slots:', err);
      alert('Failed to save slots. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  const displaySlots = bulkEditMode ? masterSlots : slots;
  
  const filteredBranches = selectedCityId
    ? branches.filter(branch => branch.city_id === selectedCityId)
    : branches;
  
  const filteredCourts = courts.filter(court => {
    if (!court.is_active) return false;
    const branchMatch = selectedBranchId ? court.branch_id === selectedBranchId : true;
    if (selectedCityId) {
      const branch = branches.find(b => b.id === court.branch_id);
      if (!branch || branch.city_id !== selectedCityId) return false;
    }
    return branchMatch;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-green-600" />
              Court Slots Calendar
            </h1>
            <p className="mt-1 text-slate-500">
              {bulkEditMode 
                ? 'Bulk Edit Mode: Changes apply to ALL courts' 
                : 'Manage slots, timings, and prices for individual courts'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkEditMode}
                onChange={(e) => {
                  setBulkEditMode(e.target.checked);
                  setSelectedCourt(null);
                  setIsEditing(false);
                }}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <Users className="h-5 w-5" />
                Bulk Edit Mode
              </span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <select
                value={selectedCityId}
                onChange={(e) => {
                  setSelectedCityId(e.target.value);
                  setSelectedBranchId('');
                  setSelectedCourt(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setSelectedCourt(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={!selectedCityId && !bulkEditMode}
              >
                <option value="">All Branches</option>
                {filteredBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            {!bulkEditMode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Court</label>
                <select
                  value={selectedCourt?.id || ''}
                  onChange={(e) => {
                    const court = courts.find(c => c.id === e.target.value);
                    setSelectedCourt(court);
                    setIsEditing(false);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a court</option>
                  {filteredCourts.map(court => (
                    <option key={court.id} value={court.id}>
                      {court.name} - {branches.find(b => b.id === court.branch_id)?.name || 'Unknown Branch'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {bulkEditMode && (
              <div className="flex items-end">
                <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
                  <Users className="h-5 w-5 inline mr-2" />
                  All Courts ({filteredCourts.length})
                </div>
              </div>
            )}
          </div>
        </div>

        {(selectedCourt || bulkEditMode) && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                {bulkEditMode ? (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="h-6 w-6 text-green-600" />
                      Bulk Edit - All Courts
                    </h2>
                    <p className="text-sm text-slate-500">
                      Editing slots for {filteredCourts.length} court(s)
                      {selectedBranchId && ` in selected branch`}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900">{selectedCourt.name}</h2>
                    <p className="text-sm text-slate-500">
                      {branches.find(b => b.id === selectedCourt.branch_id)?.name || 'Unknown Branch'}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        if (bulkEditMode) {
                          setEditedSlots(JSON.parse(JSON.stringify(masterSlots)));
                        } else {
                          setEditedSlots(JSON.parse(JSON.stringify(slots)));
                        }
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4 inline mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={saveChanges}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {bulkEditMode ? 'Save to All Courts' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    {bulkEditMode ? 'Bulk Edit Slots' : 'Edit Slots'}
                  </button>
                )}
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold text-slate-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((date, index) => {
                const dateKey = getDateKey(date);
                const daySlots = isEditing ? (editedSlots[dateKey] || []) : (displaySlots[dateKey] || []);
                const isToday = date && date.toDateString() === new Date().toDateString();
                const isSelected = date && dateKey === getDateKey(selectedDate);

                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                return (
                  <div
                    key={dateKey}
                    className={`aspect-square border rounded-lg p-2 ${
                      isToday ? 'border-green-500 bg-green-50' : 'border-slate-200'
                    } ${isSelected ? 'ring-2 ring-green-500' : ''} ${
                      isEditing ? 'hover:border-green-400 cursor-pointer' : ''
                    } transition-colors`}
                    onClick={() => isEditing && setSelectedDate(date)}
                  >
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {daySlots.slice(0, 2).map(slot => (
                        <div
                          key={slot.id}
                          className={`text-xs rounded px-1 py-0.5 truncate ${
                            bulkEditMode
                              ? 'bg-purple-100 text-purple-800'
                              : slot.isDateSpecific
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                          title={`${slot.slotFrom} - ${slot.slotTo}: ₹${slot.price} ${bulkEditMode ? `(${slot.courtCount || 'all'} courts)` : slot.isDateSpecific ? '(Date-specific)' : '(Recurring)'}`}
                        >
                          <Clock className="h-2 w-2 inline mr-1" />
                          {slot.slotFrom} - {slot.slotTo}
                        </div>
                      ))}
                      {daySlots.length > 2 && (
                        <div className="text-xs text-slate-500">+{daySlots.length - 2} more</div>
                      )}
                      {daySlots.length === 0 && (
                        <div className="text-xs text-slate-400">No slots</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Details */}
            {isEditing && selectedDate && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-900">
                    Slots for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <button
                    onClick={() => addSlotToDate(getDateKey(selectedDate))}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Add Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {(editedSlots[getDateKey(selectedDate)] || []).map(slot => (
                    <div key={slot.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                          <input
                            type="time"
                            value={slot.slotFrom || ''}
                            onChange={(e) => updateSlotForDate(getDateKey(selectedDate), slot.id, 'slotFrom', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                          <input
                            type="time"
                            value={slot.slotTo || ''}
                            onChange={(e) => updateSlotForDate(getDateKey(selectedDate), slot.id, 'slotTo', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Price (₹)</label>
                          <input
                            type="number"
                            value={slot.price || ''}
                            onChange={(e) => updateSlotForDate(getDateKey(selectedDate), slot.id, 'price', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeSlotFromDate(getDateKey(selectedDate), slot.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {(editedSlots[getDateKey(selectedDate)] || []).length === 0 && (
                    <div className="text-center py-4 text-sm text-slate-400">
                      No slots for this day. Click "Add Slot" to add one.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedCourt && !bulkEditMode && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Court or Enable Bulk Edit</h3>
            <p className="text-slate-500">Choose a court from the dropdown above or enable Bulk Edit Mode to manage all courts at once</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CourtSlotsCalendar;

