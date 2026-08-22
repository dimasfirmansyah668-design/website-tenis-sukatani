import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatRupiah, getStatusLabel } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function LaporanPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [bulan, setBulan] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(today.getFullYear()));

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/report/booking?bulan=${bulan}&tahun=${tahun}`);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [bulan, tahun]);

  return (
    <div className="animate-fade">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Laporan Pendapatan</h1>
          <p>Rekapitulasi booking dan pendapatan per bulan</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="form-select" value={bulan} onChange={(e) => setBulan(e.target.value)} style={{ width: '140px' }}>
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
          <select className="form-select" value={tahun} onChange={(e) => setTahun(e.target.value)} style={{ width: '100px' }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Memuat laporan..." />
      ) : !report ? (
        <div className="empty-state"><h3>Gagal memuat laporan</h3></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-value">{report.totalBooking}</div>
                <div className="stat-label">Total Transaksi</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{formatRupiah(report.totalPendapatan)}</div>
                <div className="stat-label">Pendapatan Bersih (Lunas)</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {Object.entries(report.byStatus).map(([status, count]) => (
              <div key={status} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{count}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{getStatusLabel(status)}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Rincian Transaksi ({report.bulan})</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Cetak</button>
            </div>
            {report.bookings.length === 0 ? (
              <div className="empty-state">Belum ada transaksi di bulan ini.</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Lapangan</th>
                      <th>User</th>
                      <th>Status Pembayaran</th>
                      <th style={{ textAlign: 'right' }}>Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{new Date(b.tanggal).toLocaleDateString('id-ID')}</td>
                        <td>{b.lapangan?.nama}</td>
                        <td>{b.user?.nama}</td>
                        <td>
                          {b.status_pembayaran === 'sudah_bayar' 
                            ? <span style={{ color: 'var(--color-success)' }}>Lunas</span> 
                            : <span style={{ color: 'var(--text-muted)' }}>Belum Lunas</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{b.total_harga.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700, padding: '16px' }}>TOTAL PENDAPATAN DITERIMA:</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary)', padding: '16px', fontSize: '1.1rem' }}>
                        {formatRupiah(report.totalPendapatan)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
