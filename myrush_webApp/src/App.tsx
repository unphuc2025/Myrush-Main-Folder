import React, { useEffect } from 'react';
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

import { Memberships } from './pages/Memberships';
import { Venues } from './pages/Venues';
import { VenueDetailsPage } from './pages/VenueDetails';
import { SlotSelection } from './pages/SlotSelection';
import { BookingSummary } from './pages/BookingSummary';
import { MyBookings } from './pages/MyBookings';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { CmsPage } from './pages/CmsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import ScrollToTop from './components/ScrollToTop';
import { Footer } from './components/Footer';
// import { WhatsAppButton } from './components/WhatsAppButton'; // Kept for reference
import { Chatbot } from './components/Chatbot';
import { CustomCursor } from './components/CustomCursor';
import { MobileNav } from './components/MobileNav';
import { AuthModal } from './components/auth/AuthModal';
import { TourPreloader } from './components/TourPreloader';
import './App.css';


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal();
    }
  }, [isAuthenticated, openAuthModal]);

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { openAuthModal, isAuthenticated } = useAuth();

  useEffect(() => {
    // If we've been redirected here from ProtectedRoute, open the modal
    if (location.state?.from && !isAuthenticated) {
      openAuthModal();
    }
  }, [location.state, isAuthenticated, openAuthModal, location.pathname]);

  // Hide footer only on specific pages like Setup Profile, Login, OTP, Profile
  const shouldHideFooter = location.pathname === '/profile';

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Global Tour Preloader */}
      <TourPreloader />

      {/* Global Background */}
      <div className="fixed inset-0 z-[-1] mesh-bg opacity-40 pointer-events-none"></div>

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
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/verify-otp" element={<Navigate to="/" replace />} />
          <Route path="/setup-profile" element={<Navigate to="/" replace />} />

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
          <Route path="/p/:slug" element={<CmsPage />} />
        </Routes>
      </div>
      {!shouldHideFooter && <Footer />}
      <MobileNav />
      {/* <WhatsAppButton /> */}
      <Chatbot />
      <AuthModal />
    </div>

  );
};

import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <FavoritesProvider>
          <Router>
            <AppContent />
          </Router>
        </FavoritesProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
