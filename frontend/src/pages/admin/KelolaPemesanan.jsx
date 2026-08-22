import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { formatRupiah, getStatusColor, getStatusLabel, getPembayaranLabel } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

const STATUS_OPTIONS = ['semua', 'pending', 'dikonfirmasi', 'selesai', 'dibatalkan'];

const waMessage = (b) => {
  const tgl = new Date(b.tanggal).toLocaleDateString('id-ID');
  const base = `Halo ${b.user?.nama}, terkait booking Lapangan Tenis Anda`;
  const statusText = {
    dikonfirmasi: 'SUDAH DIKONFIRMASI',
    pending: 'MENUNGGU KONFIRMASI',
    selesai: 'TELAH SELESAI',
    dibatalkan: 'DIBATALKAN',
  }[b.status];
  return statusText
    ? `${base} ${statusText} pada ${tgl} jam ${b.jam_mulai}`
    : `${base} pada ${tgl} jam ${b.jam_mulai}`;
};

export default function KelolaPemesanan() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionModal, setActionModal] = useState(null);
  const [alasanBatal, setAlasanBatal] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lapanganFilter, setLapanganFilter] = useState('');
  const [lapangans, setLapangans] = useState([]);
  const limit = 15;

  useEffect(() => { api.get('/lapangan').then(({ data }) => setLapangans(data)).catch(() => {}); }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filter !== 'semua') params.append('status', filter);
      if (search) params.append('search', search);
      if (lapanganFilter) params.append('lapangan_id', lapanganFilter);
      const { data } = await api.get(`/booking?${params}`);
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Gagal memuat data booking.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, search, lapanganFilter]);

  useEffect(() => { setPage(1); }, [filter, search, lapanganFilter]);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (bookingId, newStatus) => {
    if (newStatus === 'dibatalkan' && !alasanBatal.trim()) {
      toast.warning('Masukkan alasan pembatalan.');
      return;
    }
    setProcessing(true);
    try {
      await api.patch(`/booking/${bookingId}/status`, { status: newStatus, alasan_batal: alasanBatal || undefined });
      toast.success(`Status booking berhasil diubah ke ${newStatus}.`);
      setActionModal(null);
      setAlasanBatal('');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBayar = async (bookingId) => {
    if (!window.confirm('Tandai booking ini sudah dibayar dan selesai?')) return;
    try {
      await api.patch(`/booking/${bookingId}/bayar`);
      toast.success('Pembayaran berhasil dicatat!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Kelola Pemesanan</h1>
        <p>Verifikasi dan kelola semua booking lapangan</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <input type="text" className="form-input search-input" placeholder="Cari nama / email user..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'semua' ? 'Semua Status' : getStatusLabel(s)}</option>)}
        </select>
        <select className="form-select filter-select" value={lapanganFilter} onChange={(e) => setLapanganFilter(e.target.value)}>
          <option value="">Semua Lapangan</option>
          {lapangans.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>{total} booking</span>
      </div>

      {loading ? (
        <LoadingSpinner text="Memuat data..." />
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak Ada Booking</h3>
          <p>Tidak ada booking yang sesuai filter</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Lapangan</th>
                  <th>Tanggal & Jam</th>
                  <th>Total</th>
                  <th>Pembayaran</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{b.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.user?.nama}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user?.no_hp}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{b.lapangan?.nama}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.jam_mulai}–{b.jam_selesai}</div>
                    </td>
                    <td style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{formatRupiah(b.total_harga)}</td>
                    <td><span className={`badge ${b.status_pembayaran === 'sudah_bayar' ? 'badge-success' : 'badge-default'}`} style={{ fontSize: '0.7rem' }}>{b.status_pembayaran === 'sudah_bayar' ? 'Bayar' : 'Belum'}</span></td>
                    <td><span className={`badge ${getStatusColor(b.status)}`} style={{ fontSize: '0.7rem' }}>{getStatusLabel(b.status)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <a 
                          href={`https://wa.me/62${b.user?.no_hp?.replace(/^0/, '')}?text=${encodeURIComponent(waMessage(b))}`}
                          target="_blank" rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(52,211,153,0.5)', color: '#34d399' }}
                        >
                          Chat WA
                        </a>
                        {b.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => setActionModal({ booking: b, action: 'dikonfirmasi' })}>Konfirmasi</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ booking: b, action: 'dibatalkan' })}>Tolak</button>
                          </>
                        )}
                        {b.status === 'dikonfirmasi' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleBayar(b.id)}>Lunas</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ booking: b, action: 'dibatalkan' })}>Batal</button>
                          </>
                        )}
                        {b.status === 'selesai' && b.status_pembayaran === 'belum_bayar' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleBayar(b.id)}>Tandai Bayar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setAlasanBatal(''); }}
        title={actionModal?.action === 'dikonfirmasi' ? 'Konfirmasi Booking' : 'Tolak/Batalkan Booking'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setActionModal(null); setAlasanBatal(''); }} disabled={processing}>Batal</button>
            <button
              className={`btn ${actionModal?.action === 'dikonfirmasi' ? 'btn-success' : 'btn-danger'}`}
              onClick={() => handleAction(actionModal.booking.id, actionModal.action)}
              disabled={processing}
            >
              {processing ? 'Memproses...' : actionModal?.action === 'dikonfirmasi' ? 'Konfirmasi' : 'Tolak'}
            </button>
          </>
        }
      >
        {actionModal && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {actionModal.action === 'dikonfirmasi'
                ? `Konfirmasi booking oleh ${actionModal.booking.user?.nama}?`
                : `Tolak booking oleh ${actionModal.booking.user?.nama}?`}
            </p>
            {[
              { label: 'Lapangan', value: actionModal.booking.lapangan?.nama },
              { label: 'Tanggal', value: new Date(actionModal.booking.tanggal).toLocaleDateString('id-ID') },
              { label: 'Jam', value: `${actionModal.booking.jam_mulai} – ${actionModal.booking.jam_selesai}` },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
            {actionModal.action === 'dibatalkan' && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Alasan Pembatalan <span>*</span></label>
                <textarea className="form-textarea" placeholder="Jelaskan alasan pembatalan..." value={alasanBatal} onChange={(e) => setAlasanBatal(e.target.value)} style={{ minHeight: '80px' }} />
              </div>
            )}
            {actionModal.action === 'dikonfirmasi' && (
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px', marginTop: '16px', fontSize: '0.85rem', color: '#34d399' }}>
                Notifikasi WhatsApp akan dikirim otomatis ke user.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
