import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Venues from "./pages/Venues";
import Settings from "./pages/Settings";
import CourtSlotsCalendar from "./components/settings/CourtSlotsCalendar";
import Coupons from "./pages/Coupons";

import Admins from "./pages/Admins";
import Reviews from "./pages/Reviews";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/venues" element={<Venues />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/calendar" element={<CourtSlotsCalendar />} />
      <Route path="/coupons" element={<Coupons />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/admins" element={<Admins />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
