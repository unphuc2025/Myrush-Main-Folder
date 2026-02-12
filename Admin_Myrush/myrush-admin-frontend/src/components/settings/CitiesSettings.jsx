import { useState, useEffect } from 'react';
import { Edit2, Plus, MapPin, Trash2, Search, XCircle, ChevronDown, Building2, Tag, Hash } from 'lucide-react';
import Drawer from './Drawer';
import ToggleSwitch from './ToggleSwitch';
import { citiesApi, areasApi } from '../../services/adminApi';

function CitiesSettings() {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('cities');
  const [searchTerm, setSearchTerm] = useState('');

  const [showCityModal, setShowCityModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  // Add these state declarations
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
    setCityFormData({ name: '', shortCode: '', isActive: true });
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
    } catch (err) {
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
        city_id: areaFormData.cityId,
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
    } catch (err) {
      setError('Failed to save area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCity = async (city) => {
    try {
      // Optimistic update
      setCities(cities.map(c => c.id === city.id ? { ...c, is_active: !c.is_active } : c));
      await citiesApi.update(city.id, {
        name: city.name,
        short_code: city.short_code,
        is_active: !city.is_active
      });
    } catch (err) {
      console.error('Error toggling city:', err);
      // Revert on error
      fetchData();
    }
  };

  const handleToggleArea = async (area) => {
    try {
      // Optimistic update
      setAreas(areas.map(a => a.id === area.id ? { ...a, is_active: !a.is_active } : a));
      await areasApi.update(area.id, {
        city_id: area.city_id,
        name: area.name,
        is_active: !area.is_active
      });
    } catch (err) {
      // Revert on error
      fetchData();
    }
  };

  // Filtering
  const filteredCities = cities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredAreas = areas.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.city?.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // UI Components


  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSection('cities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeSection === 'cities' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Cities
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeSection === 'cities' ? 'bg-slate-100' : 'bg-white'}`}>{cities.length}</span>
          </button>
          <button
            onClick={() => setActiveSection('areas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeSection === 'areas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Areas
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeSection === 'areas' ? 'bg-slate-100' : 'bg-white'}`}>{areas.length}</span>
          </button>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeSection}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm text-slate-900"
            />
          </div>
          <button
            onClick={activeSection === 'cities' ? handleAddCityClick : handleAddAreaClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold">Add New</span>
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2"><XCircle className="h-5 w-5" />{error}</div>}

      {/* Table Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading data...</div>
        ) : (activeSection === 'cities' ? (
          <div>
            {/* Desktop Table - Cities */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">City Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Short Code</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCities.map(city => (
                    <tr key={city.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{city.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{city.short_code}</td>
                      <td className="px-6 py-4">
                        <ToggleSwitch
                          isChecked={city.is_active}
                          onToggle={() => handleToggleCity(city)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditCityClick(city)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteCity(city.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Cities */}
            <div className="md:hidden space-y-3 p-4">
              {filteredCities.map(city => (
                <div key={city.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">{city.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{city.short_code}</p>
                    </div>
                    <ToggleSwitch
                      isChecked={city.is_active}
                      onToggle={() => handleToggleCity(city)}
                    />
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                    <button
                      onClick={() => handleEditCityClick(city)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCity(city.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCities.length === 0 && <EmptyState term="cities" />}
          </div>
        ) : (
          <div>
            {/* Desktop Table - Areas */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Area Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAreas.map(area => (
                    <tr key={area.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{area.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{area.city?.name}</td>
                      <td className="px-6 py-4">
                        <ToggleSwitch
                          isChecked={area.is_active}
                          onToggle={() => handleToggleArea(area)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditAreaClick(area)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteArea(area.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Areas */}
            <div className="md:hidden space-y-3 p-4">
              {filteredAreas.map(area => (
                <div key={area.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">{area.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {area.city?.name}
                      </div>
                    </div>
                    <ToggleSwitch
                      isChecked={area.is_active}
                      onToggle={() => handleToggleArea(area)}
                    />
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                    <button
                      onClick={() => handleEditAreaClick(area)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteArea(area.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredAreas.length === 0 && <EmptyState term="areas" />}
          </div>
        ))}
      </div>

      {/* Modals - (Kept mostly same as previous iteration for consistency) */}
      <Drawer
        title={editingCity ? 'Edit City' : 'Add New City'}
        isOpen={showCityModal}
        onClose={() => setShowCityModal(false)}
      >
        <form onSubmit={handleCitySubmit} className="flex flex-col h-full">
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">City Name</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  value={cityFormData.name}
                  onChange={e => setCityFormData({ ...cityFormData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                  required
                  placeholder="e.g. Hyderabad"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Short Code</label>
              <div className="relative group">
                <Tag className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  value={cityFormData.shortCode}
                  onChange={e => setCityFormData({ ...cityFormData, shortCode: e.target.value.toUpperCase() })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg uppercase placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                  placeholder="e.g. HYD"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700">Operational Status</span>
                <ToggleSwitch isChecked={cityFormData.isActive} onToggle={() => setCityFormData({ ...cityFormData, isActive: !cityFormData.isActive })} />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto border-t border-slate-100 flex gap-4 pb-6">
            <button
              type="button"
              onClick={() => setShowCityModal(false)}
              className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] px-6 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg shadow-slate-900/10"
            >
              {isSubmitting ? 'Saving Changes...' : (editingCity ? 'Update City' : 'Create City')}
            </button>
          </div>
        </form>
      </Drawer>

      <Drawer
        title={editingArea ? 'Edit Area' : 'Add New Area'}
        isOpen={showAreaModal}
        onClose={() => setShowAreaModal(false)}
      >
        <form onSubmit={handleAreaSubmit} className="flex flex-col h-full">
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Parent City</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <select
                  value={areaFormData.cityId}
                  onChange={e => setAreaFormData({ ...areaFormData, cityId: e.target.value })}
                  className="w-full pl-12 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg appearance-none shadow-sm hover:border-slate-300"
                  required
                >
                  <option value="">Select a City</option>
                  {cities.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-green-600 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Area Name</label>
              <div className="relative group">
                <Hash className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  value={areaFormData.name}
                  onChange={e => setAreaFormData({ ...areaFormData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-all font-medium text-lg placeholder:text-slate-300 shadow-sm hover:border-slate-300"
                  required
                  placeholder="e.g. Gachibowli"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700">Area Status</span>
                <ToggleSwitch isChecked={areaFormData.isActive} onToggle={() => setAreaFormData({ ...areaFormData, isActive: !areaFormData.isActive })} />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto border-t border-slate-100 flex gap-4 pb-6">
            <button
              type="button"
              onClick={() => setShowAreaModal(false)}
              className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] px-6 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg shadow-slate-900/10"
            >
              {isSubmitting ? 'Saving Changes...' : (editingArea ? 'Update Area' : 'Create Area')}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

const EmptyState = ({ term }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <Search className="h-8 w-8 text-slate-300" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900">No {term} found</h3>
    <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or add a new {term.slice(0, -1)} to get started.</p>
  </div>
);

export default CitiesSettings;
