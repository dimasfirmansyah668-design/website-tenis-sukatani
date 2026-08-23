import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import { formatDateInput } from '../../utils/helpers';

export default function KelolaJadwal() {
  const [lapangan, setLapangan] = useState([]);
  const [blokirs, setBlokirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lapangan_id: '', tanggal: formatDateInput(new Date()), jam_mulai: '07:00', jam_selesai: '08:00', alasan: 'Maintenance' });

  useEffect(() => {
    api.get('/lapangan').then(({ data }) => {
      setLapangan(data);
      if (data.length > 0) setForm(f => ({ ...f, lapangan_id: data[0].id }));
    });
  }, []);

  const fetchBlokirs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jadwal/blokir');
      setBlokirs(data);
    } catch {
      toast.error('Gagal memuat jadwal blokir.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlokirs(); }, [fetchBlokirs]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.jam_selesai <= form.jam_mulai) {
      toast.error('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/jadwal/blokir', form);
      toast.success('Jadwal berhasil diblokir.');
      setModalOpen(false);
      fetchBlokirs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memblokir jadwal.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus blokir ini? Slot waktu akan tersedia kembali untuk dibooking.')) return;
    try {
      await api.delete(`/jadwal/blokir/${id}`);
      toast.success('Blokir dihapus.');
      fetchBlokirs();
    } catch { toast.error('Gagal menghapus.'); }
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Kelola Jadwal"
        subtitle="Blokir jadwal lapangan untuk maintenance atau turnamen"
        actions={<button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Blokir Jadwal</button>}
      />

      <DataTable
        columns={[
          {
            key: 'tanggal',
            header: 'Tanggal',
            render: (b) => (
              <span className="font-semibold capitalize">
                {new Date(b.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            ),
          },
          { key: 'jam', header: 'Jam', render: (b) => <span className="font-medium text-red-500">{b.jam_mulai} – {b.jam_selesai}</span> },
          { key: 'lapangan', header: 'Lapangan', render: (b) => b.lapangan?.nama },
          { key: 'alasan', header: 'Alasan', render: (b) => <span className="text-slate-500">{b.alasan}</span> },
          {
            key: 'aksi',
            header: 'Aksi',
            thClassName: 'w-32',
            render: (b) => <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(b.id)}>Buka Blokir</button>,
          },
        ]}
        data={blokirs}
        rowKey={(b) => b.id}
        loading={loading}
        emptyText="Semua lapangan berjalan sesuai jam operasional."
      />

      {/* Modal Add */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Blokir Jadwal"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn btn-danger" onClick={handleSave} disabled={saving}>{saving ? 'Memproses...' : 'Blokir'}</button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Lapangan</label>
            <select name="lapangan_id" className="form-select" value={form.lapangan_id} onChange={handleChange}>
              {lapangan.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input type="date" name="tanggal" className="form-input" value={form.tanggal} min={formatDateInput(new Date())} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jam Mulai</label>
              <input type="time" name="jam_mulai" className="form-input" step="3600" value={form.jam_mulai} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Selesai</label>
              <input type="time" name="jam_selesai" className="form-input" step="3600" value={form.jam_selesai} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Alasan</label>
            <input type="text" name="alasan" className="form-input" value={form.alasan} onChange={handleChange} placeholder="Misal: Maintenance rutin" />
          </div>
          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px', marginTop: '16px', fontSize: '0.85rem', color: '#fbbf24' }}>
            Jam yang diblokir tidak akan bisa dibooking oleh user.
          </div>
        </form>
      </Modal>
    </div>
  );
}
