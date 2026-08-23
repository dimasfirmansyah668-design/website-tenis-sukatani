import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { formatRupiah, getStatusColor, getStatusLabel } from '../../utils/helpers';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';

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
  const [limit, setLimit] = useState(10);

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
  }, [filter, page, search, lapanganFilter, limit]);

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

  const columns = [
    {
      key: 'id',
      header: 'ID',
      thClassName: 'w-16',
      render: (b) => <span className="text-xs text-slate-400">#{b.id}</span>,
    },
    {
      key: 'user',
      header: 'User',
      render: (b) => (
        <div>
          <div className="text-sm font-semibold text-slate-700">{b.user?.nama}</div>
          <div className="text-xs text-slate-400">{b.user?.no_hp}</div>
        </div>
      ),
    },
    {
      key: 'lapangan',
      header: 'Lapangan',
      render: (b) => <span className="text-sm">{b.lapangan?.nama}</span>,
    },
    {
      key: 'tanggal',
      header: 'Tanggal & Jam',
      render: (b) => (
        <div>
          <div className="text-sm font-medium capitalize">{new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div className="text-xs text-slate-500">{b.jam_mulai}–{b.jam_selesai}</div>
        </div>
      ),
    },
    {
      key: 'total_harga',
      header: 'Total',
      render: (b) => <span className="text-sm font-semibold text-primary-600">{formatRupiah(b.total_harga)}</span>,
    },
    {
      key: 'pembayaran',
      header: 'Pembayaran',
      render: (b) => (
        <span className={`badge ${b.status_pembayaran === 'sudah_bayar' ? 'badge-success' : 'badge-default'} !text-[11px]`}>
          {b.status_pembayaran === 'sudah_bayar' ? 'Bayar' : 'Belum'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <span className={`badge ${getStatusColor(b.status)} !text-[11px]`}>{getStatusLabel(b.status)}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      thClassName: 'w-56',
      render: (b) => (
        <div className="flex flex-wrap gap-1.5">
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
      ),
    },
  ];

  return (
    <div className="animate-fade">
      <PageHeader title="Kelola Pemesanan" subtitle="Verifikasi dan kelola semua booking lapangan" />

      {/* Filters */}
      <div className="filters-bar mb-4">
        <div className="search-input-wrapper">
          <input type="text" className="form-input search-input" placeholder="Cari nama / email user..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filters-group">
          <select className="form-select filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'semua' ? 'Semua Status' : getStatusLabel(s)}</option>)}
          </select>
          <select className="form-select filter-select" value={lapanganFilter} onChange={(e) => setLapanganFilter(e.target.value)}>
            <option value="">Semua Lapangan</option>
            {lapangans.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
          </select>
          <span className="filters-count">{total} booking</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        rowKey={(b) => b.id}
        loading={loading}
        emptyText="Tidak ada booking yang sesuai filter."
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
      />

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
