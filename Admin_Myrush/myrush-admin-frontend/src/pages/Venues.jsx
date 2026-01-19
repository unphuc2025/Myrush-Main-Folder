import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '../components/Layout';
import VenuesSettings from '../components/settings/VenuesSettings';

const Venues = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <Layout onLogout={() => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      navigate('/login');
    }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Venues</h1>
        <p className="text-sm text-slate-500">Manage your venue details</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <VenuesSettings />
      </div>
    </Layout>
  );
};

export default Venues;
