import { useState, useEffect } from 'react';
import {
  Building2, Gamepad2, Coins, CalendarDays, Camera, Video,
  Trash2, Plus, Info, X, MapPin
} from 'lucide-react';
import { branchesApi, gameTypesApi, courtsApi } from '../../services/adminApi';
import SlotCalendar from './SlotCalendar';

function AddCourtForm({ onCancel, onSuccess, initialData = null }) {
  const [branches, setBranches] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  /* Amenities logic removed */
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    branchId: '',
    gameTypeId: '',
    defaultPrice: '',
    images: [],
    videos: [],
    existingImages: [],
    existingVideos: [],
    priceConditions: [],
    unavailabilitySlots: [],
    termsAndConditions: '',
    // amenities: [], // Removed
    isActive: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, gameTypesData] = await Promise.all([
          branchesApi.getAll(),
          gameTypesApi.getAll()
        ]);
        setBranches(branchesData);
        setGameTypes(gameTypesData);
        // setAmenities(amenitiesData); // Removed

        if (initialData) {
          // Parse complex fields if they are strings
          let priceConditions = initialData.price_conditions || [];
          if (typeof priceConditions === 'string') {
            try { priceConditions = JSON.parse(priceConditions); } catch (e) { console.error('Error parsing price conditions', e); }
          }

          let unavailabilitySlots = initialData.unavailability_slots || [];
          if (typeof unavailabilitySlots === 'string') {
            try { unavailabilitySlots = JSON.parse(unavailabilitySlots); } catch (e) { console.error('Error parsing unavailability slots', e); }
          }
          /* Amenities parsing removed */
          setFormData({
            name: initialData.name,
            branchId: initialData.branch_id,
            gameTypeId: initialData.game_type_id,
            defaultPrice: initialData.price_per_hour || initialData.default_price || '',
            images: [],
            videos: [],
            existingImages: initialData.images || [],
            existingVideos: initialData.videos || [],
            priceConditions: priceConditions,
            unavailabilitySlots: unavailabilitySlots,
            termsAndConditions: initialData.terms_and_conditions || '',
            // amenities: courtAmenities, // Removed
            isActive: initialData.is_active
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialData]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    e.target.value = '';
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setFormData(prev => ({ ...prev, videos: [...prev.videos, ...newVideos] }));
    e.target.value = '';
  };

  const removeMedia = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const removeExistingMedia = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addUnavailabilitySlot = () => {
    setFormData(prev => ({
      ...prev,
      unavailabilitySlots: [
        ...prev.unavailabilitySlots,
        { id: Date.now(), date: '', from: '', to: '', reason: '' }
      ]
    }));
  };

  const removeUnavailabilitySlot = (id) => {
    setFormData(prev => ({
      ...prev,
      unavailabilitySlots: prev.unavailabilitySlots.filter(slot => slot.id !== id)
    }));
  };

  const updateUnavailabilitySlot = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      unavailabilitySlots: prev.unavailabilitySlots.map(slot =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Use price conditions as is
      let priceConditions = [...formData.priceConditions];

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('branch_id', formData.branchId);
      submitData.append('game_type_id', formData.gameTypeId);
      submitData.append('price_per_hour', formData.defaultPrice);
      submitData.append('is_active', formData.isActive);

      // Serialize complex objects
      submitData.append('price_conditions', JSON.stringify(priceConditions));
      submitData.append('unavailability_slots', JSON.stringify(formData.unavailabilitySlots));
      submitData.append('terms_and_conditions', formData.termsAndConditions);
      submitData.append('terms_and_conditions', formData.termsAndConditions);
      // submitData.append('amenities', JSON.stringify(formData.amenities)); // Removed as per requirement

      // Append new files
      formData.images.forEach(img => submitData.append('images', img.file));
      formData.videos.forEach(vid => submitData.append('videos', vid.file));

      // Append existing files if editing
      if (initialData) {
        formData.existingImages.forEach(url => submitData.append('existing_images', url));
        formData.existingVideos.forEach(url => submitData.append('existing_videos', url));

        await courtsApi.update(initialData.id, submitData);
      } else {
        await courtsApi.create(submitData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving court:', err);
      setError(err.message || 'Failed to save court');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading form data...</div>;
  }

  return (
    <form className="flex flex-col h-full bg-white" onSubmit={handleSubmit}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-8">

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2"><X className="h-5 w-5" />{error}</div>}

        {/* Basic Info */}
        <div className="space-y-6">
          {/* Court Name (Full Width) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Court Name</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300 text-slate-900"
                placeholder="e.g. Court 1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                <a href="/venues" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-green-600 hover:text-green-700 uppercase tracking-wide flex items-center gap-1">
                  <Plus className="h-3 w-3" /> New
                </a>
              </div>
              <div className="relative group">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium appearance-none shadow-sm hover:border-slate-300"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Game Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sport</label>
              <div className="relative group">
                <Gamepad2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <select
                  value={formData.gameTypeId}
                  onChange={(e) => setFormData({ ...formData, gameTypeId: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium appearance-none shadow-sm hover:border-slate-300"
                  required
                >
                  <option value="">Select Sport</option>
                  {gameTypes
                    .filter(gt => gt.is_active)
                    .filter(gt => {
                      // Filter by branch if selected
                      if (!formData.branchId) return true;
                      const selectedBranch = branches.find(b => b.id === formData.branchId);
                      // If branch has game_types defined, use them. Otherwise show all (fallback)
                      if (selectedBranch?.game_types?.length > 0) {
                        return selectedBranch.game_types.some(bGt => bGt.id === gt.id);
                      }
                      return true;
                    })
                    .map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Price & Active Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Base Price / Hr (₹)</label>
              <div className="relative group">
                <Coins className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="number"
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium title-font shadow-sm hover:border-slate-300"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="pt-8 pl-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isActive ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                  {formData.isActive && <Plus className="h-4 w-4 text-white rotate-45" />}
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="hidden"
                />
                <span className="font-medium text-slate-700">Active Status</span>
              </label>
            </div>
          </div>
        </div>

        {/* Media */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Images & Videos</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image Upload Box */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-center cursor-pointer relative group h-32 flex flex-col items-center justify-center">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Add Images</span>
            </div>

            {/* Video Upload Box */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-center cursor-pointer relative group h-32 flex flex-col items-center justify-center">
              <input type="file" accept="video/*" multiple onChange={handleVideoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Video className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Add Videos</span>
            </div>
          </div>

          {/* Media Previews */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[...formData.existingImages, ...formData.images.map(i => i.url)].map((url, idx) => (
              <div key={`img-${idx}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 group">
                <img src={url} className="w-full h-full object-cover" />
                <button type="button" onClick={() => idx < formData.existingImages.length ? removeExistingMedia('existingImages', idx) : removeMedia('images', idx - formData.existingImages.length)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
            {[...formData.existingVideos, ...formData.videos.map(v => v.url)].map((url, idx) => (
              <div key={`vid-${idx}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-black group">
                <video src={url} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Video className="h-6 w-6 text-white/50" /></div>
                <button type="button" onClick={() => idx < formData.existingVideos.length ? removeExistingMedia('existingVideos', idx) : removeMedia('videos', idx - formData.existingVideos.length)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities section removed as per requirement */}

        <div className="h-px bg-slate-200 my-4" />

        <div className="h-px bg-slate-200 my-4" />

        {/* Price Calendar & Unavailability */}
        <section>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Pricing Calendar</label>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <SlotCalendar
              slots={formData.priceConditions}
              onSlotsChange={(newSlots) => setFormData({ ...formData, priceConditions: newSlots })}
              defaultPrice={formData.defaultPrice}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Unavailability Slots</label>
            <button type="button" onClick={addUnavailabilitySlot} className="text-xs font-bold text-red-600 flex items-center gap-1 uppercase hover:bg-red-50 px-2 py-1 rounded transition-colors">
              <Plus className="h-3 w-3" /> Add Slot
            </button>
          </div>

          <div className="space-y-3">
            {formData.unavailabilitySlots.map((slot) => (
              <div key={slot.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl relative group">
                <button type="button" onClick={() => removeUnavailabilitySlot(slot.id)} className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 items-center">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 ml-1">Date</label>
                    <input type="date" value={slot.date} onChange={(e) => updateUnavailabilitySlot(slot.id, 'date', e.target.value)} className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:border-red-500 outline-none transition-all" />
                  </div>
                  <div className="sm:col-span-8">
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 ml-1">Reason</label>
                    <input type="text" placeholder="Reason (e.g. Maintenance)" value={slot.reason} onChange={(e) => updateUnavailabilitySlot(slot.id, 'reason', e.target.value)} className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:border-red-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 ml-1">Start Time</label>
                    <input type="time" value={slot.from} onChange={(e) => updateUnavailabilitySlot(slot.id, 'from', e.target.value)} className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:border-red-500 outline-none transition-all" />
                  </div>
                  <span className="text-slate-300 font-medium pb-2">-</span>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 ml-1">End Time</label>
                    <input type="time" value={slot.to} onChange={(e) => updateUnavailabilitySlot(slot.id, 'to', e.target.value)} className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:border-red-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            ))}
            {formData.unavailabilitySlots.length === 0 && (
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                No unavailability slots added
              </div>
            )}
          </div>
        </section>

        {/* Terms */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Terms & Conditions</label>
          <textarea
            value={formData.termsAndConditions}
            onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all text-sm shadow-sm hover:border-slate-300 min-h-[100px]"
            placeholder="Enter specific rules or terms for this court..."
          />
        </div>

      </div>

      {/* Footer Actions */}
      <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white sticky bottom-0 z-10 px-1 pb-6 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors active:scale-[0.98] transform"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-[2] px-4 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-[0.98] transform"
        >
          {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : null}
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Court' : 'Create Court')}
        </button>
      </div>
    </form>
  );
}

export default AddCourtForm;
