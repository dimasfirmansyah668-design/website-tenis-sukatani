import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, History, MessageCircle, Trophy, MapPin, Phone, Mail } from 'lucide-react';
import api from '../../api/axios';
import { formatRupiah } from '../../utils/helpers';

const FALLBACK_COURTS = [
  {
    id: null,
    nama: 'Lapangan Utama (Outdoor)',
    deskripsi: 'Clay court, suasana outdoor segar',
    harga_per_jam: 50000,
    fasilitas: ['Clay court', 'Outdoor', 'Sewa raket'],
  },
];

const FITUR = [
  {
    icon: CalendarCheck,
    title: 'Booking Online Real-time',
    desc: 'Lihat ketersediaan slot langsung dari sistem dan amankan jadwal tanpa perlu telepon-telepon.',
  },
  {
    icon: Clock,
    title: 'Durasi Fleksibel Per Jam',
    desc: 'Mulai dari jam 06:00 pagi — pilih sendiri jam mulai dan berapa jam ingin bermain.',
  },
  {
    icon: History,
    title: 'Riwayat & Status Jelas',
    desc: 'Pantau status setiap booking (menunggu, dikonfirmasi, selesai) kapan saja dari dashboard.',
  },
  {
    icon: MessageCircle,
    title: 'Konfirmasi via WhatsApp',
    desc: 'Admin memverifikasi pesanan dengan cepat dan siap membantu lewat WhatsApp.',
  },
];

const JAM_OPERASIONAL = [
  { hari: 'Senin – Jumat', jam: '06:00 – 18:00' },
  { hari: 'Sabtu', jam: '06:00 – 18:00' },
  { hari: 'Minggu & Libur', jam: '06:00 – 17:00' },
];

const KONTAK = [
  { icon: MapPin, title: 'Alamat', info: 'Jl. Sawo Raya No.14, Sukatani, Kec. Tapos, Kota Depok, Jawa Barat 16454' },
  { icon: Phone, title: 'Telepon', info: '082129438009' },
  { icon: MessageCircle, title: 'WhatsApp', info: '082129438009', wa: true },
  { icon: Mail, title: 'Email', info: 'dimfirmansyah334@info.com' },
];

export default function InformasiPage() {
  const [courts, setCourts] = useState(null);
  const [loadingCourts, setLoadingCourts] = useState(true);

  /* GET /lapangan bersifat publik — pengunjung belum login pun bisa melihat */
  useEffect(() => {
    let alive = true;
    api
      .get('/lapangan?status=aktif')
      .then(({ data }) => {
        if (alive) setCourts(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingCourts(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Data live bila tersedia; kalau API gagal, tampilkan data statis agar halaman tidak kosong */
  const list = courts && courts.length > 0 ? courts : FALLBACK_COURTS;

  return (
    <div className="landing-page">
      {/* ══ HERO ══ */}
      <header className="landing-hero">
        <div className="hero-glow" />
        <div className="landing-container hero-inner">
          <h1>
            <span className="gradient-text">Booking Tenis Sukatani</span>
          </h1>
          <p className="hero-sub">
            Website resmi pemesanan lapangan tenis di Sukatani, Depok. Pilih lapangan, tentukan jam
            mulai dan durasi bermain, lalu dapatkan konfirmasi dari admin — semuanya online dalam
            beberapa klik.
          </p>
          <div className="hero-actions">
            <Link to="/booking" className="btn btn-primary btn-lg">
              Booking Sekarang
            </Link>
            <a href="#lapangan" className="btn btn-secondary btn-lg">
              Lihat Lapangan ↓
            </a>
          </div>
          <ul className="trust-row">
            <li>
              <Clock size={14} /> Pilih jam per jam
            </li>
            <li>
              <MessageCircle size={14} /> Konfirmasi admin cepat
            </li>
            <li>
              <CalendarCheck size={14} /> Tanpa aplikasi tambahan
            </li>
          </ul>
        </div>
      </header>

      <main className="landing-container">
        {/* ══ FITUR / BISA APA AJA ══ */}
        <section id="fitur" className="landing-section">
          <div className="section-head">
            <h2>Bisa Apa Aja di Sini?</h2>
            <p>Semua yang kamu butuhkan untuk bermain tenis, dalam satu website</p>
          </div>
          <div className="feature-grid">
            {FITUR.map((f) => (
              <div key={f.title} className="card feature-card">
                <div className="feature-icon">
                  <f.icon size={20} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ PREVIEW LAPANGAN (LIVE) ══ */}
        <section id="lapangan" className="landing-section">
          <div className="section-head">
            <h2>Lapangan Tersedia</h2>
            <p>Data langsung dari sistem — klik booking untuk mengamankan slot</p>
          </div>
          {loadingCourts ? (
            <div className="court-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="court-skeleton" />
              ))}
            </div>
          ) : (
            <div className="court-grid">
              {list.map((c) => (
                <article key={c.id ?? c.nama} className="card court-card">
                  <div className="court-thumb">
                    {c.foto_url ? <img src={c.foto_url} alt={c.nama} /> : <Trophy size={40} />}
                  </div>
                  <div className="court-body">
                    <h3>{c.nama}</h3>
                    {c.deskripsi && <p className="court-desc">{c.deskripsi}</p>}
                    {Array.isArray(c.fasilitas) && c.fasilitas.length > 0 && (
                      <div className="chip-row">
                        {c.fasilitas.slice(0, 4).map((f) => (
                          <span key={f} className="chip">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="court-foot">
                      <div className="court-price">
                        {formatRupiah(c.harga_per_jam)}
                        <span> / jam</span>
                      </div>
                      <Link
                        to="/booking"
                        state={c.id ? { lapangan_id: c.id } : undefined}
                        className="btn btn-primary btn-sm"
                      >
                        Booking Lapangan Ini
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ══ HARGA ══ */}
        <section id="harga" className="landing-section">
          <div className="section-head">
            <h2>Harga Sewa</h2>
            <p>Harga terjangkau, kualitas premium</p>
          </div>
          <div className="card price-card">
            {list.map((c) => (
              <div key={`harga-${c.id ?? c.nama}`} className="price-row">
                <div>
                  <strong>{c.nama}</strong>
                  {c.deskripsi && <small>{c.deskripsi}</small>}
                </div>
                <div className="price-val">
                  {formatRupiah(c.harga_per_jam)}
                  <span> /jam</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ JAM OPERASIONAL ══ */}
        <section id="jadwal" className="landing-section">
          <div className="section-head">
            <h2>Jam Operasional</h2>
            <p>Buka setiap hari — datang pagi atau sore, lapangan siap</p>
          </div>
          <div className="card">
            <div className="hours-list">
              {JAM_OPERASIONAL.map((j) => (
                <div key={j.hari} className="hours-row">
                  <span>{j.hari}</span>
                  <strong>{j.jam}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ LOKASI & KONTAK ══ */}
        <section id="kontak" className="landing-section">
          <div className="section-head">
            <h2>Lokasi & Kontak</h2>
            <p>Mampir langsung atau hubungi kami terlebih dahulu</p>
          </div>
          <div className="contact-grid">
            {KONTAK.map((item) => (
              <div key={item.title} className="card contact-card">
                <div className="feature-icon feature-icon-sm">
                  <item.icon size={17} />
                </div>
                <div>
                  <div className="contact-title">{item.title}</div>
                  <div className="contact-info">{item.info}</div>
                  {item.wa && (
                    <a
                      href="https://wa.me/628129438009"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '10px' }}
                    >
                      Chat WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ CTA PENUTUP ══ */}
        <section className="landing-section-final">
          <div className="cta-panel">
            <h2>Siap Bermain?</h2>
            <p>Booking lapangan sekarang — pilih jamnya, main, dan rasakan bedanya.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Daftar Gratis
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sudah Punya Akun
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer className="landing-footer">
        <div className="landing-container footer-grid">
          <div className="footer-brand">
            <h3>Booking Tenis Sukatani</h3>
            <p>
              Sistem pemesanan lapangan tenis online di Sukatani, Depok. Pilih jam,
              booking dalam beberapa klik, dan main.
            </p>
          </div>
          <div className="footer-col">
            <h4>Navigasi</h4>
            <Link to="/">Beranda</Link>
            <Link to="/lapangan">Lapangan</Link>
            <Link to="/booking">Booking</Link>
            <Link to="/riwayat">Riwayat</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="footer-col">
            <h4>Akun</h4>
            <Link to="/login">Masuk</Link>
            <Link to="/register">Daftar</Link>
          </div>
          <div className="footer-col">
            <h4>Kontak</h4>
            <span>Jl. Sawo Raya No.14, Sukatani, Depok</span>
            <a href="https://wa.me/628129438009" target="_blank" rel="noreferrer">
              WhatsApp: 082129438009
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Booking Tenis Sukatani. Semua hak dilindungi.
        </div>
      </footer>
    </div>
  );
}
