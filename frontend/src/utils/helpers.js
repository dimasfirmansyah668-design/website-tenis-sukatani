export const formatRupiah = (num) => {
  if (!num) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

export const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

export const formatTanggalShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'badge-warning';
    case 'dikonfirmasi': return 'badge-info';
    case 'selesai': return 'badge-success';
    case 'dibatalkan': return 'badge-danger';
    default: return 'badge-default';
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Menunggu';
    case 'dikonfirmasi': return 'Dikonfirmasi';
    case 'selesai': return 'Selesai';
    case 'dibatalkan': return 'Dibatalkan';
    default: return status;
  }
};

export const getPembayaranLabel = (status) => {
  switch (status) {
    case 'belum_bayar': return 'Belum Bayar';
    case 'sudah_bayar': return 'Sudah Bayar';
    default: return status;
  }
};

export const canCancelBooking = (booking) => {
  if (!['pending', 'dikonfirmasi'].includes(booking.status)) return false;
  const bookingDateTime = new Date(`${booking.tanggal}T${booking.jam_mulai}:00+07:00`);
  const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const diffHours = (bookingDateTime - nowWIB) / (1000 * 60 * 60);
  return diffHours >= 12;
};

export const generateTimeSlots = (jamBuka = '07:00', jamTutup = '22:00') => {
  const slots = [];
  let current = parseInt(jamBuka.split(':')[0]);
  const end = parseInt(jamTutup.split(':')[0]);
  while (current < end) {
    slots.push({
      jam_mulai: `${String(current).padStart(2, '0')}:00`,
      jam_selesai: `${String(current + 1).padStart(2, '0')}:00`,
    });
    current++;
  }
  return slots;
};

export const isTodayOrFuture = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= today;
};
