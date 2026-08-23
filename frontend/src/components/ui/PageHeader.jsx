import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/* Label khusus per path utuh */
const LABEL_BY_PATH = {
  '/admin': 'Admin',
  '/dashboard': 'Dashboard',
  '/lapangan': 'Lapangan',
  '/booking': 'Booking',
  '/riwayat': 'Riwayat Booking',
};

/* Label segmen di bawah /admin */
const ADMIN_SEGMENT_LABELS = {
  pemesanan: 'Kelola Pemesanan',
  lapangan: 'Kelola Lapangan',
  users: 'Kelola User',
  jadwal: 'Kelola Jadwal',
  laporan: 'Laporan',
};

const prettify = (seg) => seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

function buildCrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'admin') {
    const crumbs = [{ label: 'Admin', to: '/admin' }];
    segments.slice(1).forEach((seg) => {
      crumbs.push({ label: ADMIN_SEGMENT_LABELS[seg] || prettify(seg), to: `/admin/${seg}` });
    });
    return crumbs;
  }

  const crumbs = [{ label: 'Beranda', to: '/beranda' }];
  segments.forEach((seg) => {
    crumbs.push({ label: LABEL_BY_PATH[`/${seg}`] || prettify(seg), to: `/${seg}` });
  });
  return crumbs;
}

export default function PageHeader({ title, subtitle, actions }) {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);

  return (
    <header className="mb-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-0.5 text-xs">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.label} className="flex items-center">
              {i > 0 && <ChevronRight size={12} className="mx-0.5 text-slate-300" />}
              {isLast ? (
                <span className="font-semibold text-slate-600">{crumb.label}</span>
              ) : (
                <Link to={crumb.to} className="font-medium text-slate-400 transition hover:text-primary-600">
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Judul + aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h1>
          {subtitle && <p className="mt-3 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
