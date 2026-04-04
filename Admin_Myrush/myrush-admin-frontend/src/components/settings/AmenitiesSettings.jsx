import { useState, useEffect } from 'react';
import { Edit2, Plus, Star, Trash2, Search, XCircle } from 'lucide-react';
import Drawer from './Drawer';
import ToggleSwitch from './ToggleSwitch';
import AddAmenityForm from './AddAmenityForm';
import { amenitiesApi, getImageUrl } from '../../services/adminApi';

function AmenitiesSettings() {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Permission Logic
  const adminInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');
  const isSuperAdmin = adminInfo.role === 'super_admin';
  const permissions = adminInfo.permissions?.['Amenities Management'] || {};
  const canAdd = isSuperAdmin || permissions.add;
  const canEdit = isSuperAdmin || permissions.edit;
  const canDelete = isSuperAdmin || permissions.delete;

  // Drawer State
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState(null);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await amenitiesApi.getAll();
      setAmenities(data);
    } catch (err) {
      console.error('Error fetching amenities:', err);
      const status = err.response?.status;
      const errorMsg = (status === 403 || status === 401 || err.message?.toLowerCase().includes('authorized') || err.message?.toLowerCase().includes('access'))
        ? 'You do not have access to view amenities.'
        : 'Failed to load amenities';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingAmenity(null);
    setShowDrawer(true);
  };

  const handleEditClick = (amenity) => {
    setEditingAmenity(amenity);
    setShowDrawer(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this amenity?')) {
      try {
        await amenitiesApi.delete(id);
        await fetchAmenities();
      } catch (err) {
        console.error('Error deleting amenity:', err);
        const errorMsg = err.message && (err.message.toLowerCase().includes('authorized') || err.message.includes('403') || err.message.toLowerCase().includes('access'))
          ? 'You do not have access to delete amenities.'
          : (err.message || 'Failed to delete amenity');
        setError(errorMsg);
        alert(errorMsg);
      }
    }
  };

  const handleSaveSuccess = async () => {
    await fetchAmenities();
    setShowDrawer(false);
    setEditingAmenity(null);
  };

  const handleToggleAmenity = async (amenity) => {
    try {
      // Optimistic update
      setAmenities(prev => prev.map(a => a.id === amenity.id ? { ...a, is_active: !a.is_active } : a));

      const updateData = new FormData();
      updateData.append('name', amenity.name);
      updateData.append('description', amenity.description || '');
      updateData.append('is_active', !amenity.is_active);

      if (amenity.icon_url) {
        updateData.append('existing_icon', amenity.icon_url);
      }

      await amenitiesApi.update(amenity.id, updateData);
    } catch (err) {
      console.error('Error toggling amenity:', err);
      const errorMsg = err.message && (err.message.toLowerCase().includes('authorized') || err.message.includes('403') || err.message.toLowerCase().includes('access'))
        ? 'You do not have access to update amenities.'
        : 'Failed to update amenity status';
      setError(errorMsg);
      fetchAmenities(); // Revert
    }
  };

  const filteredAmenities = amenities.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
          <XCircle className="h-5 w-5" />{error}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div></div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm text-slate-900"
            />
          </div>
          {canAdd && (
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-semibold">Add Amenity</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAmenities.map((amenity) => (
            <div
              key={amenity.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-green-200 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                  {amenity.icon_url ? (
                    <img src={`${getImageUrl(amenity.icon_url)}?t=${new Date().getTime()}`} alt={amenity.name} className="w-full h-full object-contain" />
                  ) : (
                    <Star className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <ToggleSwitch
                  isChecked={amenity.is_active}
                  onToggle={() => canEdit && handleToggleAmenity(amenity)}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{amenity.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                  {amenity.description || 'No description available.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                {canEdit && (
                  <button
                    onClick={() => handleEditClick(amenity)}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="text-sm font-bold">Edit</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteClick(amenity.id)}
                    className="min-h-[44px] flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredAmenities.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
              <div className="h-16 w-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Amenities Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">Create amenities to help users filter venues by features.</p>
              {canAdd && (
                <button onClick={handleAddClick} className="mt-6 font-bold text-green-600 hover:text-green-700 hover:underline">
                  + Add New Amenity
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <Drawer
        title={editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
      >
        <AddAmenityForm
          initialData={editingAmenity}
          onCancel={() => setShowDrawer(false)}
          onSave={handleSaveSuccess}
        />
      </Drawer>
    </div>
  );
}

export default AmenitiesSettings;
