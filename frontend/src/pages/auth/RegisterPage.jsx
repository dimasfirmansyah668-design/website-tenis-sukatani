import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ nama: '', email: '', no_hp: '', password: '', konfirmasi: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.no_hp || !form.password) {
      toast.error('Semua field wajib diisi!');
      return;
    }
    if (form.password !== form.konfirmasi) {
      toast.error('Password tidak cocok!');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter!');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        nama: form.nama, email: form.email, no_hp: form.no_hp, password: form.password,
      });
      login(data.user, data.token);
      toast.success('Registrasi berhasil! Selamat datang');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide">
        <div className="auth-logo">
          <h1 className="gradient-text">Booking Tenis Sukatani</h1>
          <p>Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap <span>*</span></label>
            <input type="text" name="nama" className="form-input" placeholder="John Doe" value={form.nama} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email <span>*</span></label>
              <input type="email" name="email" className="form-input" placeholder="email@contoh.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">No. WhatsApp <span>*</span></label>
              <input type="tel" name="no_hp" className="form-input" placeholder="0812xxxx" value={form.no_hp} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <input type="password" name="password" className="form-input" placeholder="Min. 6 karakter" value={form.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password <span>*</span></label>
              <input type="password" name="konfirmasi" className="form-input" placeholder="Ulangi password" value={form.konfirmasi} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="auth-divider"><span>atau</span></div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
