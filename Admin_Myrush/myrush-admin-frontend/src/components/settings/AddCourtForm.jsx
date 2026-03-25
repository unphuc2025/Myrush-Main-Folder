import { useState, useEffect } from 'react';
import {
  Building2, Gamepad2, Coins, CalendarDays, Camera, Video,
  Trash2, Plus, Info, X, MapPin
} from 'lucide-react';
import { branchesApi, gameTypesApi, courtsApi, facilityTypesApi, sharedGroupsApi, rentalItemsApi, courtUnitsApi, divisionModesApi, sanitizeImageUrl } from '../../services/adminApi';
import SlotCalendar from './SlotCalendar';

function AddCourtForm({ onCancel, onSuccess, initialData = null }) {
  const [branches, setBranches] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  /* Amenities logic removed */
  const [loading, setLoading] = useState(true);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [sharedGroups, setSharedGroups] = useState([]);
  const [allRentalItems, setAllRentalItems] = useState([]);
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
    isActive: true,
    facilityTypeId: '',
    logicType: 'independent', // independent, shared, divisible, capacity
    sharedGroupId: '',
    capacityLimit: 1,
    totalZones: 1,
    sportSlices: [],
    priceOverrides: {},
    rentalItemIds: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, gameTypesData, facilityTypesData, rentalItemsData] = await Promise.all([
          branchesApi.getAll(),
          gameTypesApi.getAll(),
          facilityTypesApi.getAll(),
          rentalItemsApi.getAll()
        ]);
        const bItems = Array.isArray(branchesData?.items) ? branchesData.items : (Array.isArray(branchesData) ? branchesData : []);
        const gtItems = Array.isArray(gameTypesData?.items) ? gameTypesData.items : (Array.isArray(gameTypesData) ? gameTypesData : []);
        setBranches(bItems);
        setGameTypes(gtItems);
        setFacilityTypes(facilityTypesData || []);
        setAllRentalItems(rentalItemsData || []);
        // setAmenities(amenitiesData); // Removed

        if (initialData) {
          // Parse complex fields if they are strings
          let priceConditions = initialData.price_conditions || [];
          while (typeof priceConditions === 'string') {
            try { priceConditions = JSON.parse(priceConditions); } catch (e) { console.error('Error parsing price conditions', e); break; }
          }

          let unavailabilitySlots = initialData.unavailability_slots || [];
          while (typeof unavailabilitySlots === 'string') {
            try { unavailabilitySlots = JSON.parse(unavailabilitySlots); } catch (e) { console.error('Error parsing unavailability slots', e); break; }
          }

          // division modes & units removed in bitmask architecture

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
            isActive: initialData.is_active,
            facilityTypeId: initialData.facility_type_id || '',
            logicType: initialData.logic_type || 'independent',
            sharedGroupId: initialData.shared_group_id || '',
            capacityLimit: initialData.capacity_limit || 1,
            totalZones: initialData.total_zones || 1,
            sportSlices: initialData.sport_slices || [],
            priceOverrides: initialData.price_overrides || {},
            rentalItemIds: (initialData.rental_items || []).map(ri => ri.id)
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

  useEffect(() => {
    if (formData.branchId) {
      sharedGroupsApi.getAll(formData.branchId).then(setSharedGroups).catch(console.error);
    }
  }, [formData.branchId]);

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

  const handleSharedGroupChange = async (val) => {
    if (val === 'new') {
      const name = window.prompt("Enter new Shared Group name:");
      if (name && formData.branchId) {
        try {
          const newGroup = await sharedGroupsApi.create({ name, branch_id: formData.branchId });
          setSharedGroups(prev => [...prev, newGroup]);
          setFormData(prev => ({ ...prev, sharedGroupId: newGroup.id }));
        } catch (e) {
          console.error("Failed to create shared group", e);
          setError("Failed to create shared group");
        }
      }
    } else {
      setFormData(prev => ({ ...prev, sharedGroupId: val }));
    }
  };

  const addSportSlice = () => {
    setFormData(prev => ({
      ...prev,
      sportSlices: [...prev.sportSlices, { name: '', mask: 0, price_per_hour: '' }]
    }));
  };

  const updateSportSlice = (index, field, value) => {
    setFormData(prev => {
      const newSlices = [...prev.sportSlices];
      newSlices[index] = { ...newSlices[index], [field]: value };
      return { ...prev, sportSlices: newSlices };
    });
  };

  const toggleZoneInSlice = (sliceIndex, zoneIndex) => {
    setFormData(prev => {
      const newSlices = [...prev.sportSlices];
      const currentMask = Number(newSlices[sliceIndex].mask) || 0;
      const zoneBit = 1 << zoneIndex;
      newSlices[sliceIndex] = {
        ...newSlices[sliceIndex],
        mask: currentMask ^ zoneBit
      };
      return { ...prev, sportSlices: newSlices };
    });
  };

  const removeSportSlice = (index) => {
    setFormData(prev => ({
      ...prev,
      sportSlices: prev.sportSlices.filter((_, i) => i !== index)
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
      submitData.append('logic_type', formData.logicType);

      if (formData.facilityTypeId) submitData.append('facility_type_id', formData.facilityTypeId);
      if (formData.sharedGroupId) submitData.append('shared_group_id', formData.sharedGroupId);
      if (formData.capacityLimit) submitData.append('capacity_limit', formData.capacityLimit);
      submitData.append('total_zones', formData.totalZones);
      if (formData.sportSlices?.length > 0) submitData.append('sport_slices', JSON.stringify(formData.sportSlices));
      if (formData.priceOverrides) submitData.append('price_overrides', JSON.stringify(formData.priceOverrides));
      if (formData.rentalItemIds) submitData.append('rental_item_ids', JSON.stringify(formData.rentalItemIds));

      // Serialize complex objects
      submitData.append('price_conditions', JSON.stringify(priceConditions));
      submitData.append('unavailability_slots', JSON.stringify(formData.unavailabilitySlots));
      submitData.append('terms_and_conditions', formData.termsAndConditions);
      submitData.append('terms_and_conditions', formData.termsAndConditions);
      // submitData.append('amenities', JSON.stringify(formData.amenities)); // Removed as per requirement

      // Append new files
      formData.images.forEach(img => submitData.append('images', img.file));
      formData.videos.forEach(vid => submitData.append('videos', vid.file));

      let result;
      // Append existing files if editing - sanitize to relative paths
      if (initialData) {
        formData.existingImages.forEach(url => submitData.append('existing_images', sanitizeImageUrl(url)));
        formData.existingVideos.forEach(url => submitData.append('existing_videos', sanitizeImageUrl(url)));

        result = await courtsApi.update(initialData.id, submitData);
      } else {
        result = await courtsApi.create(submitData);
      }

      // Divisible logic removed from here as it is now supported transactionally via 'sport_slices' within courtsApi

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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Branch</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-all pointer-events-none" />
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium appearance-none shadow-sm hover:border-slate-300"
                  required
                >
                  <option value="">Select Branch</option>
                  {Array.isArray(branches) && branches.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <div className="mt-2 text-right">
                  <a href="/venues" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-green-600 hover:text-green-700 uppercase tracking-wide flex items-center gap-1 justify-end ml-auto">
                    <Plus className="h-3 w-3" /> New Branch
                  </a>
                </div>
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
                  {Array.isArray(gameTypes) && gameTypes
                    .filter(gt => gt.is_active)
                    .filter(gt => {
                      // Filter by branch if selected
                      if (!formData.branchId) return true;
                      const selectedBranch = branches.find(b => String(b.id) === String(formData.branchId));
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

            {/* Facility Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Facility Type</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <select
                  value={formData.facilityTypeId}
                  onChange={(e) => setFormData({ ...formData, facilityTypeId: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium appearance-none shadow-sm hover:border-slate-300"
                >
                  <option value="">Select Facility Type</option>
                  {facilityTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Logic Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Booking Rule</label>
              <div className="relative group">
                <Info className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <select
                  value={formData.logicType}
                  onChange={(e) => setFormData({ ...formData, logicType: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium appearance-none shadow-sm hover:border-slate-300"
                  required
                >
                  <option value="independent">Standard (One at a time)</option>
                  <option value="shared">Shared (Multiple Sports/Venues)</option>
                  <option value="divisible">Divisible (Hierarchical)</option>
                  <option value="capacity">Capacity Based (Pools/Nets)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conditional Logic Fields */}
          <div className="space-y-4">
            {['shared', 'divisible'].includes(formData.logicType) && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Shared Court Configuration
                </h4>
                <div>
                  <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Shared Resource Group</label>
                  <select
                    value={formData.sharedGroupId}
                    onChange={(e) => handleSharedGroupChange(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="">Select Group</option>
                    {sharedGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                    <option value="new">+ Create New Group</option>
                  </select>
                  <p className="mt-1 text-[10px] text-blue-400">Courts in the same group share physical space and block each other.</p>
                </div>
              </div>
            )}

            {formData.logicType === 'capacity' && (
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4" /> Capacity Configuration
                </h4>
                <label className="block text-xs font-bold text-purple-600 uppercase mb-2">Member Limit (per slot)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacityLimit}
                  onChange={(e) => setFormData({ ...formData, capacityLimit: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500 transition-all font-medium"
                />
              </div>
            )}

            {formData.logicType === 'divisible' && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-4">
                <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Court Zoning & Slices Configuration
                </h4>

                {/* Total Zones */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-green-600 uppercase">Total Physical Zones (Indivisible Units)</label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={formData.totalZones}
                    onChange={(e) => setFormData({ ...formData, totalZones: parseInt(e.target.value) || 1 })}
                    className="w-full sm:w-1/3 px-4 py-2 bg-white border border-green-200 rounded-lg text-sm outline-none focus:border-green-500 transition-all font-medium"
                  />
                  <p className="text-[10px] text-green-600">The total number of zones this court is divided into linearly.</p>
                </div>

                {/* Division Modes Section */}
                <div className="space-y-4 pt-4 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-green-600 uppercase">Available Playing Modes (Sport Slices)</label>
                      <p className="text-[10px] text-green-700/70 font-medium">Define which sports can be played and what zones they occupy.</p>
                    </div>
                    <button type="button" onClick={addSportSlice} className="text-[10px] font-bold text-green-700 bg-white px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors shadow-sm">
                      + Add Booking Option
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.sportSlices.map((slice, idx) => (
                      <div key={`slice-${idx}`} className="p-4 bg-white border border-green-200 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 sm:gap-3 w-full">
                          <input
                            placeholder="Name (e.g. 10-a-side)"
                            value={slice.name}
                            onChange={(e) => updateSportSlice(idx, 'name', e.target.value)}
                            className="text-sm font-bold border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none px-3 py-2 flex-1 min-w-0 text-slate-700 rounded-lg"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Price(₹)"
                            value={slice.price_per_hour ?? ''}
                            onChange={(e) => updateSportSlice(idx, 'price_per_hour', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="text-sm font-bold border border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none px-2 sm:px-3 py-2 w-20 sm:w-24 shrink-0 text-slate-700 rounded-lg bg-slate-50"
                          />
                          <button type="button" onClick={() => removeSportSlice(idx)} className="shrink-0 h-[38px] w-[38px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 transition-colors rounded-lg border border-transparent hover:border-red-600 group">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Visual Grid Selector */}
                        <div className="pt-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Required Zones (Interactive Grid)</label>
                          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl max-w-2xl overflow-x-auto">
                            {Array.from({ length: formData.totalZones }).map((_, zoneIndex) => {
                              const isSelected = (slice.mask & (1 << zoneIndex)) !== 0;
                              return (
                                <button
                                  type="button"
                                  key={`zone-${idx}-${zoneIndex}`}
                                  onClick={() => toggleZoneInSlice(idx, zoneIndex)}
                                  className={`flex-1 min-w-[3rem] max-w-[4rem] aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${isSelected
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-700 text-white shadow-inner transform scale-95'
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50'
                                    }`}
                                >
                                  <span className="text-xs uppercase tracking-tight font-bold opacity-80">Zone</span>
                                  <span className="text-lg font-black leading-none">{zoneIndex + 1}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.sportSlices.length === 0 && (
                      <div className="p-6 border-2 border-dashed border-green-200 bg-green-50/50 rounded-xl text-center text-sm font-medium text-green-700">
                        No playing modes configured yet. Add an option to define how customers can book this court.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price & Active Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Base Price / Hr (₹)</label>
              <div className="relative group">
                <Coins className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium title-font shadow-sm hover:border-slate-300"
                  placeholder="0"
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

        {/* Rental Items Section */}
        <section>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Available Rental Items</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allRentalItems.filter(ri => !ri.branch_id || ri.branch_id === formData.branchId).map(item => (
              <label key={item.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.rentalItemIds.includes(item.id) ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${formData.rentalItemIds.includes(item.id) ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}>
                    {formData.rentalItemIds.includes(item.id) && <Plus className="h-3.5 w-3.5 text-white rotate-45" />}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">₹{item.price_per_booking}</span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.rentalItemIds.includes(item.id)}
                  onChange={() => {
                    const current = formData.rentalItemIds;
                    if (current.includes(item.id)) {
                      setFormData(prev => ({ ...prev, rentalItemIds: current.filter(id => id !== item.id) }));
                    } else {
                      setFormData(prev => ({ ...prev, rentalItemIds: [...current, item.id] }));
                    }
                  }}
                />
              </label>
            ))}
            {allRentalItems.length === 0 && <p className="text-xs text-slate-400 italic col-span-2 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No rental items configured</p>}
          </div>
        </section>

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
              <div key={slot.id} className="p-4 bg-red-50/50 border border-red-100 rounded-xl relative group">
                <button
                  type="button"
                  onClick={() => removeUnavailabilitySlot(slot.id)}
                  className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Row 1: Date + Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Date</label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm text-slate-900 focus:border-red-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Maintenance"
                      value={slot.reason}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'reason', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm text-slate-900 focus:border-red-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Row 2: Start Time + End Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Start Time</label>
                    <input
                      type="time"
                      value={slot.from}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'from', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm text-slate-900 focus:border-red-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">End Time</label>
                    <input
                      type="time"
                      value={slot.to}
                      onChange={(e) => updateUnavailabilitySlot(slot.id, 'to', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm text-slate-900 focus:border-red-500 outline-none transition-all"
                    />
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
