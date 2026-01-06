import { useState, useEffect } from 'react';
import { Edit2, Plus, Star, Eye, Trash2, X } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import AddAmenityForm from './AddAmenityForm';
import { amenitiesApi } from '../../services/adminApi';

function AmenitiesSettings() {
  const [amenities, setAmenities] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'add'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [viewingAmenity, setViewingAmenity] = useState(null);

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
      setError('Failed to load amenities');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingAmenity(null);
    setView('add');
  };

  const handleEditClick = (amenity) => {
    setEditingAmenity(amenity);
    setView('add');
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this amenity?')) {
      try {
        await amenitiesApi.delete(id);
        await fetchAmenities();
      } catch (err) {
        console.error('Error deleting amenity:', err);
        setError('Failed to delete amenity');
      }
    }
  };

  const handleSaveSuccess = async () => {
    await fetchAmenities();
    setView('list');
    setEditingAmenity(null);
  };

  const handleToggleAmenity = async (amenity) => {
    try {
      const updateData = new FormData();
      updateData.append('name', amenity.name);
      updateData.append('description', amenity.description || '');
      updateData.append('is_active', !amenity.is_active);

      if (amenity.icon_url) {
        updateData.append('existing_icon', amenity.icon_url);
      }

      await amenitiesApi.update(amenity.id, updateData);
      await fetchAmenities();
    } catch (err) {
      console.error('Error toggling amenity:', err);
      setError('Failed to update amenity status');
    }
  };

  if (viewingAmenity) {
    return (
      <AmenityViewModal
        amenity={viewingAmenity}
        onClose={() => setViewingAmenity(null)}
      />
    );
  }

  if (view === 'add') {
    return (
      <AddAmenityForm
        onCancel={() => {
          setView('list');
          setEditingAmenity(null);
        }}
        onSave={handleSaveSuccess}
        initialData={editingAmenity}
      />
    );
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Amenities</h2>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Amenity
        </button>
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
          <p>Loading amenities...</p>
        </div>
      ) : (
        <>
          {/* List */}
          <div className="space-y-3">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                    {amenity.icon_url ? (
                      <img src={amenity.icon_url} alt={amenity.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Star className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{amenity.name}</h3>
                    {amenity.description && (
                      <p className="text-sm text-slate-500">{amenity.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    isChecked={amenity.is_active}
                    onToggle={() => handleToggleAmenity(amenity)}
                  />
                  <button
                    onClick={() => setViewingAmenity(amenity)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(amenity)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {amenities.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Star className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p>No amenities added yet.</p>
                <p className="text-sm">Click "Add Amenity" to create your first amenity.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AmenityViewModal({ amenity, onClose }) {
  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">View Amenity Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Amenity Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-lg overflow-hidden flex items-center justify-center">
            {amenity.icon_url ? (
              <img src={amenity.icon_url} alt={amenity.name} className="w-full h-full object-contain" />
            ) : (
              <Star className="h-10 w-10 text-green-600" />
            )}
          </div>
        </div>

        {/* Amenity Information */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Amenity Name</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{amenity.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{amenity.description || 'No description provided'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Active Status</label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${amenity.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {amenity.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
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

export default AmenitiesSettings;
