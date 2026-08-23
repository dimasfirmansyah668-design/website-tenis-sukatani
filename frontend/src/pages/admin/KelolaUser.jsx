import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';

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
      <PageHeader title="Kelola User" subtitle="Lihat dan kelola semua member Booking Tenis Sukatani" />

      <div className="filters-bar mb-4">
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

      <DataTable
        columns={[
          {
            key: 'nama',
            header: 'Nama',
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="user-avatar">{u.nama.charAt(0).toUpperCase()}</div>
                <span className={`font-semibold ${u.is_active ? '' : 'opacity-50'}`}>{u.nama}</span>
              </div>
            ),
          },
          {
            key: 'kontak',
            header: 'Kontak',
            render: (u) => (
              <div>
                <div className="text-sm">{u.email}</div>
                <div className="text-xs text-slate-500">{u.no_hp}</div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (u) => (
              <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-default'} !text-[11px]`}>
                {u.role.toUpperCase()}
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Bergabung',
            render: (u) => new Date(u.createdAt).toLocaleDateString('id-ID'),
          },
          {
            key: 'is_active',
            header: 'Status',
            render: (u) => (
              <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'} !text-[11px]`}>
                {u.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            ),
          },
          {
            key: 'aksi',
            header: 'Aksi',
            thClassName: 'w-44',
            render: (u) =>
              u.role !== 'admin' ? (
                <div className="flex gap-1.5">
                  <button className={`btn btn-sm ${u.is_active ? 'btn-warning' : 'btn-success'}`} onClick={() => toggleActive(u)}>
                    {u.is_active ? 'Suspend' : 'Aktifkan'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(u)}>Hapus</button>
                </div>
              ) : null,
          },
        ]}
        data={users}
        rowKey={(u) => u.id}
        loading={loading}
        emptyText="Tidak ada user yang sesuai kriteria pencarian."
      />

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
