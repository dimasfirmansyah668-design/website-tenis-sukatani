import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatRupiah, getStatusColor, getStatusLabel } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, bookRes] = await Promise.all([
          api.get('/report/summary'),
          api.get('/booking?limit=8'),
        ]);
        setSummary(sumRes.data);
        setRecentBookings(bookRes.data.bookings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner fullPage text="Memuat dashboard admin..." />;

  const chartData = summary ? [
    { name: 'Pending', value: summary.totalPending, fill: '#fbbf24' },
    { name: 'Konfirmasi', value: summary.totalDikonfirmasi, fill: '#38bdf8' },
    { name: 'Selesai', value: summary.totalSelesai, fill: '#34d399' },
    { name: 'Batal', value: summary.totalDibatalkan, fill: '#f87171' },
  ] : [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Dashboard Admin</h1>
        <p>Ringkasan aktivitas booking lapangan tenis</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {[
          { label: 'Total Booking', value: summary?.totalBooking || 0, cls: 'blue' },
          { label: 'Menunggu Konfirmasi', value: summary?.totalPending || 0, cls: 'yellow' },
          { label: 'Dikonfirmasi', value: summary?.totalDikonfirmasi || 0, cls: 'blue' },
          { label: 'Selesai', value: summary?.totalSelesai || 0, cls: 'green' },
          { label: 'Dibatalkan', value: summary?.totalDibatalkan || 0, cls: 'red' },
          { label: 'Total Member', value: summary?.totalUser || 0, cls: 'purple' },
          { label: 'Lapangan Aktif', value: summary?.totalLapangan || 0, cls: 'green' },
          { label: 'Pendapatan Bulan Ini', value: formatRupiah(summary?.pendapatanBulanIni || 0), cls: 'green', isText: true },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-info">
              <div className="stat-value" style={s.isText ? { fontSize: '1.1rem' } : {}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Pending Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div className="chart-card">
          <h3 className="chart-title">Status Booking</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Aksi Cepat</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/admin/pemesanan?status=pending" className="btn btn-warning" style={{ justifyContent: 'flex-start' }}>
              Verifikasi Booking Pending ({summary?.totalPending || 0})
            </Link>
            <Link to="/admin/lapangan" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              Kelola Lapangan
            </Link>
            <Link to="/admin/jadwal" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              Blokir Jadwal
            </Link>
            <Link to="/admin/laporan" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              Lihat Laporan
            </Link>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Booking Terbaru</h3>
          <Link to="/admin/pemesanan" className="btn btn-ghost btn-sm">Lihat Semua →</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="empty-state"><h3>Belum Ada Booking</h3></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Lapangan</th>
                  <th>Tanggal</th>
                  <th>Jam</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{b.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.user?.nama}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user?.no_hp}</div>
                    </td>
                    <td>{b.lapangan?.nama}</td>
                    <td>{new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{b.jam_mulai}–{b.jam_selesai}</td>
                    <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{formatRupiah(b.total_harga)}</td>
                    <td><span className={`badge ${getStatusColor(b.status)}`}>{getStatusLabel(b.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
