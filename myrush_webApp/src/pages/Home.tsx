import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LandingPage } from './LandingPage';
import { Dashboard } from './Dashboard';

export const Home: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? <Dashboard /> : <LandingPage />;
};
