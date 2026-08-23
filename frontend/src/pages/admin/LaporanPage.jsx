import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatRupiah, getStatusLabel } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';

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
      <PageHeader
        title="Laporan Pendapatan"
        subtitle="Rekapitulasi booking dan pendapatan per bulan"
        actions={
          <>
            <select className="form-select" value={bulan} onChange={(e) => setBulan(e.target.value)} style={{ width: '140px' }}>
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
            <select className="form-select" value={tahun} onChange={(e) => setTahun(e.target.value)} style={{ width: '100px' }}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        }
      />

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

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Rincian Transaksi ({report.bulan})</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Cetak</button>
          </div>
          <DataTable
            columns={[
              { key: 'tanggal', header: 'Tanggal', render: (b) => new Date(b.tanggal).toLocaleDateString('id-ID') },
              { key: 'lapangan', header: 'Lapangan', render: (b) => b.lapangan?.nama },
              { key: 'user', header: 'User', render: (b) => b.user?.nama },
              {
                key: 'status_pembayaran',
                header: 'Status Pembayaran',
                render: (b) =>
                  b.status_pembayaran === 'sudah_bayar'
                    ? <span className="font-medium text-emerald-600">Lunas</span>
                    : <span className="text-slate-400">Belum Lunas</span>,
              },
              {
                key: 'total_harga',
                header: 'Total (Rp)',
                thClassName: '!text-right',
                className: 'text-right font-semibold',
                render: (b) => b.total_harga.toLocaleString('id-ID'),
              },
            ]}
            data={report.bookings}
            rowKey={(b) => b.id}
            emptyText="Belum ada transaksi di bulan ini."
            footer={
              <tr>
                <td colSpan="4" className="px-4 py-4 text-right text-sm font-bold text-slate-700">TOTAL PENDAPATAN DITERIMA:</td>
                <td className="px-4 py-4 text-right text-lg font-extrabold text-primary-600">{formatRupiah(report.totalPendapatan)}</td>
              </tr>
            }
          />
        </>
      )}
    </div>
  );
}
