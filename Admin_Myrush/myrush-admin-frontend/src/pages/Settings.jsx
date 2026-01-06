import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, MapPin, Building, Play, Puzzle } from 'lucide-react';
import CitiesSettings from '../components/settings/CitiesSettings';
import BranchesSettings from '../components/settings/BranchesSettings';
import CourtsSettings from '../components/settings/CourtsSettings';
import GameTypesSettings from '../components/settings/GameTypesSettings';
import AmenitiesSettings from '../components/settings/AmenitiesSettings';

function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('cities');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Sync active tab with URL hash
    const hash = location.hash.replace('#', '') || 'cities';
    const validTabs = ['cities', 'branches', 'courts', 'game-types', 'amenities'];
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigate('/login');
  };

  const tabs = [
    { id: 'cities', label: 'Cities & Areas', icon: MapPin },
    { id: 'branches', label: 'Branches', icon: Building },
    { id: 'courts', label: 'Courts', icon: Play },
    { id: 'game-types', label: 'Game Types', icon: SettingsIcon },
    { id: 'amenities', label: 'Amenities', icon: Puzzle },
  ];

  return (
    <Layout onLogout={handleLogout}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {tabs.find(tab => tab.id === activeTab)?.label}
        </h1>
        <p className="mt-1 text-slate-500">Configure and manage your {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()}</p>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'cities' && <CitiesSettings />}
        {activeTab === 'branches' && <BranchesSettings />}
        {activeTab === 'courts' && <CourtsSettings />}
        {activeTab === 'game-types' && <GameTypesSettings />}
        {activeTab === 'amenities' && <AmenitiesSettings />}
      </div>
    </Layout>
  );
}

export default Settings;
