import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatRupiah, getStatusColor, getStatusLabel, getPembayaranLabel, canCancelBooking } from '../../utils/helpers';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';

const STATUS_FILTERS = ['semua', 'pending', 'dikonfirmasi', 'selesai', 'dibatalkan'];

export default function RiwayatBooking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filter !== 'semua') params.append('status', filter);
      const { data } = await api.get(`/booking/my?${params}`);
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch {
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

  const columns = [
    {
      key: 'id',
      header: 'ID',
      thClassName: 'w-20',
      render: (b) => (
        <div>
          <span className="font-semibold text-slate-700">#{b.id}</span>
          <div className="text-[11px] text-slate-400">Dibuat {new Date(b.createdAt).toLocaleDateString('id-ID')}</div>
        </div>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tanggal & Jam',
      render: (b) => (
        <div>
          <div className="font-medium capitalize">{new Date(b.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div className="text-xs text-slate-500">{b.jam_mulai} – {b.jam_selesai} ({b.durasi} jam)</div>
        </div>
      ),
    },
    {
      key: 'lapangan',
      header: 'Lapangan',
      render: (b) => (
        <div className="max-w-[200px]">
          <div className="font-medium">{b.lapangan?.nama || '—'}</div>
          {b.catatan && <div className="mt-0.5 line-clamp-2 text-xs text-slate-400" title={b.catatan}>Catatan: {b.catatan}</div>}
          {b.alasan_batal && <div className="mt-0.5 line-clamp-2 text-xs text-red-400" title={b.alasan_batal}>Alasan: {b.alasan_batal}</div>}
        </div>
      ),
    },
    {
      key: 'total_harga',
      header: 'Total',
      render: (b) => <span className="font-bold text-primary-600">{formatRupiah(b.total_harga)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <div className="flex flex-wrap gap-1">
          <span className={`badge ${getStatusColor(b.status)} !text-[11px]`}>{getStatusLabel(b.status)}</span>
          <span className={`badge ${b.status_pembayaran === 'sudah_bayar' ? 'badge-success' : 'badge-default'} !text-[11px]`}>
            {getPembayaranLabel(b.status_pembayaran)}
          </span>
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      thClassName: 'w-44',
      render: (b) =>
        canCancelBooking(b) ? (
          <div className="flex flex-wrap gap-1.5">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/booking?edit=${b.id}`)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => setCancelModal(b)}>Batalkan</button>
          </div>
        ) : ['pending', 'dikonfirmasi'].includes(b.status) ? (
          <span className="text-xs text-slate-400">Lewat batas batal</span>
        ) : (
          <span className="text-slate-300">&mdash;</span>
        ),
    },
  ];

  return (
    <div className="animate-fade">
      <PageHeader title="Riwayat Booking" subtitle="Semua history pemesanan lapangan tenis Anda" />

      {/* Filter tabs */}
      <div className="tabs mb-4">
        {STATUS_FILTERS.map((s) => (
          <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'semua' ? 'Semua' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        rowKey={(b) => b.id}
        loading={loading}
        emptyText="Belum ada booking dengan status ini."
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
      />

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
