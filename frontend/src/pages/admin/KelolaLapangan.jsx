import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { formatRupiah } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';

const defaultForm = { nama: '', harga_per_jam: '', deskripsi: '', fasilitas: '', jam_buka: '07:00', jam_tutup: '22:00', foto_url: '', status: 'aktif' };

export default function KelolaLapangan() {
  const [lapangan, setLapangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchLapangan = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/lapangan');
      setLapangan(data);
    } catch { toast.error('Gagal memuat lapangan.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLapangan(); }, []);

  const openAdd = () => { setEditId(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (l) => {
    const fArr = typeof l.fasilitas === 'string' ? JSON.parse(l.fasilitas || '[]') : (l.fasilitas || []);
    setEditId(l.id);
    setForm({ ...l, fasilitas: fArr.join(', ') });
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.harga_per_jam) { toast.error('Nama dan harga wajib diisi!'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        harga_per_jam: Number(form.harga_per_jam),
        fasilitas: form.fasilitas ? form.fasilitas.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      if (editId) {
        await api.put(`/lapangan/${editId}`, payload);
        toast.success('Lapangan berhasil diperbarui!');
      } else {
        await api.post('/lapangan', payload);
        toast.success('Lapangan berhasil ditambahkan!');
      }
      setModalOpen(false);
      fetchLapangan();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/lapangan/${deleteModal.id}`);
      toast.success('Lapangan berhasil dihapus.');
      setDeleteModal(null);
      fetchLapangan();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus.');
    }
  };

  const toggleStatus = async (l) => {
    try {
      await api.put(`/lapangan/${l.id}`, { ...l, fasilitas: typeof l.fasilitas === 'string' ? JSON.parse(l.fasilitas || '[]') : l.fasilitas, status: l.status === 'aktif' ? 'nonaktif' : 'aktif' });
      toast.success(`Lapangan ${l.status === 'aktif' ? 'dinonaktifkan' : 'diaktifkan'}.`);
      fetchLapangan();
    } catch { toast.error('Gagal mengubah status.'); }
  };

  if (loading) return <LoadingSpinner fullPage text="Memuat lapangan..." />;

  return (
    <div className="animate-fade">
      <PageHeader
        title="Kelola Lapangan"
        subtitle="Tambah, edit, dan nonaktifkan lapangan tenis"
        actions={<button className="btn btn-primary" onClick={openAdd}>+ Tambah Lapangan</button>}
      />

      <div className="courts-grid">
        {lapangan.map((l) => {
          const fArr = typeof l.fasilitas === 'string' ? JSON.parse(l.fasilitas || '[]') : (l.fasilitas || []);
          return (
            <div key={l.id} className="court-card" style={{ opacity: l.status === 'nonaktif' ? 0.6 : 1 }}>
              {l.foto_url && (
                <img src={l.foto_url} alt={l.nama} className="court-img" onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <div className="court-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div className="court-name">{l.nama}</div>
                  <span className={`badge ${l.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>{l.status}</span>
                </div>
                <div className="court-price">{formatRupiah(l.harga_per_jam)}/jam</div>
                {l.deskripsi && <div className="court-desc" style={{ marginBottom: '8px' }}>{l.deskripsi}</div>}
                <div className="court-facilities">
                  {fArr.slice(0, 3).map((f, i) => <span key={i} className="court-facility">{f}</span>)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Buka: {l.jam_buka} – {l.jam_tutup}
                </div>
                <div className="court-footer">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(l)}>Edit</button>
                  <button className="btn btn-warning btn-sm" onClick={() => toggleStatus(l)}>
                    {l.status === 'aktif' ? 'Nonaktif' : 'Aktifkan'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(l)}>Hapus</button>
                </div>
              </div>
            </div>
          );
        })}

        {lapangan.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <h3>Belum Ada Lapangan</h3>
            <p>Tambah lapangan tenis pertama Anda</p>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: '16px' }}>+ Tambah Lapangan</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Lapangan' : 'Tambah Lapangan'} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Memproses...' : 'Simpan'}</button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nama Lapangan <span>*</span></label>
              <input type="text" name="nama" className="form-input" value={form.nama} onChange={handleChange} placeholder="Lapangan A" />
            </div>
            <div className="form-group">
              <label className="form-label">Harga/jam (Rp) <span>*</span></label>
              <input type="number" name="harga_per_jam" className="form-input" value={form.harga_per_jam} onChange={handleChange} placeholder="100000" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea name="deskripsi" className="form-textarea" value={form.deskripsi} onChange={handleChange} placeholder="Deskripsi lapangan..." style={{ minHeight: '80px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Fasilitas (pisah dengan koma)</label>
            <input type="text" name="fasilitas" className="form-input" value={form.fasilitas} onChange={handleChange} placeholder="AC, Toilet, Parkir, Kantin" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jam Buka</label>
              <input type="time" name="jam_buka" className="form-input" value={form.jam_buka} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Tutup</label>
              <input type="time" name="jam_tutup" className="form-input" value={form.jam_tutup} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">URL Foto</label>
              <input type="url" name="foto_url" className="form-input" value={form.foto_url} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Lapangan"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Batal</button>
            <button className="btn btn-danger" onClick={handleDelete}>Ya, Hapus</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>Apakah Anda yakin ingin menghapus lapangan <strong>{deleteModal?.nama}</strong>? Tindakan ini tidak bisa dibatalkan.</p>
      </Modal>
    </div>
  );
}
