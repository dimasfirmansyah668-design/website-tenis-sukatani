import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from './store/authStore';
import { useState } from 'react';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import { Menu } from 'lucide-react';

import InformasiPage from './pages/public/InformasiPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import UserDashboard from './pages/user/UserDashboard';
import LapanganList from './pages/user/LapanganList';
import BookingPage from './pages/user/BookingPage';
import RiwayatBooking from './pages/user/RiwayatBooking';

import AdminDashboard from './pages/admin/AdminDashboard';
import KelolaPemesanan from './pages/admin/KelolaPemesanan';
import KelolaLapangan from './pages/admin/KelolaLapangan';
import KelolaUser from './pages/admin/KelolaUser';
import KelolaJadwal from './pages/admin/KelolaJadwal';
import LaporanPage from './pages/admin/LaporanPage';

const ProtectedRoute = ({ role }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role)
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
};

/* Admin gets sidebar layout */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="admin-shell">
      <button
        className="admin-menu-btn"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Buka menu admin"
      >
        <Menu size={20} />
      </button>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

/* User/public pages get a plain centered wrapper */
const UserLayout = () => (
  <div className="page-wrapper">
    <Outlet />
  </div>
);

/* Navbar tampil di mana pun KECUALI panel admin (admin pakai sidebar) */
const AppNavbar = () => {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin') ? null : <Navbar />;
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <AppNavbar />

        <Routes>
          {/* Public — no extra wrapper (InformasiPage handles its own padding) */}
          <Route path="/" element={<InformasiPage />} />
          <Route path="/beranda" element={<InformasiPage />} />
          <Route path="/informasi" element={<Navigate to="/beranda" replace />} />

          {/* Auth pages — centered, no page-wrapper needed */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User routes — wrapped in centered page-wrapper */}
          <Route element={<ProtectedRoute role="user" />}>
            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/lapangan" element={<LapanganList />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/riwayat" element={<RiwayatBooking />} />
            </Route>
          </Route>

          {/* Admin routes — sidebar layout */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pemesanan" element={<KelolaPemesanan />} />
              <Route path="lapangan" element={<KelolaLapangan />} />
              <Route path="users" element={<KelolaUser />} />
              <Route path="jadwal" element={<KelolaJadwal />} />
              <Route path="laporan" element={<LaporanPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <ToastContainer position="bottom-right" theme="dark" autoClose={3000} />
    </BrowserRouter>
  );
}
