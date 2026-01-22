import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Academy } from './pages/Academy';
import { Arena } from './pages/Arena';
import { Corporate } from './pages/Corporate';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { OTPVerification } from './pages/OTPVerification';
import { ProfileSetup } from './pages/ProfileSetup';
import { Venues } from './pages/Venues';
import { VenueDetailsPage } from './pages/VenueDetails';
import { SlotSelection } from './pages/SlotSelection';
import { BookingSummary } from './pages/BookingSummary';
import { BookingSummaryNew } from './pages/BookingSummaryNew';
import { MyBookings } from './pages/MyBookings';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/setup-profile" element={<ProfileSetup />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/venues" element={<ProtectedRoute><Venues /></ProtectedRoute>} />
          <Route path="/venues/:id" element={<ProtectedRoute><VenueDetailsPage /></ProtectedRoute>} />
          <Route path="/booking/slots" element={<ProtectedRoute><SlotSelection /></ProtectedRoute>} />
          <Route path="/booking/summary" element={<ProtectedRoute><BookingSummary /></ProtectedRoute>} />
          <Route path="/booking-summary" element={<ProtectedRoute><BookingSummaryNew /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
