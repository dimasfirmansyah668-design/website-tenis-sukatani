const BULAN_NAMA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/* Border tipis abu untuk seluruh area tabel */
const thinBorder = () => ({
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
});

/**
 * Export laporan transaksi ke .xlsx via ExcelJS.
 * Selalu mengikuti data `report` yang sedang tampil (filter bulan/tahun aktif).
 * ExcelJS diimpor dinamis — masuk chunk terpisah, tidak membebani bundle utama.
 */
export async function exportTransaksiExcel(report) {
  const { default: ExcelJS } = await import('exceljs');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Booking Tenis Sukatani';
  wb.created = new Date();
  const ws = wb.addWorksheet('Rincian Transaksi');

  const [y, m] = String(report.bulan).split('-');
  const periode = `${BULAN_NAMA[Number(m) - 1] ?? m} ${y}`;

  const cols = ['No', 'Tanggal', 'Jam', 'Lapangan', 'Penyewa', 'No. HP', 'Status Pembayaran', 'Total (Rp)'];
  const lastCol = cols.length;

  /* ── Header dokumen ── */
  ws.mergeCells(1, 1, 1, lastCol);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = 'LAPORAN TRANSAKSI — BOOKING TENIS SUKATANI';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF047857' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(2, 1, 2, lastCol);
  const periodeCell = ws.getCell(2, 1);
  periodeCell.value = `Periode: ${periode}`;
  periodeCell.font = { bold: true, size: 11 };
  periodeCell.alignment = { horizontal: 'center' };

  ws.mergeCells(3, 1, 3, lastCol);
  const printedCell = ws.getCell(3, 1);
  printedCell.value = `Dicetak: ${new Date().toLocaleString('id-ID')}`;
  printedCell.font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
  printedCell.alignment = { horizontal: 'center' };

  /* ── Header tabel (baris 5, frozen) ── */
  const headRow = ws.getRow(5);
  headRow.values = cols;
  headRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder();
  });
  headRow.height = 22;

  /* ── Data ── */
  const bookings = Array.isArray(report.bookings) ? report.bookings : [];
  bookings.forEach((b, i) => {
    const row = ws.getRow(6 + i);
    row.values = [
      i + 1,
      new Date(b.tanggal).toLocaleDateString('id-ID'),
      `${b.jam_mulai}–${b.jam_selesai}`,
      b.lapangan?.nama ?? '-',
      b.user?.nama ?? '-',
      b.user?.no_hp ?? '-',
      b.status_pembayaran === 'sudah_bayar' ? 'Lunas' : 'Belum Lunas',
      Number(b.total_harga) || 0,
    ];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = thinBorder();
      if ([1, 2, 3, 7].includes(col)) cell.alignment = { horizontal: 'center' };
      if (col === 8) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });
  });

  /* ── Baris TOTAL ── */
  const totalIdx = 6 + bookings.length;
  const totalRow = ws.getRow(totalIdx);
  ws.mergeCells(totalIdx, 1, totalIdx, lastCol - 1);
  for (let c = 1; c <= lastCol; c++) {
    const cell = totalRow.getCell(c);
    cell.border = { ...thinBorder(), top: { style: 'double', color: { argb: 'FF94A3B8' } } };
    cell.font = { bold: true };
  }
  const labelCell = totalRow.getCell(1);
  labelCell.value = `TOTAL PENDAPATAN DITERIMA (${bookings.length} transaksi)`;
  labelCell.alignment = { horizontal: 'right' };
  const valCell = totalRow.getCell(lastCol);
  valCell.value = Number(report.totalPendapatan) || 0;
  valCell.numFmt = '#,##0';
  valCell.font = { bold: true, size: 12, color: { argb: 'FF047857' } };
  valCell.alignment = { horizontal: 'right' };

  /* Lebar kolom tetap (deterministik & rapi) */
  const widths = [6, 13, 15, 30, 24, 16, 18, 15];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  /* Header tabel selalu terlihat saat scroll */
  ws.views = [{ state: 'frozen', ySplit: 5 }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan-Transaksi-${report.bulan}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
