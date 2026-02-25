import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Academy } from './pages/Academy';
import { Arena } from './pages/Arena';
import { Corporate } from './pages/Corporate';
import { Pickleball } from './pages/Pickleball';
import { Events } from './pages/Events';
import { Loyalty } from './pages/Loyalty';
import { OpenPlay } from './pages/OpenPlay';
import { Store } from './pages/Store';
import { Services } from './pages/Services';
// import { Dashboard } from './pages/Dashboard'; // Handled by Home
import { Home } from './pages/Home';
import { Community } from './pages/Community';
import { Arcade } from './pages/Arcade';
import { Login } from './pages/Login';
import { OTPVerification } from './pages/OTPVerification';
import { ProfileSetup } from './pages/ProfileSetup';
import { Memberships } from './pages/Memberships';
import { Venues } from './pages/Venues';
import { VenueDetailsPage } from './pages/VenueDetails';
import { SlotSelection } from './pages/SlotSelection';
import { BookingSummary } from './pages/BookingSummary';
import { MyBookings } from './pages/MyBookings';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { TermsCondition } from './pages/TermsCondition';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { Footer } from './components/Footer';
// import { WhatsAppButton } from './components/WhatsAppButton'; // Kept for reference
import { Chatbot } from './components/Chatbot';
import { CustomCursor } from './components/CustomCursor';
import './App.css';


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();

  // Hide footer only on specific pages like Setup Profile, Login, OTP, Profile
  const shouldHideFooter = location.pathname === '/login' ||
    location.pathname === '/verify-otp' ||
    location.pathname === '/profile' ||
    location.pathname === '/setup-profile';

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Global Background */}
      <div className="fixed inset-0 z-[-1] mesh-bg opacity-40"></div>

      <ScrollToTop />
      <div className="flex-1 transition-all duration-300">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/pickleball" element={<Pickleball />} />
          <Route path="/events" element={<Events />} />
          <Route path="/open-play" element={<OpenPlay />} />
          <Route path="/store" element={<Store />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/setup-profile" element={<ProfileSetup />} />

          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/venues" element={<Venues />} /> {/* Changed from ProtectedRoute<Venues /> to Venues */}
          <Route path="/venues/:id" element={<VenueDetailsPage />} />
          <Route path="/booking/slots" element={<ProtectedRoute><SlotSelection /></ProtectedRoute>} />
          <Route path="/booking/summary" element={<ProtectedRoute><BookingSummary /></ProtectedRoute>} />
          <Route path="/community" element={<Community />} />
          <Route path="/arcade" element={<Arcade />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/loyalty" element={<ProtectedRoute><Loyalty /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/terms" element={<TermsCondition />} />
        </Routes>
      </div>
      {!shouldHideFooter && <Footer />}
      {/* <WhatsAppButton /> */}
      <Chatbot />
    </div>

  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
