import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { formatRupiah, getStatusColor, getStatusLabel, getPembayaranLabel, canCancelBooking } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

import { useNavigate } from 'react-router-dom';

const STATUS_FILTERS = ['semua', 'pending', 'dikonfirmasi', 'selesai', 'dibatalkan'];

export default function RiwayatBooking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const limit = 8;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filter !== 'semua') params.append('status', filter);
      const { data } = await api.get(`/booking/my?${params}`);
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Gagal memuat riwayat booking.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, limit]);

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await api.delete(`/booking/${cancelModal.id}`);
      toast.success('Booking berhasil dibatalkan.');
      setCancelModal(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan booking.');
    } finally {
      setCancelling(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Riwayat Booking</h1>
        <p>Semua history pemesanan lapangan tenis Anda</p>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {STATUS_FILTERS.map((s) => (
          <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'semua' ? 'Semua' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Memuat riwayat..." />
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak Ada Booking</h3>
          <p>Belum ada booking dengan status ini</p>
        </div>
      ) : (
        <>
          {bookings.map((b) => (
            <div key={b.id} className="booking-card animate-fade">
              <div className="booking-card-header">
                <div>
                  <div className="booking-lapangan">{b.lapangan?.nama || '—'}</div>
                  <div className="booking-id">ID #{b.id} • Dibuat {new Date(b.createdAt).toLocaleDateString('id-ID')}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={`badge ${getStatusColor(b.status)}`}>{getStatusLabel(b.status)}</span>
                  <span className={`badge ${b.status_pembayaran === 'sudah_bayar' ? 'badge-success' : 'badge-default'}`}>
                    {getPembayaranLabel(b.status_pembayaran)}
                  </span>
                </div>
              </div>

              <div className="booking-detail">
                <div className="booking-detail-item">
                  <span className="booking-detail-label">Tanggal</span>
                  <span className="booking-detail-value">
                    {new Date(b.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="booking-detail-item">
                  <span className="booking-detail-label">Jam Bermain</span>
                  <span className="booking-detail-value">{b.jam_mulai} – {b.jam_selesai} ({b.durasi} jam)</span>
                </div>
                <div className="booking-detail-item">
                  <span className="booking-detail-label">Total Harga</span>
                  <span className="booking-detail-value" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{formatRupiah(b.total_harga)}</span>
                </div>
              </div>

              {b.catatan && (
                <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Catatan: {b.catatan}
                </div>
              )}

              {b.alasan_batal && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.85rem', color: '#f87171', marginBottom: '12px' }}>
                  Alasan: {b.alasan_batal}
                </div>
              )}

              <div className="booking-actions">
                {canCancelBooking(b) && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/booking?edit=${b.id}`)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setCancelModal(b)}>
                      Batalkan
                    </button>
                  </>
                )}
                {!canCancelBooking(b) && ['pending', 'dikonfirmasi'].includes(b.status) && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Sudah melewati batas pembatalan (12 jam)
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </>
      )}

      {/* Cancel confirm modal */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Batalkan Booking"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCancelModal(null)} disabled={cancelling}>Tidak</button>
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Apakah Anda yakin ingin membatalkan booking <strong>{cancelModal?.lapangan?.nama}</strong>?
        </p>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.875rem' }}>
          Tanggal: {cancelModal && new Date(cancelModal.tanggal).toLocaleDateString('id-ID')} • Jam: {cancelModal?.jam_mulai} – {cancelModal?.jam_selesai}
        </p>
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px', marginTop: '16px', fontSize: '0.85rem', color: '#fbbf24' }}>
          Pembatalan hanya diizinkan minimal 12 jam sebelum waktu bermain.
        </div>
      </Modal>
    </div>
  );
}
