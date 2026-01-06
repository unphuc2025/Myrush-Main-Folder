import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchVenues, createVenue, updateVenue } from '../services/adminVenueApi.js';
import { Plus, Save, X, Image as ImageIcon, Film, MapPin, DollarSign, FileText, Edit2 } from 'lucide-react';

const sportTypes = [
  'Pickleball', 'Football', 'Badminton', 'Frisbee', 'Squash', 'Table Tennis', 'Volleyball',
  'Swimming', 'Box Cricket', 'Basketball', 'Cricket Nets', 'Cricket Practice Nets', 'Bowling Machine Nets'
];

function Venues() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    game_type: '',
    court_name: '',
    location: '',
    prices: '',
    description: '',
    photos: [],
    videos: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    } else {
      loadVenues();
    }
  }, [navigate]);

  const loadVenues = async () => {
    try {
      const data = await fetchVenues();
      setVenues(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load venues. Please try again.' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: Array.from(files) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('game_type', formData.game_type);
      data.append('court_name', formData.court_name);
      data.append('location', formData.location);
      data.append('prices', formData.prices);
      data.append('description', formData.description);
      formData.photos.forEach(photo => data.append('photos', photo));
      formData.videos.forEach(video => data.append('videos', video));

      if (editing) {
        await updateVenue(editing.id, data);
        setMessage({ type: 'success', text: 'Venue updated successfully!' });
      } else {
        await createVenue(data);
        setMessage({ type: 'success', text: 'Venue added successfully!' });
      }

      loadVenues();
      resetForm();
      setEditing(null);
      setShowForm(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save venue. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      game_type: '',
      court_name: '',
      location: '',
      prices: '',
      description: '',
      photos: [],
      videos: []
    });
  };

  const handleEdit = (venue) => {
    setEditing(venue);
    setFormData({
      game_type: venue.game_type,
      court_name: venue.court_name || '',
      location: venue.location,
      prices: venue.prices,
      description: venue.description,
      photos: [],
      videos: []
    });
    setMessage({ type: '', text: '' });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    resetForm();
    setShowForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigate('/login');
  };

  if (showForm) {
    return (
      <Layout onLogout={handleLogout}>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Add/Edit Venue</h1>
              <p className="mt-1 text-slate-500">Manage venue details.</p>
            </div>
            <button
              onClick={cancelEdit}
              className="rounded-lg p-3 text-slate-400 hover:bg-slate-50 hover:text-red-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 flex items-center rounded-lg p-4 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Game Type</label>
                <select
                  name="game_type"
                  value={formData.game_type}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Select Game Type</option>
                  {sportTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Court Name</label>
                <input
                  type="text"
                  name="court_name"
                  placeholder="e.g. Center Court"
                  value={formData.court_name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    placeholder="Venue Address"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Price per Hour</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    name="prices"
                    placeholder="0.00"
                    value={formData.prices}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <textarea
                  name="description"
                  placeholder="Tell us about the venue..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                ></textarea>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Photos</label>
                <div className="relative flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:bg-slate-100">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="mt-2 flex text-sm text-slate-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 hover:text-green-500">
                        <span>Upload files</span>
                        <input
                          type="file"
                          name="photos"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
                {editing && editing.photos && editing.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {editing.photos.map((photo, index) => (
                      <img key={index} src={photo} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Videos</label>
                <div className="relative flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:bg-slate-100">
                  <div className="text-center">
                    <Film className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="mt-2 flex text-sm text-slate-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 hover:text-green-500">
                        <span>Upload files</span>
                        <input
                          type="file"
                          name="videos"
                          multiple
                          accept="video/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">MP4, WebM up to 50MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : (editing ? 'Update Venue' : 'Save Venue')}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={handleLogout}>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Venues</h1>
            <p className="mt-1 text-slate-500">Manage your sports venues here.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-green-600 p-3 text-white hover:bg-green-700 transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 flex items-center rounded-lg p-4 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="mb-6 text-xl font-bold text-slate-900">All Venues</h2>
        <div className="space-y-4">
          {venues.map(venue => (
            <div key={venue.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                {venue.photos && venue.photos.length > 0 ? (
                  <img src={venue.photos[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-slate-900 text-sm">{venue.court_name} - {venue.game_type}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <MapPin className="h-3 w-3" />
                    {venue.location}
                  </div>
                  <span className="text-green-600 font-medium text-sm">${venue.prices}/hr</span>
                  <p className="text-slate-500 text-xs line-clamp-1 flex-1">{venue.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(venue)}
                className="rounded-lg p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          ))}
          {venues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <div className="rounded-full bg-slate-100 p-4 mb-3">
                <MapPin className="h-6 w-6" />
              </div>
              <p>No venues added yet.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Venues;
