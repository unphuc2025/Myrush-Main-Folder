import { useState, useEffect } from 'react';
import { Edit2, Plus, MapPin, Eye, Trash2, X } from 'lucide-react';
import Modal from './Modal';
import ToggleSwitch from './ToggleSwitch';
import { citiesApi, areasApi } from '../../services/adminApi';

function CitiesSettings() {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('cities');

  const [showCityModal, setShowCityModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cityFormData, setCityFormData] = useState({
    name: '',
    shortCode: '',
    isActive: true
  });
  const [areaFormData, setAreaFormData] = useState({
    cityId: '',
    name: '',
    isActive: true
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [citiesData, areasData] = await Promise.all([
        citiesApi.getAll(),
        areasApi.getAll()
      ]);
      setCities(citiesData);
      setAreas(areasData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCityClick = () => {
    setEditingCity(null);
    setCityFormData({
      name: '',
      shortCode: '',
      isActive: true
    });
    setShowCityModal(true);
  };

  const handleAddAreaClick = () => {
    setEditingArea(null);
    setAreaFormData({
      cityId: cities.length > 0 ? cities[0].id.toString() : '',
      name: '',
      isActive: true
    });
    setShowAreaModal(true);
  };

  const handleEditCityClick = (city) => {
    setEditingCity(city);
    setCityFormData({
      name: city.name,
      shortCode: city.short_code || '',
      isActive: city.is_active
    });
    setShowCityModal(true);
  };

  const handleEditAreaClick = (area) => {
    setEditingArea(area);
    setAreaFormData({
      cityId: area.city_id.toString(),
      name: area.name,
      isActive: area.is_active
    });
    setShowAreaModal(true);
  };

  const handleDeleteCity = async (id) => {
    if (window.confirm('Are you sure you want to delete this city? This will also delete all associated areas and branches.')) {
      try {
        await citiesApi.delete(id);
        await fetchData();
      } catch (err) {
        console.error('Error deleting city:', err);
        setError('Failed to delete city');
      }
    }
  };

  const handleDeleteArea = async (id) => {
    if (window.confirm('Are you sure you want to delete this area?')) {
      try {
        await areasApi.delete(id);
        await fetchData();
      } catch (err) {
        console.error('Error deleting area:', err);
        setError('Failed to delete area');
      }
    }
  };

  const handleCitySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        name: cityFormData.name,
        short_code: cityFormData.shortCode,
        is_active: cityFormData.isActive
      };

      if (editingCity) {
        await citiesApi.update(editingCity.id, data);
      } else {
        await citiesApi.create(data);
      }

      await fetchData();
      setShowCityModal(false);
      setEditingCity(null);
    } catch (err) {
      console.error('Error saving city:', err);
      setError('Failed to save city');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAreaSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        city_id: areaFormData.cityId, // Keep as UUID string
        name: areaFormData.name,
        is_active: areaFormData.isActive
      };

      if (editingArea) {
        await areasApi.update(editingArea.id, data);
      } else {
        await areasApi.create(data);
      }

      await fetchData();
      setShowAreaModal(false);
      setEditingArea(null);
    } catch (err) {
      console.error('Error saving area:', err);
      setError('Failed to save area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCityModal = () => {
    setShowCityModal(false);
    setEditingCity(null);
  };

  const handleCloseAreaModal = () => {
    setShowAreaModal(false);
    setEditingArea(null);
  };

  const handleToggleCity = async (city) => {
    try {
      await citiesApi.update(city.id, {
        name: city.name,
        short_code: city.short_code,
        is_active: !city.is_active
      });
      await fetchData();
    } catch (err) {
      console.error('Error toggling city:', err);
      setError('Failed to update city status');
    }
  };

  const handleToggleArea = async (area) => {
    try {
      await areasApi.update(area.id, {
        city_id: area.city_id,
        name: area.name,
        is_active: !area.is_active
      });
      await fetchData();
    } catch (err) {
      console.error('Error toggling area:', err);
      setError('Failed to update area status');
    }
  };

  const [viewingItem, setViewingItem] = useState(null);

  const CitiesSection = () => (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Cities</h2>
        <button
          onClick={handleAddCityClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add City
        </button>
      </div>

      {/* Cities List */}
      <div className="space-y-3">
        {cities.map((city) => (
          <div key={city.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-medium text-slate-900">{city.name}</h3>
                <p className="text-sm text-slate-500">
                  {city.short_code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                isChecked={city.is_active}
                onToggle={() => handleToggleCity(city)}
              />
              <button
                onClick={() => handleEditCityClick(city)}
                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {cities.length === 0 && (
          <p className="text-center text-slate-500 py-4">No cities found.</p>
        )}
      </div>
    </div>
  );

  const AreasSection = () => (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Areas</h2>
        <button
          onClick={handleAddAreaClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Area
        </button>
      </div>

      {/* Areas List */}
      <div className="space-y-3">
        {areas.map((area) => (
          <div key={area.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900">{area.name}</h3>
                <p className="text-sm text-slate-500">{area.city?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                isChecked={area.is_active}
                onToggle={() => handleToggleArea(area)}
              />
              <button
                onClick={() => handleEditAreaClick(area)}
                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit/View"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {areas.length === 0 && (
          <p className="text-center text-slate-500 py-4">No areas found.</p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSection('cities')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'cities'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            Cities
          </button>
          <button
            onClick={() => setActiveSection('areas')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'areas'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            Areas
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        activeSection === 'cities' ? <CitiesSection /> : <AreasSection />
      )}

      {/* City Modal */}
      {showCityModal && (
        <Modal title={editingCity ? 'Edit City' : 'Add City'} onClose={handleCloseCityModal}>
          <form onSubmit={handleCitySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                City Name *
              </label>
              <input
                type="text"
                value={cityFormData.name}
                onChange={(e) => setCityFormData({ ...cityFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                City Short Code
              </label>
              <input
                type="text"
                value={cityFormData.shortCode}
                onChange={(e) => setCityFormData({ ...cityFormData, shortCode: e.target.value })}
                placeholder="e.g., HYD"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={cityFormData.isActive}
                onChange={(e) => setCityFormData({ ...cityFormData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseCityModal}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Area Modal */}
      {showAreaModal && (
        <Modal title={editingArea ? 'Edit Area' : 'Add Area'} onClose={handleCloseAreaModal}>
          <form onSubmit={handleAreaSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                City *
              </label>
              <select
                value={areaFormData.cityId}
                onChange={(e) => setAreaFormData({ ...areaFormData, cityId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select City</option>
                {cities.filter(city => city.is_active).map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.short_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Area Name *
              </label>
              <input
                type="text"
                value={areaFormData.name}
                onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                placeholder="e.g., Gachibowli, Kukatpally"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="areaIsActive"
                checked={areaFormData.isActive}
                onChange={(e) => setAreaFormData({ ...areaFormData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="areaIsActive" className="text-sm font-medium text-slate-700">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseAreaModal}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default CitiesSettings;
