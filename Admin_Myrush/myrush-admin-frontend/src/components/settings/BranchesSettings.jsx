import { useState, useEffect, useRef } from 'react';
import { Edit2, Plus, Building, Upload, X, MapPin, Clock, Camera, ChevronDown, Eye, Trash2 } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import { citiesApi, areasApi, gameTypesApi, amenitiesApi, branchesApi, IMAGE_BASE_URL } from '../../services/adminApi';

function BranchesSettings() {
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCityId, setSelectedCityId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewingBranch, setViewingBranch] = useState(null);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const gameDropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    cityId: '',
    areaId: '',
    searchLocation: '',
    addressLine1: '',
    addressLine2: '',
    groundOverview: '',
    termsCondition: '',
    rule: '',
    googleMapUrl: '',
    price: '',
    maxPlayers: '',
    phoneNumber: '',
    email: '',
    groundType: 'single',
    selectedGames: [],
    selectedAmenities: [],
    openingHours: {
      monday: { open: '09:00', close: '22:00', isActive: true },
      tuesday: { open: '09:00', close: '22:00', isActive: true },
      wednesday: { open: '09:00', close: '22:00', isActive: true },
      thursday: { open: '09:00', close: '22:00', isActive: true },
      friday: { open: '09:00', close: '22:00', isActive: true },
      saturday: { open: '08:00', close: '23:00', isActive: true },
      sunday: { open: '08:00', close: '23:00', isActive: true }
    },
    images: [],
    imagePreviews: [],
    existingImages: [], // For edit mode
    isActive: true
  });

  // State for adding new City/Area inline
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCityData, setNewCityData] = useState({ name: '', shortCode: '' });
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');

  const handleCreateCity = async () => {
    try {
      const resp = await citiesApi.create({
        name: newCityData.name,
        short_code: newCityData.shortCode
      });
      // Refresh cities list
      const updatedCities = await citiesApi.getAll();
      setCities(updatedCities);

      // Auto-select new city
      setFormData(prev => ({ ...prev, cityId: resp.id, areaId: '' }));

      // Reset state
      setIsAddingCity(false);
      setNewCityData({ name: '', shortCode: '' });
    } catch (err) {
      console.error("Failed to create city:", err);
      setError("Failed to create city: " + err.message);
    }
  };

  const handleCreateArea = async () => {
    if (!formData.cityId) return;
    try {
      const resp = await areasApi.create({
        name: newAreaName,
        city_id: formData.cityId
      });
      // Refresh areas list
      const updatedAreas = await areasApi.getAll();
      setAreas(updatedAreas);

      // Auto-select new area
      setFormData(prev => ({ ...prev, areaId: resp.id }));

      // Reset state
      setIsAddingArea(false);
      setNewAreaName('');
    } catch (err) {
      console.error("Failed to create area:", err);
      setError("Failed to create area: " + err.message);
    }
  };

  // Fetch all initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [citiesData, areasData, gameTypesData, amenitiesData, branchesData] = await Promise.all([
        citiesApi.getAll(),
        areasApi.getAll(),
        gameTypesApi.getAll(),
        amenitiesApi.getAll(),
        branchesApi.getAll()
      ]);

      setCities(citiesData);
      setAreas(areasData);
      setGameTypes(gameTypesData);
      setAmenities(amenitiesData);
      setBranches(branchesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gameDropdownRef.current && !gameDropdownRef.current.contains(event.target)) {
        setShowGameDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter by selected city
  const filteredBranches = selectedCityId
    ? branches.filter(branch => branch.city_id === selectedCityId)
    : branches;

  const handleAddClick = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      cityId: '',
      areaId: '',
      searchLocation: '',
      addressLine1: '',
      addressLine2: '',
      groundOverview: '',
      termsCondition: '',
      rule: '',
      googleMapUrl: '',
      price: '',
      maxPlayers: '',
      phoneNumber: '',
      email: '',
      groundType: 'single',
      selectedGames: [],
      selectedAmenities: [],
      openingHours: {
        monday: { open: '09:00', close: '22:00', isActive: true },
        tuesday: { open: '09:00', close: '22:00', isActive: true },
        wednesday: { open: '09:00', close: '22:00', isActive: true },
        thursday: { open: '09:00', close: '22:00', isActive: true },
        friday: { open: '09:00', close: '22:00', isActive: true },
        saturday: { open: '08:00', close: '23:00', isActive: true },
        sunday: { open: '08:00', close: '23:00', isActive: true }
      },
      images: [],
      imagePreviews: [],
      existingImages: [],
      isActive: true
    });
    setShowForm(true);
  };

  const handleEditClick = (branch) => {
    setEditingBranch(branch);

    // Parse opening hours if string, otherwise use default
    let openingHours = {
      monday: { open: '09:00', close: '22:00', isActive: true },
      tuesday: { open: '09:00', close: '22:00', isActive: true },
      wednesday: { open: '09:00', close: '22:00', isActive: true },
      thursday: { open: '09:00', close: '22:00', isActive: true },
      friday: { open: '09:00', close: '22:00', isActive: true },
      saturday: { open: '08:00', close: '23:00', isActive: true },
      sunday: { open: '08:00', close: '23:00', isActive: true }
    };

    if (branch.opening_hours) {
      try {
        openingHours = typeof branch.opening_hours === 'string'
          ? JSON.parse(branch.opening_hours)
          : branch.opening_hours;
      } catch (e) {
        console.error("Error parsing opening hours", e);
      }
    }

    setFormData({
      name: branch.name,
      cityId: branch.city_id.toString(),
      areaId: branch.area_id.toString(),
      searchLocation: branch.search_location || '',
      addressLine1: branch.address_line1 || '',
      addressLine2: branch.address_line2 || '',
      groundOverview: branch.ground_overview || '',
      termsCondition: branch.terms_condition || '',
      rule: branch.rule || '',
      googleMapUrl: branch.google_map_url || '',
      price: branch.price || '',
      maxPlayers: branch.max_players || '',
      phoneNumber: branch.phone_number || '',
      email: branch.email || '',
      groundType: branch.ground_type || 'single',
      selectedGames: branch.game_types?.map(gt => gt.id) || [],
      selectedAmenities: branch.amenities?.map(am => am.id) || [],
      openingHours: openingHours,
      images: [],
      imagePreviews: [],
      existingImages: branch.images || [],
      isActive: branch.is_active
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await branchesApi.delete(id);
        await fetchAllData();
      } catch (err) {
        console.error('Error deleting branch:', err);
        setError('Failed to delete branch');
      }
    }
  };

  const handleToggleBranch = async (branch) => {
    try {
      const updateData = new FormData();
      updateData.append('name', branch.name);
      updateData.append('city_id', branch.city_id);
      updateData.append('area_id', branch.area_id);
      updateData.append('is_active', !branch.is_active);

      await branchesApi.update(branch.id, updateData);
      await fetchAllData();
    } catch (err) {
      console.error('Error toggling branch:', err);
      setError('Failed to update branch status');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push({ file, url: e.target.result });
        if (previews.length === files.length) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...files],
            imagePreviews: [...prev.imagePreviews, ...previews]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveExistingImage = (index) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const handleGameSelect = (gameId) => {
    setFormData(prev => ({
      ...prev,
      selectedGames: prev.selectedGames.includes(gameId)
        ? prev.selectedGames.filter(id => id !== gameId)
        : [...prev.selectedGames, gameId]
    }));
  };

  const handleAmenitySelect = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenityId)
        ? prev.selectedAmenities.filter(id => id !== amenityId)
        : [...prev.selectedAmenities, amenityId]
    }));
  };

  const handleOpeningHoursChange = (day, type, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [type]: value
        }
      }
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          isActive: !prev.openingHours[day].isActive
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('city_id', formData.cityId);
      submitData.append('area_id', formData.areaId);
      submitData.append('search_location', formData.searchLocation);
      submitData.append('address_line1', formData.addressLine1);
      submitData.append('address_line2', formData.addressLine2);
      submitData.append('ground_overview', formData.groundOverview);
      submitData.append('terms_condition', formData.termsCondition);
      submitData.append('rule', formData.rule);
      submitData.append('google_map_url', formData.googleMapUrl);
      if (formData.price) {
        submitData.append('price', formData.price);
      }
      if (formData.maxPlayers) {
        submitData.append('max_players', formData.maxPlayers);
      }
      // Phone/Email removed
      submitData.append('ground_type', formData.groundType);
      submitData.append('opening_hours', JSON.stringify(formData.openingHours));
      submitData.append('is_active', formData.isActive);

      // Append arrays
      formData.selectedGames.forEach(id => submitData.append('game_types[]', id));
      formData.selectedAmenities.forEach(id => submitData.append('amenities[]', id));

      // Append images
      formData.images.forEach(file => submitData.append('images', file));

      if (editingBranch) {
        // Append existing images for update
        formData.existingImages.forEach(url => submitData.append('existing_images', url));
        await branchesApi.update(editingBranch.id, submitData);
      } else {
        await branchesApi.create(submitData);
      }

      // Refresh data and close form
      await fetchAllData();
      setShowForm(false);
      setEditingBranch(null);
    } catch (err) {
      console.error('Error saving branch:', err);
      setError(err.message || 'Failed to save branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter areas based on selected city
  const filteredAreas = formData.cityId ? areas.filter(area => area.city_id === formData.cityId) : [];

  if (viewingBranch) {
    return (
      <BranchViewModal
        branch={viewingBranch}
        onClose={() => setViewingBranch(null)}
      />
    );
  }

  if (showForm) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">{editingBranch ? 'Edit Branch' : 'Add Branch'}</h2>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingBranch(null);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branch Images - Multiple Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Branch Images</label>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-slate-500 mt-1">Upload multiple branch images (max 5)</p>
              </div>

              {/* Existing Images (Edit Mode) */}
              {formData.existingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={url}
                        alt={`Existing Branch ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Image Previews */}
              {formData.imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img
                        src={preview.url}
                        alt={`New Branch ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && formData.existingImages.length === 0 && (
                        <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Branch Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
              required
            />
          </div>

          {/* City and Area */}
          {/* City and Area */}
          <div className="grid grid-cols-2 gap-4">
            {/* City Selection or Creation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">City *</label>
                {!isAddingCity && (
                  <div className="h-5"></div>
                )}
              </div>

              {isAddingCity ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <input
                    type="text"
                    placeholder="City Name"
                    value={newCityData.name}
                    onChange={(e) => setNewCityData({ ...newCityData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Short Code (e.g. BLR)"
                    value={newCityData.shortCode}
                    onChange={(e) => setNewCityData({ ...newCityData, shortCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateCity}
                      disabled={!newCityData.name || !newCityData.shortCode}
                      className="flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Add City
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCity(false);
                        setNewCityData({ name: '', shortCode: '' });
                      }}
                      className="flex-1 bg-white border border-slate-300 text-slate-600 text-xs py-2 rounded hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    value={formData.cityId}
                    onChange={(e) => setFormData({ ...formData, cityId: e.target.value, areaId: '' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
                    required
                  >
                    <option value="">Select City</option>
                    {cities.filter(city => city.is_active).map((city) => (
                      <option key={city.id} value={city.id}>{city.name} ({city.short_code})</option>
                    ))}
                  </select>
                  {!isAddingCity && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setIsAddingCity(true)}
                        className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700 font-medium justify-end ml-auto"
                      >
                        <Plus className="h-3 w-3" />
                        New City
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Area Selection or Creation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Area *</label>
                {!isAddingArea && formData.cityId && (
                  <div className="h-5"></div>
                )}
              </div>

              {isAddingArea ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <input
                    type="text"
                    placeholder="Area Name"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateArea}
                      disabled={!newAreaName}
                      className="flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Add Area
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingArea(false);
                        setNewAreaName('');
                      }}
                      className="flex-1 bg-white border border-slate-300 text-slate-600 text-xs py-2 rounded hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    value={formData.areaId}
                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
                    disabled={!formData.cityId}
                  >
                    <option value="">Select Area</option>
                    {filteredAreas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                  {!isAddingArea && formData.cityId && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setIsAddingArea(true)}
                        className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700 font-medium justify-end ml-auto"
                      >
                        <Plus className="h-3 w-3" />
                        New Area
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div >

          {/* Location Search */}
          < div >
            <label className="block text-sm font-medium text-slate-700 mb-2">Search and Add Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={formData.searchLocation}
                onChange={(e) => setFormData({ ...formData, searchLocation: e.target.value })}
                placeholder="Search for location..."
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div >

          {/* Google Map URL */}
          < div >
            <label className="block text-sm font-medium text-slate-700 mb-2">Google Map URL</label>
            <input
              type="text"
              value={formData.googleMapUrl}
              onChange={(e) => setFormData({ ...formData, googleMapUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
            />
          </div >

          {/* Address Lines */}
          < div className="grid grid-cols-2 gap-4" >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 1 *</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 2</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
              />
            </div>
          </div >

          {/* Ground Overview */}
          < div >
            <label className="block text-sm font-medium text-slate-700 mb-2">Ground Overview</label>
            <textarea
              value={formData.groundOverview}
              onChange={(e) => setFormData({ ...formData, groundOverview: e.target.value })}
              rows={3}
              placeholder="Brief description about the ground..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
            />
          </div >

          {/* Terms & Conditions */}
          < div >
            <label className="block text-sm font-medium text-slate-700 mb-2">Terms & Conditions</label>
            <textarea
              value={formData.termsCondition}
              onChange={(e) => setFormData({ ...formData, termsCondition: e.target.value })}
              rows={3}
              placeholder="Enter terms and conditions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
            />
          </div >

          {/* Rules / Cancellation Policy */}
          < div >
            <label className="block text-sm font-medium text-slate-700 mb-2">Rules / Cancellation Policy</label>
            <textarea
              value={formData.rule}
              onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
              rows={3}
              placeholder="Enter rules or cancellation policy..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
            />
          </div >

          {/* Pricing & Contact Info */}
          < div className="grid grid-cols-2 gap-4" >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price Per Hour (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Max Players per Slot</label>
              <input
                type="number"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                placeholder="e.g. 14"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900"
              />
            </div>
            {/* Contact Info Removed */}
          </div >

          {/* Ground Type & Select Games - Grid Layout */}
          < div className="grid grid-cols-2 gap-8" >
            {/* Ground Type - Left */}
            < div >
              <label className="block text-sm font-medium text-slate-700 mb-2">Ground Type *</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="single"
                    checked={formData.groundType === 'single'}
                    onChange={(e) => setFormData({ ...formData, groundType: e.target.value })}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  Single Ground
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="multiple"
                    checked={formData.groundType === 'multiple'}
                    onChange={(e) => setFormData({ ...formData, groundType: e.target.value })}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  Multiple Grounds
                </label>
              </div>
            </div >

            {/* Select Games - Right */}
            < div >
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Games *</label>
              <div className="space-y-2">
                {/* Selected games as tags */}
                {formData.selectedGames.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.selectedGames.map((gameId) => {
                      const game = gameTypes.find(g => g.id === gameId);
                      return game ? (
                        <span
                          key={gameId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md"
                        >
                          {game.name}
                          <button
                            type="button"
                            onClick={() => handleGameSelect(gameId)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Dropdown trigger */}
                <div className="relative" ref={gameDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowGameDropdown(!showGameDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    <span className="text-sm text-slate-700">
                      {formData.selectedGames.length === 0
                        ? 'Select games...'
                        : `${formData.selectedGames.length} game(s) selected`
                      }
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showGameDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown menu */}
                  {showGameDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {gameTypes
                        .filter(gt => gt.is_active && !formData.selectedGames.includes(gt.id))
                        .map((game) => (
                          <button
                            key={game.id}
                            type="button"
                            onClick={() => {
                              handleGameSelect(game.id);
                              setShowGameDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                          >
                            {game.name}
                          </button>
                        ))}
                      {gameTypes.filter(gt => gt.is_active && !formData.selectedGames.includes(gt.id)).length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          All games selected
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div >
          </div >

          {/* Select Amenities */}
          < div >
            <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenities.filter(am => am.is_active).map((amenity) => (
                <label key={amenity.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedAmenities.includes(amenity.id)}
                    onChange={() => handleAmenitySelect(amenity.id)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  {amenity.name}
                </label>
              ))}
            </div>
          </div >

          {/* Opening Hours */}
          < div >
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-4">
              <Clock className="h-4 w-4" />
              Opening Hours
            </label>
            <div className="space-y-3">
              {Object.entries(formData.openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32">
                    <input
                      type="checkbox"
                      checked={hours.isActive}
                      onChange={() => handleDayToggle(day)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm capitalize">{day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                      disabled={!hours.isActive}
                      className={`px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 ${hours.isActive ? 'border-slate-300' : 'border-slate-200 bg-slate-50'
                        }`}
                    />
                    <span className="text-sm">to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                      disabled={!hours.isActive}
                      className={`px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 ${hours.isActive ? 'border-slate-300' : 'border-slate-200 bg-slate-50'
                        }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div >

          {/* Action Buttons */}
          < div className="flex justify-end gap-3 pt-6" >
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingBranch(null);
              }}
              className="px-6 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (editingBranch ? 'Update Branch' : 'Add Branch')}
            </button>
          </div >
        </form >
      </div >
    );
  }

  return (
    <div>
      {/* City Filter and Add Button */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select City
          </label>
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.short_code})
              </option>
            ))}
          </select>
        </div>
        <div className="pt-6">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Branch
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">
          <p>Loading branches...</p>
        </div>
      ) : (
        <>
          {/* Branches List */}
          <div className="space-y-3">
            {filteredBranches.map((branch) => (
              <div key={branch.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                    {branch.images && branch.images.length > 0 ? (
                      <img
                        src={branch.images[0]}
                        alt={branch.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Building className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{branch.name}</h3>
                    <p className="text-sm text-slate-500">
                      {branch.city?.name} • {branch.address_line1}
                    </p>
                    {branch.search_location && (
                      <p className="text-sm text-slate-400">
                        Location: {branch.search_location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    isChecked={branch.is_active}
                    onToggle={() => handleToggleBranch(branch)}
                  />
                  <button
                    onClick={() => setViewingBranch(branch)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(branch)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredBranches.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Building className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p>No branches found for the selected city.</p>
                <p className="text-sm">Click "Add Branch" to create your first branch.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BranchViewModal({ branch, onClose }) {
  const parseOpeningHours = (openingHours) => {
    try {
      return typeof openingHours === 'string' ? JSON.parse(openingHours) : openingHours;
    } catch (e) {
      return {
        monday: { open: '09:00', close: '22:00', isActive: true },
        tuesday: { open: '09:00', close: '22:00', isActive: true },
        wednesday: { open: '09:00', close: '22:00', isActive: true },
        thursday: { open: '09:00', close: '22:00', isActive: true },
        friday: { open: '09:00', close: '22:00', isActive: true },
        saturday: { open: '08:00', close: '23:00', isActive: true },
        sunday: { open: '08:00', close: '23:00', isActive: true }
      };
    }
  };

  const openingHours = parseOpeningHours(branch.opening_hours);

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">View Branch Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Branch Images */}
        {branch.images && branch.images.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-3">Branch Images</h3>
            <div className="flex flex-wrap gap-4">
              {branch.images.map((url, index) => (
                <div key={index} className="w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={`${IMAGE_BASE_URL}${url}`}
                    alt={`${branch.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Branch Name</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{branch.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">City</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{branch.city?.name} ({branch.city?.short_code})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Area</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{branch.area?.name}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Location</h3>
            <div className="space-y-3">
              {branch.search_location && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Search Location</label>
                  <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{branch.search_location}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700">Address Line 1</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{branch.address_line1}</p>
              </div>
              {branch.address_line2 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Address Line 2</label>
                  <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{branch.address_line2}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ground Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Ground Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ground Type</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md capitalize">{branch.ground_type}</p>
              </div>
              {branch.ground_overview && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Ground Overview</label>
                  <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{branch.ground_overview}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Active Status</label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {branch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Types */}
        {branch.game_types && branch.game_types.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Available Games</h3>
            <div className="flex flex-wrap gap-2">
              {branch.game_types.map((game) => (
                <span key={game.id} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {game.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {branch.amenities && branch.amenities.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {branch.amenities.map((amenity) => (
                <span key={amenity.id} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {amenity.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Opening Hours */}
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-4">Opening Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(openingHours).map(([day, hours]) => (
              <div key={day} className={`p-3 rounded-lg border ${hours.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900 capitalize">{day}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${hours.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {hours.isActive ? 'Open' : 'Closed'}
                  </span>
                </div>
                {hours.isActive ? (
                  <p className="text-sm text-slate-600">
                    {hours.open} - {hours.close}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 italic">Closed</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BranchesSettings;
