import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatRupiah } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';

export default function LapanganList() {
  const [lapangan, setLapangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/lapangan?status=aktif');
        setLapangan(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = lapangan.filter((l) =>
    l.nama.toLowerCase().includes(search.toLowerCase()) ||
    l.deskripsi?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner fullPage text="Memuat lapangan..." />;

  return (
    <div className="animate-fade">
      <PageHeader title="Lapangan Tenis" subtitle="Pilih lapangan yang ingin Anda booking" />

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Cari lapangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{filtered.length} lapangan tersedia</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak Ada Lapangan</h3>
          <p>Tidak ada lapangan yang sesuai pencarian</p>
        </div>
      ) : (
        <div className="courts-grid">
          {filtered.map((l) => {
            const fasilitas = typeof l.fasilitas === 'string' ? JSON.parse(l.fasilitas || '[]') : (l.fasilitas || []);
            return (
              <div key={l.id} className="court-card">
                {l.foto_url && (
                  <img src={l.foto_url} alt={l.nama} className="court-img" onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                <div className="court-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div className="court-name">{l.nama}</div>
                    <span className="badge badge-success">Tersedia</span>
                  </div>
                  <div className="court-price">{formatRupiah(l.harga_per_jam)} / jam</div>
                  {l.deskripsi && <div className="court-desc">{l.deskripsi}</div>}
                  <div className="court-facilities">
                    {fasilitas.slice(0, 4).map((f, i) => (
                      <span key={i} className="court-facility">✓ {f}</span>
                    ))}
                    {fasilitas.length > 4 && <span className="court-facility">+{fasilitas.length - 4} lagi</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Buka: {l.jam_buka} – {l.jam_tutup}
                  </div>
                  <div className="court-footer">
                    <button className="btn btn-primary btn-full" onClick={() => navigate('/booking', { state: { lapangan_id: l.id } })}>
                      Booking Sekarang
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
