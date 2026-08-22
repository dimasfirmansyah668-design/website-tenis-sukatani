export default function InformasiPage() {
  const fasilitas = [
    { title: '1 Lapangan Tenis', desc: 'Outdoor clay court berkualitas tinggi' },
    { title: 'Parkir Luas', desc: 'Area parkir luas untuk kendaraan roda 2 dan 4' },
    { title: 'Toilet', desc: 'Fasilitas toilet bersih untuk pemain' },
    { title: 'Penyewaan Raket', desc: 'Sewa raket tenis berkualitas dengan harga terjangkau' },
  ];

  const pricing = [
    { name: 'Lapangan Utama (Outdoor)', harga: 'Rp 50.000 / jam', desc: 'Clay court, suasana outdoor segar' },
  ];

  const jam = [
    { hari: 'Senin – Jumat', jam: '06:00 – 18:00' },
    { hari: 'Sabtu', jam: '06:00 – 18:00' },
    { hari: 'Minggu & Libur', jam: '06:00 – 17:00' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div className="hero-section" style={{ padding: '80px 24px 60px', textAlign: 'center', position: 'relative' }}>
        <div className="hero-glow" />
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '16px' }}>
          <span className="gradient-text">Booking Tenis Sukatani</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 32px' }}>
          Pusat Tenis Premium di Kota Anda. Fasilitas modern, lapangan berkualitas, dan booking mudah dari genggaman tangan Anda.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/register" className="btn btn-primary btn-lg">Daftar Gratis</a>
          <a href="/booking" className="btn btn-secondary btn-lg">Booking Sekarang</a>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '60px' }}>
        {/* Fasilitas */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: '8px' }}>Fasilitas Kami</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>Lengkap untuk kenyamanan bermain Anda</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {fasilitas.map((f, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Harga */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: '8px' }}>Harga Sewa</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>Harga terjangkau, kualitas premium</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
            {pricing.map((p, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', background: i === 0 ? 'linear-gradient(135deg, rgba(56,189,248,0.1), transparent)' : undefined, borderColor: i === 0 ? 'rgba(56,189,248,0.3)' : undefined }}>
                {i === 0 && <div className="badge badge-info" style={{ marginBottom: '12px' }}>Populer</div>}
                <h3 style={{ marginBottom: '8px' }}>{p.name}</h3>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>{p.harga}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Jam Operasional */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: '32px' }}>Jam Operasional</h2>
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hari</th>
                    <th>Jam Operasional</th>
                  </tr>
                </thead>
                <tbody>
                  {jam.map((j, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{j.hari}</td>
                      <td>{j.jam}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Lokasi & Kontak */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: '32px' }}>Lokasi & Kontak</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { title: 'Alamat', info: 'Jl. Sawo Raya No.14, Sukatani, Kec. Tapos, Kota Depok, Jawa Barat 16454' },
              { title: 'Telepon', info: '082129438009' },
              { title: 'WhatsApp', info: '082129438009' },
              { title: 'Email', info: 'dimfirmansyah334@info.com' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.info}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(167,139,250,0.08))', borderColor: 'rgba(56,189,248,0.2)' }}>
          <h2 style={{ marginBottom: '8px' }}>Siap Bermain?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Booking lapangan tenis sekarang dan rasakan pengalaman bermain yang menyenangkan!</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/register" className="btn btn-primary">Daftar Gratis</a>
            <a href="/login" className="btn btn-secondary">Sudah Punya Akun</a>
          </div>
        </div>
      </div>
    </div>
  );
}
