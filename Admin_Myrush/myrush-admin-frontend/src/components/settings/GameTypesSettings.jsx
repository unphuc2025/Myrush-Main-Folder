import { useState, useEffect } from 'react';
import { Edit2, Plus, Target, Trash2, Search, XCircle, Gamepad2 } from 'lucide-react';
import Drawer from './Drawer';
import ToggleSwitch from './ToggleSwitch';
import AddGameTypeForm from './AddGameTypeForm';
import { gameTypesApi } from '../../services/adminApi';

function GameTypesSettings() {
  const [gameTypes, setGameTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer State
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingGameType, setEditingGameType] = useState(null);

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
    setShowDrawer(true);
  };

  const handleEditClick = (gameType) => {
    setEditingGameType(gameType);
    setShowDrawer(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this game type? This might affect existing venues.')) {
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
    await fetchGameTypes();
    setShowDrawer(false);
    setEditingGameType(null);
  };

  const handleToggleGameType = async (gameType) => {
    try {
      // Optimistic update
      setGameTypes(prev => prev.map(gt => gt.id === gameType.id ? { ...gt, is_active: !gt.is_active } : gt));

      const updateData = new FormData();
      updateData.append('name', gameType.name);
      updateData.append('short_code', gameType.short_code);
      updateData.append('description', gameType.description || '');
      updateData.append('is_active', !gameType.is_active);

      if (gameType.icon_url) {
        updateData.append('existing_icon', gameType.icon_url);
      }

      await gameTypesApi.update(gameType.id, updateData);
      // No need to refetch if optimistic update worked, but good for sync
      // await fetchGameTypes();
    } catch (err) {
      console.error('Error toggling game type:', err);
      setError('Failed to update game type status');
      fetchGameTypes(); // Revert
    }
  };

  const filteredGameTypes = gameTypes.filter(gt =>
    gt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gt.short_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          {/* Optional sub-header if needed, otherwise kept clean */}
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm text-slate-900"
            />
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold">Add Sport</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
          <XCircle className="h-5 w-5" />{error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGameTypes.map((gameType) => (
            <div
              key={gameType.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-green-200 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                  {gameType.icon_url ? (
                    <img src={gameType.icon_url} alt={gameType.name} className="w-full h-full object-contain" />
                  ) : (
                    <Gamepad2 className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <ToggleSwitch
                  isChecked={gameType.is_active}
                  onToggle={() => handleToggleGameType(gameType)}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-slate-900">{gameType.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">{gameType.short_code}</span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                  {gameType.description || 'No description available for this sport.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleEditClick(gameType)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-white hover:text-green-600 border border-transparent hover:border-green-200 hover:shadow-sm rounded-lg transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(gameType.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredGameTypes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
              <div className="h-16 w-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Sports Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">Add your first sport/game type to get started with venue creation.</p>
              <button onClick={handleAddClick} className="mt-6 font-bold text-green-600 hover:text-green-700 hover:underline">
                + Add New Sport
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <Drawer
        title={editingGameType ? 'Edit Sport' : 'Add New Sport'}
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
      >
        <AddGameTypeForm
          initialData={editingGameType}
          onCancel={() => setShowDrawer(false)}
          onSave={handleSaveSuccess}
        />
      </Drawer>
    </div>
  );
}

export default GameTypesSettings;
