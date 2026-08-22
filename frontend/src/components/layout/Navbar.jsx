import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/lapangan', label: 'Lapangan' },
    { to: '/booking', label: 'Booking' },
    { to: '/riwayat', label: 'Riwayat' },
    { to: '/informasi', label: 'Info' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', exact: true },
    { to: '/admin/pemesanan', label: 'Pemesanan' },
    { to: '/admin/lapangan', label: 'Lapangan' },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link
          to={user?.role === 'admin' ? '/admin' : isAuthenticated ? '/dashboard' : '/'}
          className="navbar-brand"
        >
          <span className="gradient-text">Booking Tenis Sukatani</span>
        </Link>

        {/* Nav links */}
        {isAuthenticated && (
          <div className={`navbar-nav ${mobileOpen ? 'mobile-open' : ''}`}>
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-link ${l.exact ? location.pathname === l.to ? 'active' : '' : isActive(l.to) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="navbar-user">
          {isAuthenticated ? (
            <>
              <div className="user-avatar" title={user?.nama}>
                {user?.nama?.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }} className="user-info-text">
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{user?.nama}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Keluar</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Masuk</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Daftar</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        {isAuthenticated && (
          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        )}
      </div>
    </nav>
  );
}
