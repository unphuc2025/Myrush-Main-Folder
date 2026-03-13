import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';

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

  // Show footer on all pages
  const shouldHideFooter = false;

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Global Background */}
      <div className="fixed inset-0 z-[-1] mesh-bg opacity-40 pointer-events-none"></div>

      <ScrollToTop />
      <div className="flex-1 transition-all duration-300">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/verify-otp" element={<Navigate to="/" replace />} />
          <Route path="/setup-profile" element={<Navigate to="/" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id" element={<VenueDetailsPage />} />
          <Route path="/booking/slots" element={<ProtectedRoute><SlotSelection /></ProtectedRoute>} />
          <Route path="/booking/summary" element={<ProtectedRoute><BookingSummary /></ProtectedRoute>} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
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

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <Router>
          <AppContent />
        </Router>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
