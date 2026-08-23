import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/pemesanan', label: 'Pemesanan' },
  { to: '/admin/lapangan', label: 'Kelola Lapangan' },
  { to: '/admin/jadwal', label: 'Kelola Jadwal' },
  { to: '/admin/users', label: 'Kelola User' },
  { to: '/admin/laporan', label: 'Laporan' },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const handleNav = (to) => {
    navigate(to);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-section-title">Menu Admin</div>
        {links.map((l) => (
          <button
            key={l.to}
            className={`sidebar-link ${isActive(l.to, l.exact) ? 'active' : ''}`}
            onClick={() => handleNav(l.to)}
          >
            <span>{l.label}</span>
          </button>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              onClick={() => handleNav('/')}
            >
              <Home size={16} />
              Beranda
            </button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
