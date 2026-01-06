import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import { branchesApi, gameTypesApi, courtsApi, amenitiesApi } from '../../services/adminApi';
import SlotCalendar from './SlotCalendar';

function AddCourtForm({ onCancel, onSuccess, initialData = null }) {
  const [branches, setBranches] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize with default 5AM-11AM slot
  const getDefaultSlots = (defaultPrice) => {
    if (!defaultPrice) return [];
    return [{
      id: 'default-morning',
      type: 'recurring',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      slotFrom: '05:00',
      slotTo: '11:00',
      price: defaultPrice
    }];
  };

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
    amenities: [],
    isActive: true
  });

  const daysOfWeek = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, gameTypesData, amenitiesData] = await Promise.all([
          branchesApi.getAll(),
          gameTypesApi.getAll(),
          amenitiesApi.getAll()
        ]);
        setBranches(branchesData);
        setGameTypes(gameTypesData);
        setAmenities(amenitiesData);

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
            priceConditions: priceConditions,
            unavailabilitySlots: unavailabilitySlots,
            termsAndConditions: initialData.terms_and_conditions || '',
            amenities: initialData.amenities || [],
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
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setFormData(prev => ({ ...prev, videos: [...prev.videos, ...newVideos] }));
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

  const addPriceCondition = () => {
    setFormData(prev => ({
      ...prev,
      priceConditions: [
        ...prev.priceConditions,
        { id: Date.now(), days: [], slotFrom: '', slotTo: '', price: '' }
      ]
    }));
  };

  const removePriceCondition = (id) => {
    setFormData(prev => ({
      ...prev,
      priceConditions: prev.priceConditions.filter(pc => pc.id !== id)
    }));
  };

  const updatePriceCondition = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      priceConditions: prev.priceConditions.map(pc =>
        pc.id === id ? { ...pc, [field]: value } : pc
      )
    }));
  };

  const toggleDayInCondition = (conditionId, dayId) => {
    setFormData(prev => ({
      ...prev,
      priceConditions: prev.priceConditions.map(pc => {
        if (pc.id === conditionId) {
          const days = pc.days.includes(dayId)
            ? pc.days.filter(d => d !== dayId)
            : [...pc.days, dayId];
          return { ...pc, days };
        }
        return pc;
      })
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
      submitData.append('amenities', JSON.stringify(formData.amenities));

      // Append new files
      formData.images.forEach(img => submitData.append('images', img.file));
      formData.videos.forEach(vid => submitData.append('videos', vid.file));

      // Append existing files if editing
      if (initialData) {
        formData.existingImages.forEach(url => submitData.append('existing_images[]', url));
        formData.existingVideos.forEach(url => submitData.append('existing_videos[]', url));

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
    return <div className="text-center py-8">Loading form data...</div>;
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-semibold text-slate-800">{initialData ? 'Edit Court' : 'Add New Court'}</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Court Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. Court 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Price (₹) *
              </label>
              <input
                type="number"
                value={formData.defaultPrice}
                onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Branch *
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select Branch</option>
                {branches.filter(b => b.is_active).map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Sport *
              </label>
              <select
                value={formData.gameTypeId}
                onChange={(e) => setFormData({ ...formData, gameTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select Sport</option>
                {gameTypes.filter(gt => gt.is_active).map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Active
              </label>
            </div>
          </div>
        </section>

        {/* Media Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900">Images & Videos *</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Images</label>
              <div className="flex flex-wrap gap-4">
                {/* Existing Images */}
                {formData.existingImages.map((url, idx) => (
                  <div key={`existing-img-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                    <img src={url} alt="Court" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingMedia('existingImages', idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* New Images */}
                {formData.images.map((img, idx) => (
                  <div key={`new-img-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                    <img src={img.url} alt="Court" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMedia('images', idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-500 mt-1">Add Image</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Videos */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Videos</label>
              <div className="flex flex-wrap gap-4">
                {/* Existing Videos */}
                {formData.existingVideos.map((url, idx) => (
                  <div key={`existing-vid-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                    <video src={url} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingMedia('existingVideos', idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* New Videos */}
                {formData.videos.map((vid, idx) => (
                  <div key={`new-vid-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                    <video src={vid.url} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMedia('videos', idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-500 mt-1">Add Video</span>
                  <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Amenities Section */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {amenities.map(amenity => (
              <label key={amenity.id} className="flex items-center space-x-2 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.id)}
                  onChange={(e) => {
                    const id = amenity.id;
                    setFormData(prev => ({
                      ...prev,
                      amenities: e.target.checked
                        ? [...prev.amenities, id]
                        : prev.amenities.filter(aid => aid !== id)
                    }));
                  }}
                  className="rounded text-green-600 focus:ring-green-500 h-4 w-4"
                />
                <span className="text-sm text-slate-700">{amenity.name}</span>
              </label>
            ))}
            {amenities.length === 0 && (
              <p className="text-sm text-slate-500 col-span-full">No amenities available. Go to Amenities tab to add some.</p>
            )}
          </div>
        </section>

        {/* Price Conditions Section - Using Calendar Component */}
        <section className="space-y-4">
          <SlotCalendar
            slots={formData.priceConditions}
            onSlotsChange={(newSlots) => setFormData({ ...formData, priceConditions: newSlots })}
            defaultPrice={formData.defaultPrice}
          />
        </section>

        {/* Unavailability Slots Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900">Unavailability Slots</h3>
            <button
              type="button"
              onClick={addUnavailabilitySlot}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Slot
            </button>
          </div>

          <div className="space-y-4">
            {formData.unavailabilitySlots.map((slot) => (
              <div key={slot.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                <button
                  type="button"
                  onClick={() => removeUnavailabilitySlot(slot.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
                    <input
                      type="time"
                      value={slot.from}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'from', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
                    <input
                      type="time"
                      value={slot.to}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'to', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                    <input
                      type="text"
                      value={slot.reason}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'reason', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Maintenance"
                    />
                  </div>
                </div>
              </div>
            ))}
            {formData.unavailabilitySlots.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                No unavailability slots added
              </div>
            )}
          </div>
        </section>

        {/* Terms and Conditions Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900">Terms and Conditions</h3>
          <textarea
            value={formData.termsAndConditions}
            onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-32"
            placeholder="Enter specific rules or terms for this court..."
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm shadow-green-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Court' : 'Add Court')}
          </button>
        </div >
      </form >
    </div >
  );
}

export default AddCourtForm;
