import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import BookingDetails from "./pages/BookingDetails";
import EditBooking from "./pages/EditBooking";
import Venues from "./pages/Venues";

import CourtSlotsCalendar from "./components/settings/CourtSlotsCalendar";
import Coupons from "./pages/Coupons";

import Admins from "./pages/Admins";
import Reviews from "./pages/Reviews";
import Cities from "./pages/Cities";
import Policies from "./pages/Policies";

import Courts from "./pages/Courts";
import GameTypes from "./pages/GameTypes";
import Amenities from "./pages/Amenities";
import Reports from "./pages/Reports";
import Roles from "./pages/Roles";
import RoleForm from "./pages/RoleForm";
import Users from "./pages/Users";
import FAQ from "./pages/FAQ";
import CMSPages from "./pages/CMSPages";
import SiteSettings from "./pages/SiteSettings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/bookings/:id" element={<BookingDetails />} />
      <Route path="/bookings/:id/edit" element={<EditBooking />} />
      <Route path="/venues" element={<Venues />} />
      <Route path="/calendar" element={<CourtSlotsCalendar />} />
      <Route path="/coupons" element={<Coupons />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/cities" element={<Cities />} />
      <Route path="/users" element={<Users />} />
      <Route path="/faqs" element={<FAQ />} />
      <Route path="/cms" element={<CMSPages />} />
      <Route path="/settings" element={<SiteSettings />} />

      <Route path="/courts" element={<Courts />} />
      <Route path="/game-types" element={<GameTypes />} />
      <Route path="/amenities" element={<Amenities />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/admins" element={<Admins />} />
      <Route path="/roles" element={<Roles />} />
      <Route path="/roles/new" element={<RoleForm />} />
      <Route path="/roles/edit/:id" element={<RoleForm />} />
      <Route path="/policies" element={<Policies />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
