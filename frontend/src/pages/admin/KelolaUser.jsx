import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

export default function KelolaUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('semua');
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'semua') params.append('role', roleFilter);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data);
    } catch (err) {
      toast.error('Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const toggleActive = async (user) => {
    if (user.role === 'admin') return toast.warning('Tidak bisa menonaktifkan admin!');
    try {
      await api.patch(`/users/${user.id}/toggle`);
      toast.success(`User berhasil ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`);
      fetchUsers();
    } catch {
      toast.error('Gagal mengubah status user.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/users/${deleteModal.id}`);
      toast.success('User berhasil dihapus.');
      setDeleteModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus user.');
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>Kelola User</h1>
        <p>Lihat dan kelola semua member Booking Tenis Sukatani</p>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <input type="text" className="form-input search-input" placeholder="Cari nama, email, atau HP..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="semua">Semua Role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>{users.length} user</span>
      </div>

      {loading ? (
        <LoadingSpinner text="Memuat user..." />
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak Ada User</h3>
          <p>Tidak ada user yang sesuai kriteria pencarian</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Role</th>
                <th>Bergabung</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar">{u.nama.charAt(0).toUpperCase()}</div>
                      <div style={{ fontWeight: 600 }}>{u.nama}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{u.email}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{u.no_hp}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-default'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {u.role !== 'admin' && (
                        <>
                          <button className={`btn btn-sm ${u.is_active ? 'btn-warning' : 'btn-success'}`} onClick={() => toggleActive(u)}>
                            {u.is_active ? 'Suspend' : 'Aktifkan'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(u)}>Hapus</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus User"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Batal</button>
            <button className="btn btn-danger" onClick={handleDelete}>Ya, Hapus</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Apakah Anda yakin ingin menghapus user <strong>{deleteModal?.nama}</strong>?
          Tindakan ini juga akan menghapus semua riwayat booking milik user ini.
        </p>
      </Modal>
    </div>
  );
}
