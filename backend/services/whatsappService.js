const axios = require('axios');

/**
 * Send WhatsApp notification via Fonnte API
 * Docs: https://fonnte.com/api
 */
const sendWhatsApp = async (noHp, message) => {
  const apiKey = process.env.WHATSAPP_API_KEY;

  // Log message in development / when no API key set
  if (!apiKey || apiKey === 'your_fonnte_api_key_here') {
    console.log('\n📱 [WhatsApp Simulation]');
    console.log(`To: ${noHp}`);
    console.log(`Message: ${message}`);
    console.log('─────────────────────────────\n');
    return { success: true, simulated: true };
  }

  try {
    const response = await axios.post(
      'https://api.fonnte.com/send',
      {
        target: noHp,
        message: message,
        countryCode: '62',
      },
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );
    return { success: true, data: response.data };
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    return { success: false, error: err.message };
  }
};

// Notification templates
const notifBookingPending = (user, lapangan, booking) =>
  `🎾 *Booking Tenis - Konfirmasi*\n\nHalo ${user.nama}!\n\nBooking Anda telah diterima dan sedang diverifikasi admin.\n\n📋 *Detail Booking:*\n• Lapangan: ${lapangan.nama}\n• Tanggal: ${formatTanggal(booking.tanggal)}\n• Jam: ${booking.jam_mulai} - ${booking.jam_selesai}\n• Total: Rp ${formatRupiah(booking.total_harga)}\n\nStatus: *MENUNGGU KONFIRMASI*\nKami akan segera menghubungi Anda kembali.\n\nTerima kasih! 🙏`;

const notifAdminNewBooking = (user, lapangan, booking) =>
  `🚨 *INFO ADMIN - Booking Baru Masuk!*\n\nAda booking baru yang menunggu konfirmasi Anda.\n\n👤 *Pemesan:* ${user.nama}\n📞 *No HP:* ${user.no_hp}\n📋 *Detail Booking:*\n• Lapangan: ${lapangan.nama}\n• Tanggal: ${formatTanggal(booking.tanggal)}\n• Jam: ${booking.jam_mulai} - ${booking.jam_selesai}\n• Total: Rp ${formatRupiah(booking.total_harga)}\n\nSegera login ke dashboard admin untuk konfirmasi.`;

const notifBookingDikonfirmasi = (user, lapangan, booking) =>
  `✅ *Booking Tenis - Dikonfirmasi!*\n\nHalo ${user.nama}!\n\nBooking Anda telah *DIKONFIRMASI*.\n\n📋 *Detail Booking:*\n• Lapangan: ${lapangan.nama}\n• Tanggal: ${formatTanggal(booking.tanggal)}\n• Jam: ${booking.jam_mulai} - ${booking.jam_selesai}\n• Total: Rp ${formatRupiah(booking.total_harga)}\n\n💳 *Pembayaran:* Bayar di tempat saat tiba di lapangan\n\nSampai jumpa! 🎾`;

const notifBookingDibatalkan = (user, lapangan, booking, alasan) =>
  `❌ *Booking Tenis - Dibatalkan*\n\nHalo ${user.nama}!\n\nMohon maaf, booking Anda telah *DIBATALKAN*.\n\n📋 *Detail Booking:*\n• Lapangan: ${lapangan.nama}\n• Tanggal: ${formatTanggal(booking.tanggal)}\n• Jam: ${booking.jam_mulai} - ${booking.jam_selesai}\n\n${alasan ? `Alasan: ${alasan}\n\n` : ''}Silakan booking ulang di waktu yang lain.\nTerima kasih! 🙏`;

const notifReminderH1 = (user, lapangan, booking) =>
  `⏰ *Reminder Booking Tenis - Besok!*\n\nHalo ${user.nama}!\n\nJangan lupa besok ada booking lapangan tenis!\n\n📋 *Detail:*\n• Lapangan: ${lapangan.nama}\n• Tanggal: ${formatTanggal(booking.tanggal)}\n• Jam: ${booking.jam_mulai} - ${booking.jam_selesai}\n\n💳 Siapkan pembayaran: Rp ${formatRupiah(booking.total_harga)}\n\nSampai jumpa besok! 🎾`;

const formatRupiah = (num) => num.toLocaleString('id-ID');
const formatTanggal = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

module.exports = {
  sendWhatsApp,
  notifBookingPending,
  notifBookingDikonfirmasi,
  notifBookingDibatalkan,
  notifReminderH1,
  notifAdminNewBooking,
};
