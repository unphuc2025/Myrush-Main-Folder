import { useState } from 'react';
import { Plus, Trash2, Clock, Calendar, CalendarDays, X, ChevronDown, Check, Edit2 } from 'lucide-react';
import Modal from './Modal';

function SlotCalendar({ slots, onSlotsChange, defaultPrice }) {
  const [activeTab, setActiveTab] = useState('recurring');
  const [selectedDates, setSelectedDates] = useState([]);
  const [newDateSlot, setNewDateSlot] = useState({ from: '09:00', to: '10:00', price: defaultPrice || '' });

  // Edit State
  const [editingSlot, setEditingSlot] = useState(null);
  const [tempEditData, setTempEditData] = useState({});

  const daysOfWeek = [
    { id: 'mon', label: 'Monday', short: 'Mon' },
    { id: 'tue', label: 'Tuesday', short: 'Tue' },
    { id: 'wed', label: 'Wednesday', short: 'Wed' },
    { id: 'thu', label: 'Thursday', short: 'Thu' },
    { id: 'fri', label: 'Friday', short: 'Fri' },
    { id: 'sat', label: 'Saturday', short: 'Sat' },
    { id: 'sun', label: 'Sunday', short: 'Sun' }
  ];

  // Helper Accessors
  const recurringSlots = slots.filter(slot => !slot.dates || slot.dates.length === 0);
  const dateSpecificSlots = slots.filter(slot => slot.dates && slot.dates.length > 0);
  const getDaySlots = (dayId) => recurringSlots.filter(slot => slot.days && slot.days.includes(dayId));

  // --- Actions ---

  const handleAddSlotToDay = (dayId) => {
    const newSlot = {
      id: Date.now() + Math.random(),
      type: 'recurring',
      days: [dayId],
      slotFrom: '09:00',
      slotTo: '10:00',
      price: defaultPrice || ''
    };
    onSlotsChange([...slots, newSlot]);
    // Optionally open edit immediately
    openEditModal(newSlot);
  };

  const handleAddDateSlot = () => {
    if (selectedDates.length === 0) return alert('Select dates first');
    const newSlot = {
      id: Date.now() + Math.random(),
      type: 'date',
      dates: [...selectedDates],
      slotFrom: newDateSlot.from,
      slotTo: newDateSlot.to,
      price: newDateSlot.price
    };
    onSlotsChange([...slots, newSlot]);
    setSelectedDates([]);
  };

  const removeSlot = (slotId) => {
    onSlotsChange(slots.filter(slot => slot.id !== slotId));
    if (editingSlot?.id === slotId) closeEditModal();
  };

  // --- Edit Modal Logic ---

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setTempEditData({
      slotFrom: slot.slotFrom,
      slotTo: slot.slotTo,
      price: slot.price
    });
  };

  const closeEditModal = () => {
    setEditingSlot(null);
    setTempEditData({});
  };

  const saveEditSlot = () => {
    onSlotsChange(slots.map(s =>
      s.id === editingSlot.id
        ? { ...s, ...tempEditData }
        : s
    ));
    closeEditModal();
  };

  // --- Renderers ---

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Switcher */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'recurring' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <CalendarDays className="h-4 w-4" /> Weekly
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dates' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Calendar className="h-4 w-4" /> Specific Dates
          </button>
        </div>
      </div>

      {/* --- RECURRING TAB --- */}
      {activeTab === 'recurring' && (
        <div className="animate-in slide-in-from-left-2 fade-in duration-300 space-y-4">
          {daysOfWeek.map(day => {
            const daySlots = getDaySlots(day.id);
            const isActive = daySlots.length > 0;

            return (
              <div key={day.id} className={`border rounded-xl transition-all ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-200 border-dashed'}`}>
                {/* Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {day.short}
                    </div>
                    <span className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{day.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSlotToDay(day.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-green-600 hover:border-green-200 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>

                {/* Slots Grid */}
                {isActive && (
                  <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {daySlots.map(slot => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        onClick={() => openEditModal(slot)}
                        onDelete={() => removeSlot(slot.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- DATES TAB --- */}
      {activeTab === 'dates' && (
        <div className="animate-in slide-in-from-right-2 fade-in duration-300 space-y-6">
          <div className="bg-white border boundary-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4">Add Special Date Rules</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Date Picker */}
              <div>
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value && !selectedDates.includes(e.target.value)) {
                      setSelectedDates([...selectedDates, e.target.value]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none mb-3"
                />
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {selectedDates.map(date => (
                    <span key={date} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">
                      {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      <button onClick={() => setSelectedDates(selectedDates.filter(d => d !== date))} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* New Slot Data */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Start</label>
                    <TimePicker value={newDateSlot.from} onChange={v => setNewDateSlot({ ...newDateSlot, from: v })} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">End</label>
                    <TimePicker value={newDateSlot.to} onChange={v => setNewDateSlot({ ...newDateSlot, to: v })} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Price Override</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={newDateSlot.price}
                      onChange={e => setNewDateSlot({ ...newDateSlot, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold focus:border-green-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddDateSlot}
                  disabled={selectedDates.length === 0}
                  className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider ml-1">Active Special Dates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dateSpecificSlots.map(slot => (
                <div key={slot.id} className="relative group">
                  <SlotCard
                    slot={slot}
                    onClick={() => openEditModal(slot)}
                    onDelete={() => removeSlot(slot.id)}
                    isDate
                  />
                </div>
              ))}
              {dateSpecificSlots.length === 0 && <p className="text-sm text-slate-400 italic ml-1">No special overriding dates configured.</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingSlot && (
        <Modal title="Edit Time Slot" onClose={closeEditModal}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Time</label>
                <TimePicker
                  value={tempEditData.slotFrom}
                  onChange={v => setTempEditData(prev => ({ ...prev, slotFrom: v }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Time</label>
                <TimePicker
                  value={tempEditData.slotTo}
                  onChange={v => setTempEditData(prev => ({ ...prev, slotTo: v }))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price per Hour</label>
              <div className="relative group">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={tempEditData.price}
                  onChange={(e) => setTempEditData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 border-2 border-slate-200 rounded-lg font-bold text-lg text-slate-900 focus:border-green-500 focus:ring-0 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeEditModal}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditSlot}
                className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <button onClick={() => removeSlot(editingSlot.id)} className="text-red-500 text-sm font-medium hover:text-red-700 flex items-center justify-center gap-1 mx-auto">
                <Trash2 className="h-4 w-4" /> Delete this slot
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

// Sub-components

const SlotCard = ({ slot, onClick, onDelete, isDate }) => (
  <div
    onClick={onClick}
    className={`group relative p-3 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 flex flex-col h-full ${isDate ? 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-100' : 'bg-white border-slate-200 hover:border-green-400 hover:shadow-md hover:shadow-green-50'}`}
  >
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded-full transition-colors z-10"
    >
      <X className="h-3.5 w-3.5" />
    </button>
    <div className="flex justify-between items-start mb-2">
      <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md border ${isDate ? 'bg-white text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
        <Clock className="h-3 w-3" />
        {slot.slotFrom} - {slot.slotTo}
      </div>
    </div>

    {isDate && slot.dates && (
      <div className="flex flex-wrap gap-1 mb-3 flex-1">
        {slot.dates.slice(0, 3).map(d => (
          <span key={d} className="text-[10px] font-bold text-blue-800 bg-white border border-blue-100 px-1.5 py-0.5 rounded shadow-sm">{new Date(d).getDate()}</span>
        ))}
        {slot.dates.length > 3 && <span className="text-[10px] font-bold text-blue-600 self-center">+{slot.dates.length - 3}</span>}
      </div>
    )}

    <div className={`flex items-end justify-between ${!isDate ? 'mt-auto' : ''}`}>
      <div>
        <p className={`text-[10px] font-bold uppercase mb-0.5 ${isDate ? 'text-blue-500' : 'text-slate-400'}`}>Price</p>
        <p className={`font-bold text-lg ${isDate ? 'text-blue-700' : 'text-slate-900'}`}>₹{slot.price}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm text-slate-500">
        <Edit2 className="h-3.5 w-3.5" />
      </div>
    </div>
  </div>
);

const TimePicker = ({ value, onChange, className }) => {
  const [hours, minutes] = (value || '09:00').split(':');
  let h = parseInt(hours, 10);
  const m = minutes;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;

  const updateTime = (newH, newM, newAmpm) => {
    let finalH = parseInt(newH, 10);
    if (newAmpm === 'PM' && finalH !== 12) finalH += 12;
    if (newAmpm === 'AM' && finalH === 12) finalH = 0;
    onChange(`${finalH.toString().padStart(2, '0')}:${newM}`);
  };

  return (
    <div className={`flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all ${className}`}>
      <select
        value={h}
        onChange={e => updateTime(e.target.value, m, ampm)}
        className="flex-1 appearance-none bg-transparent py-1.5 text-center text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 rounded"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => <option key={num} value={num}>{num}</option>)}
      </select>
      <span className="text-slate-300 font-bold">:</span>
      <select
        value={m}
        onChange={e => updateTime(h, e.target.value, ampm)}
        className="flex-1 appearance-none bg-transparent py-1.5 text-center text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 rounded"
      >
        {['00', '15', '30', '45'].map(min => <option key={min} value={min}>{min}</option>)}
      </select>
      <select
        value={ampm}
        onChange={e => updateTime(h, m, e.target.value)}
        className="w-12 appearance-none bg-slate-50 border-l border-slate-100 py-1.5 text-center text-xs font-bold text-slate-500 outline-none cursor-pointer hover:text-green-600 rounded-r"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default SlotCalendar;
