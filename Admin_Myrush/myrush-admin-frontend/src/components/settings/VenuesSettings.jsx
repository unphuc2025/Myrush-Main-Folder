import { useState, useEffect, useRef } from 'react';
import {
  Edit2, Plus, Building, Upload, X, MapPin, Clock, Camera, ChevronDown,
  Trash2, Search, Building2, Tag, Hash, Image as ImageIcon, Gamepad2,
  CheckCircle2, Info, Map as MapIcon, XCircle
} from 'lucide-react';
import Drawer from './Drawer';
import ToggleSwitch from './ToggleSwitch';
import { citiesApi, areasApi, gameTypesApi, amenitiesApi, branchesApi } from '../../services/adminApi';

function VenuesSettings() {
  const [venues, setVenues] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [selectedCityId, setSelectedCityId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [viewingVenue, setViewingVenue] = useState(null);
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
      setVenues(branchesData);
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

  // Filter venues
  const filteredVenues = venues.filter(venue => {
    const matchesCity = selectedCityId ? venue.city_id === selectedCityId : true;
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const handleAddClick = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      cityId: '',
      areaId: '',
      searchLocation: '',
      addressLine1: '',
      addressLine2: '',
      groundOverview: '',
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
    setShowDrawer(true);
  };

  const handleEditClick = (venue) => {
    setEditingVenue(venue);

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

    if (venue.opening_hours) {
      try {
        openingHours = typeof venue.opening_hours === 'string'
          ? JSON.parse(venue.opening_hours)
          : venue.opening_hours;
      } catch (e) {
        console.error("Error parsing opening hours", e);
      }
    }

    setFormData({
      name: venue.name,
      cityId: venue.city_id ? venue.city_id.toString() : '',
      areaId: venue.area_id ? venue.area_id.toString() : '',
      searchLocation: venue.search_location || '',
      addressLine1: venue.address_line1 || '',
      addressLine2: venue.address_line2 || '',
      groundOverview: venue.ground_overview || '',
      groundType: venue.ground_type || 'single',
      selectedGames: venue.game_types?.map(gt => gt.id) || [],
      selectedAmenities: venue.amenities?.map(am => am.id) || [],
      openingHours: openingHours,
      images: [],
      imagePreviews: [],
      existingImages: venue.images || [],
      isActive: venue.is_active
    });
    setShowDrawer(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      try {
        await branchesApi.delete(id);
        await fetchAllData();
      } catch (err) {
        console.error('Error deleting venue:', err);
        setError('Failed to delete venue');
      }
    }
  };

  const handleToggleVenue = async (venue) => {
    try {
      // Optimistic update
      setVenues(venues.map(v => v.id === venue.id ? { ...v, is_active: !v.is_active } : v));

      const updateData = new FormData();
      updateData.append('name', venue.name);
      updateData.append('city_id', venue.city_id);
      updateData.append('area_id', venue.area_id);
      updateData.append('is_active', !venue.is_active);

      await branchesApi.update(venue.id, updateData);

    } catch (err) {
      console.error('Error toggling venue:', err);
      setError('Failed to update venue status');
      fetchAllData(); // Revert on error
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
      submitData.append('ground_type', formData.groundType);
      submitData.append('opening_hours', JSON.stringify(formData.openingHours));
      submitData.append('is_active', formData.isActive);

      // Append arrays
      formData.selectedGames.forEach(id => submitData.append('game_types[]', id));
      formData.selectedAmenities.forEach(id => submitData.append('amenities[]', id));

      // Append images
      formData.images.forEach(file => submitData.append('images', file));

      if (editingVenue) {
        // Append existing images for update
        formData.existingImages.forEach(url => submitData.append('existing_images', url));
        await branchesApi.update(editingVenue.id, submitData);
      } else {
        await branchesApi.create(submitData);
      }

      // Refresh data and close form
      await fetchAllData();
      setShowDrawer(false);
      setEditingVenue(null);
    } catch (err) {
      console.error('Error saving venue:', err);
      setError(err.message || 'Failed to save venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter areas based on selected city
  const filteredAreas = formData.cityId ? areas.filter(area => area.city_id == formData.cityId) : [];

  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        {/* City Filter */}
        {/* City Filter */}
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
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

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold">Add Venue</span>
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2"><XCircle className="h-5 w-5" />{error}</div>}

      {/* Venues Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading venues...</div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Venue</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVenues.map(venue => (
                    <tr key={venue.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {venue.images && venue.images.length > 0 ? (
                              <img src={venue.images[0]} alt={venue.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{venue.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{venue.address_line1}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{cities.find(c => c.id === venue.city_id)?.name}</span>
                          <span className="text-xs text-slate-500">{areas.find(a => a.id === venue.area_id)?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize ${venue.ground_type === 'multiple' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {venue.ground_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ToggleSwitch
                          isChecked={venue.is_active}
                          onToggle={() => handleToggleVenue(venue)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button onClick={() => handleEditClick(venue)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(venue.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredVenues.length === 0 && (
                    <tr className="hidden md:table-row">
                      <td colSpan="5" className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center">
                          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="font-medium">No venues found</p>
                          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {filteredVenues.map(venue => (
                <div key={venue.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                      {venue.images && venue.images.length > 0 ? (
                        <img src={venue.images[0]} alt={venue.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{venue.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{venue.address_line1}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide capitalize ${venue.ground_type === 'multiple' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {venue.ground_type}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <MapPin className="h-3 w-3" />
                          {cities.find(c => c.id === venue.city_id)?.name}, {areas.find(a => a.id === venue.area_id)?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <ToggleSwitch
                      isChecked={venue.is_active}
                      onToggle={() => handleToggleVenue(venue)}
                      label={venue.is_active ? 'Active' : 'Inactive'}
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditClick(venue)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-slate-50">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(venue.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-slate-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredVenues.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="font-medium">No venues found</p>
                    <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Form */}
      <Drawer
        title={editingVenue ? 'Edit Venue' : 'Add New Venue'}
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full pb-6">
          <div className="flex-1 space-y-6">

            {/* Images Section */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Venue Images</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-center cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5 text-slate-400" />
                  </div>
                  <span className="text-sm font-medium">Click to upload images</span>
                  <span className="text-xs">Max 5 images recommended</span>
                </div>
              </div>

              {/* Image Previews */}
              {(formData.existingImages.length > 0 || formData.imagePreviews.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={url} alt="Venue" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => handleRemoveExistingImage(index)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {formData.imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={preview.url} alt="Venue" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage(index)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Venue Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Venue Name</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                  required
                  placeholder="e.g. Hyderabad Sports Complex"
                />
              </div>
            </div>

            {/* City & Area Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                  {!isAddingCity && (
                    <button type="button" onClick={() => setIsAddingCity(true)} className="text-[10px] font-bold text-green-600 hover:text-green-700 uppercase tracking-wide flex items-center gap-1">
                      <Plus className="h-3 w-3" /> New
                    </button>
                  )}
                </div>
                {isAddingCity ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <input
                      autoFocus
                      placeholder="Name"
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      value={newCityData.name}
                      onChange={e => setNewCityData({ ...newCityData, name: e.target.value })}
                    />
                    <input
                      placeholder="Code (e.g HYD)"
                      className="w-full px-3 py-2 text-sm border rounded-lg uppercase"
                      value={newCityData.shortCode}
                      onChange={e => setNewCityData({ ...newCityData, shortCode: e.target.value.toUpperCase() })}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={handleCreateCity} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg font-medium">Add</button>
                      <button type="button" onClick={() => setIsAddingCity(false)} className="flex-1 bg-white border text-slate-600 text-xs py-1.5 rounded-lg font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                    <select
                      value={formData.cityId}
                      onChange={(e) => setFormData({ ...formData, cityId: e.target.value, areaId: '' })}
                      className="w-full pl-12 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium appearance-none shadow-sm hover:border-slate-300"
                      required
                    >
                      <option value="">Select City</option>
                      {cities.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Area</label>
                  {!isAddingArea && formData.cityId && (
                    <button type="button" onClick={() => setIsAddingArea(true)} className="text-[10px] font-bold text-green-600 hover:text-green-700 uppercase tracking-wide flex items-center gap-1">
                      <Plus className="h-3 w-3" /> New
                    </button>
                  )}
                </div>
                {isAddingArea ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <input
                      autoFocus
                      placeholder="Area Name"
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      value={newAreaName}
                      onChange={e => setNewAreaName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={handleCreateArea} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg font-medium">Add</button>
                      <button type="button" onClick={() => setIsAddingArea(false)} className="flex-1 bg-white border text-slate-600 text-xs py-1.5 rounded-lg font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <Hash className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                    <select
                      value={formData.areaId}
                      onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                      className="w-full pl-12 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium appearance-none shadow-sm hover:border-slate-300"
                      disabled={!formData.cityId}
                      required
                    >
                      <option value="">Select Area</option>
                      {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Address Lines */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Address</label>
              <div className="space-y-3">
                <div className="relative group">
                  <MapIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={formData.addressLine1}
                    onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium shadow-sm hover:border-slate-300"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={formData.addressLine2}
                  onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium shadow-sm hover:border-slate-300"
                />
              </div>
            </div>

            {/* Ground Type */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ground Type</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.groundType === 'single' ? 'border-green-500 bg-green-50/50 text-green-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input type="radio" value="single" checked={formData.groundType === 'single'} onChange={e => setFormData({ ...formData, groundType: e.target.value })} className="hidden" />
                  <div className="h-4 w-4 rounded-full border border-current flex items-center justify-center">
                    {formData.groundType === 'single' && <div className="h-2 w-2 rounded-full bg-current" />}
                  </div>
                  <span className="font-medium text-sm">Single Ground</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.groundType === 'multiple' ? 'border-purple-500 bg-purple-50/50 text-purple-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input type="radio" value="multiple" checked={formData.groundType === 'multiple'} onChange={e => setFormData({ ...formData, groundType: e.target.value })} className="hidden" />
                  <div className="h-4 w-4 rounded-full border border-current flex items-center justify-center">
                    {formData.groundType === 'multiple' && <div className="h-2 w-2 rounded-full bg-current" />}
                  </div>
                  <span className="font-medium text-sm">Multiple Grounds</span>
                </label>
              </div>
            </div>

            {/* Games Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Available Games</label>
              <div className="relative group" ref={gameDropdownRef}>
                <div
                  className="w-full min-h-[52px] px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus-within:border-green-500 cursor-pointer shadow-sm hover:border-slate-300 flex flex-wrap gap-2 items-center"
                  onClick={() => setShowGameDropdown(!showGameDropdown)}
                >
                  <Gamepad2 className="h-5 w-5 text-slate-400 mr-2" />
                  {formData.selectedGames.length > 0 ? (
                    formData.selectedGames.map(id => {
                      const game = gameTypes.find(g => g.id === id);
                      if (!game) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-lg uppercase tracking-wide">
                          {game.name}
                          <X className="h-3 w-3 cursor-pointer hover:text-green-900" onClick={(e) => { e.stopPropagation(); handleGameSelect(id); }} />
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-400">Select games...</span>
                  )}
                  <ChevronDown className={`ml-auto h-5 w-5 text-slate-400 transition-transform ${showGameDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showGameDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2">
                    {gameTypes.filter(g => g.is_active && !formData.selectedGames.includes(g.id)).map(game => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => { handleGameSelect(game.id); setShowGameDropdown(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center justify-between group"
                      >
                        {game.name}
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 text-green-600" />
                      </button>
                    ))}
                    {gameTypes.filter(g => g.is_active && !formData.selectedGames.includes(g.id)).length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-2">No more games available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Amenities</label>
              <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {amenities.filter(a => a.is_active).map(amenity => {
                  const isSelected = formData.selectedAmenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => handleAmenitySelect(amenity.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${isSelected ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {amenity.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opening Hours Section */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Opening Hours</label>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {Object.entries(formData.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-24">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hours.isActive ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}>
                          {hours.isActive && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <input type="checkbox" checked={hours.isActive} onChange={() => handleDayToggle(day)} className="hidden" />
                        <span className="text-sm font-semibold capitalize text-slate-700">{day}</span>
                      </label>
                    </div>
                    {hours.isActive ? (
                      <>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-green-500"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-green-500"
                        />
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex gap-4">
            <button
              type="button"
              onClick={() => setShowDrawer(false)}
              className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] px-6 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : null}
              {isSubmitting ? 'Saving...' : (editingVenue ? 'Update Venue' : 'Create Venue')}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default VenuesSettings;
