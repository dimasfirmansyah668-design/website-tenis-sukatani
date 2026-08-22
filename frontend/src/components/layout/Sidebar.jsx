import { useNavigate, useLocation } from 'react-router-dom';

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

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const handleNav = (to) => {
    navigate(to);
    if (onClose) onClose();
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
          <div className="sidebar-section-title">Info</div>
          <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Mode Admin
          </div>
        </div>
      </aside>
    </>
  );
}
