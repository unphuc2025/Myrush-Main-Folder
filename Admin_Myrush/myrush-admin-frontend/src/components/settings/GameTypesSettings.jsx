import { useState, useEffect } from 'react';
import { Edit2, Plus, Target, Eye, Trash2, X } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import AddGameTypeForm from './AddGameTypeForm';
import { gameTypesApi } from '../../services/adminApi';

function GameTypesSettings() {
  const [gameTypes, setGameTypes] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'add'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingGameType, setEditingGameType] = useState(null);
  const [viewingGameType, setViewingGameType] = useState(null);

  // Fetch game types from API
  useEffect(() => {
    fetchGameTypes();
  }, []);

  const fetchGameTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gameTypesApi.getAll();
      setGameTypes(data);
    } catch (err) {
      console.error('Error fetching game types:', err);
      setError('Failed to load game types');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingGameType(null);
    setView('add');
  };

  const handleEditClick = (gameType) => {
    setEditingGameType(gameType);
    setView('add');
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this game type?')) {
      try {
        await gameTypesApi.delete(id);
        await fetchGameTypes();
      } catch (err) {
        console.error('Error deleting game type:', err);
        setError('Failed to delete game type');
      }
    }
  };

  const handleSaveSuccess = async () => {
    // Refresh the list after creating/updating a game type
    await fetchGameTypes();
    setView('list');
    setEditingGameType(null);
  };

  if (viewingGameType) {
    return (
      <GameTypeViewModal
        gameType={viewingGameType}
        onClose={() => setViewingGameType(null)}
      />
    );
  }

  const handleToggleGameType = async (gameType) => {
    try {
      const updateData = new FormData();
      updateData.append('name', gameType.name);
      updateData.append('short_code', gameType.short_code);
      updateData.append('description', gameType.description || '');
      updateData.append('is_active', !gameType.is_active);

      if (gameType.icon_url) {
        updateData.append('existing_icon', gameType.icon_url);
      }

      await gameTypesApi.update(gameType.id, updateData);
      await fetchGameTypes();
    } catch (err) {
      console.error('Error toggling game type:', err);
      setError('Failed to update game type status');
    }
  };

  if (view === 'add') {
    return (
      <AddGameTypeForm
        onCancel={() => {
          setView('list');
          setEditingGameType(null);
        }}
        onSave={handleSaveSuccess}
        initialData={editingGameType}
      />
    );
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Game Types</h2>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Game Type
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
          <p>Loading game types...</p>
        </div>
      ) : (
        <>
          {/* List */}
          <div className="space-y-3">
            {gameTypes.map((gameType) => (
              <div key={gameType.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                    {gameType.icon_url ? (
                      <img src={gameType.icon_url} alt={gameType.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{gameType.name}</h3>
                    <p className="text-sm text-slate-500">
                      {gameType.short_code}
                    </p>
                    {gameType.description && (
                      <p className="text-sm text-slate-400 mt-1">
                        {gameType.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    isChecked={gameType.is_active}
                    onToggle={() => handleToggleGameType(gameType)}
                  />
                  <button
                    onClick={() => setViewingGameType(gameType)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(gameType)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {gameTypes.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p>No game types added yet.</p>
                <p className="text-sm">Click "Add Game Type" to create your first game type.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function GameTypeViewModal({ gameType, onClose }) {
  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">View Game Type Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Game Type Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-lg overflow-hidden flex items-center justify-center">
            {gameType.icon_url ? (
              <img src={gameType.icon_url} alt={gameType.name} className="w-full h-full object-contain" />
            ) : (
              <Target className="h-10 w-10 text-green-600" />
            )}
          </div>
        </div>

        {/* Game Type Information */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Game Type Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Game Type Name</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{gameType.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Short Code</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{gameType.short_code || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md">{gameType.description || 'No description provided'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Active Status</label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${gameType.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {gameType.is_active ? 'Active' : 'Inactive'}
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

export default GameTypesSettings;
