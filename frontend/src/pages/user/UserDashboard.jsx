import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { formatRupiah, getStatusLabel, getStatusColor, canCancelBooking } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

export default function UserDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, dikonfirmasi: 0, selesai: 0 });
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/booking/my?limit=5');
      setBookings(data.bookings || []);
      const s = { total: data.total || 0, pending: 0, dikonfirmasi: 0, selesai: 0 };
      (data.bookings || []).forEach((b) => { if (b.status in s) s[b.status]++; });
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await api.delete(`/booking/${cancelModal.id}`);
      toast.success('Booking berhasil dibatalkan.');
      setCancelModal(null);
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Memuat dashboard..." />;

  return (
    <div className="animate-fade">
      {/* Welcome */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>
          Halo, <span className="gradient-text">{user?.nama}</span>!
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Siap bermain tenis hari ini?</p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <Link to="/booking" className="card" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.05))', borderColor: 'rgba(56,189,248,0.3)', cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Booking Lapangan</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pilih lapangan & jam bermain</div>
        </Link>
        <Link to="/lapangan" className="card" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))', borderColor: 'rgba(167,139,250,0.3)', cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Lihat Lapangan</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Info & ketersediaan lapangan</div>
        </Link>
        <Link to="/riwayat" className="card" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))', borderColor: 'rgba(52,211,153,0.3)', cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Riwayat Booking</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Lihat semua transaksi Anda</div>
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Booking</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Menunggu</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{stats.dikonfirmasi}</div>
            <div className="stat-label">Dikonfirmasi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{stats.selesai}</div>
            <div className="stat-label">Selesai</div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Booking Terbaru</h2>
          <Link to="/riwayat" className="btn btn-ghost btn-sm">Lihat Semua →</Link>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <h3>Belum Ada Booking</h3>
            <p>Ayo booking lapangan tenis sekarang!</p>
            <Link to="/booking" className="btn btn-primary" style={{ marginTop: '16px' }}>Booking Sekarang</Link>
          </div>
        ) : (
          <div>
            {bookings.map((b) => (
              <div key={b.id} className="booking-card" style={{ marginBottom: '12px' }}>
                <div className="booking-card-header">
                  <div>
                    <div className="booking-lapangan">{b.lapangan?.nama}</div>
                    <div className="booking-id">#{b.id} • {new Date(b.createdAt).toLocaleDateString('id-ID')}</div>
                  </div>
                  <span className={`badge ${getStatusColor(b.status)}`}>{getStatusLabel(b.status)}</span>
                </div>
                <div className="booking-detail">
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Tanggal</span>
                    <span className="booking-detail-value">{new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Jam</span>
                    <span className="booking-detail-value">{b.jam_mulai} - {b.jam_selesai}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="booking-detail-label">Total</span>
                    <span className="booking-detail-value" style={{ color: 'var(--color-primary)' }}>{formatRupiah(b.total_harga)}</span>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ padding: '12px 16px', background: 'var(--color-surface-2)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {canCancelBooking(b) ? (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/booking?edit=${b.id}`)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setCancelModal(b)}>
                        Batalkan
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Tidak ada aksi tersedia
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="card" style={{ marginTop: '16px', background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(167,139,250,0.06))', borderColor: 'rgba(56,189,248,0.2)' }}>
        <h3 style={{ marginBottom: '12px' }}>Alur Booking</h3>
        <div className="timeline">
          {[
            { title: 'Pilih & Booking', desc: 'Pilih lapangan, tanggal, dan jam' },
            { title: 'Tunggu Konfirmasi', desc: 'Admin akan verifikasi dalam waktu singkat' },
            { title: 'Notifikasi WhatsApp', desc: 'Terima konfirmasi di WhatsApp Anda' },
            { title: 'Bayar di Tempat', desc: 'Datang & bayar langsung ke petugas' },
          ].map((step, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-dot active">{i + 1}</div>
              <div className="timeline-content">
                <div className="timeline-title">{step.title}</div>
                <div className="timeline-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Batalkan Booking"
      >
        {cancelModal && (
          <div>
            <p style={{ marginBottom: '16px' }}>
              Apakah Anda yakin ingin membatalkan booking untuk lapangan <strong>{cancelModal.lapangan?.nama}</strong> pada tanggal {new Date(cancelModal.tanggal).toLocaleDateString('id-ID')}?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setCancelModal(null)} disabled={cancelling}>
                Kembali
              </button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
