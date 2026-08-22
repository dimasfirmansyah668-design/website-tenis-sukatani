const { Booking, Lapangan, User, SlotBlokir } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// GET /api/report/summary
exports.getSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const [
      totalBooking,
      totalPending,
      totalDikonfirmasi,
      totalSelesai,
      totalDibatalkan,
      totalUser,
      totalLapangan,
      bookingHariIni,
      pendapatanBulanIni,
    ] = await Promise.all([
      Booking.count(),
      Booking.count({ where: { status: 'pending' } }),
      Booking.count({ where: { status: 'dikonfirmasi' } }),
      Booking.count({ where: { status: 'selesai' } }),
      Booking.count({ where: { status: 'dibatalkan' } }),
      User.count({ where: { role: 'user' } }),
      Lapangan.count({ where: { status: 'aktif' } }),
      Booking.count({ where: { tanggal: today, status: { [Op.in]: ['pending', 'dikonfirmasi', 'selesai'] } } }),
      Booking.sum('total_harga', {
        where: {
          status_pembayaran: 'sudah_bayar',
          tanggal: { [Op.between]: [`${thisMonth}-01`, `${thisMonth}-31`] },
        },
      }),
    ]);

    return res.json({
      totalBooking,
      totalPending,
      totalDikonfirmasi,
      totalSelesai,
      totalDibatalkan,
      totalUser,
      totalLapangan,
      bookingHariIni,
      pendapatanBulanIni: pendapatanBulanIni || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/report/booking?bulan=07&tahun=2024
exports.getBookingReport = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const year = tahun || new Date().getFullYear();
    const month = bulan ? String(bulan).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;

    const bookings = await Booking.findAll({
      where: { tanggal: { [Op.between]: [`${prefix}-01`, `${prefix}-31`] } },
      include: [
        { model: User, as: 'user', attributes: ['nama', 'email', 'no_hp'] },
        { model: Lapangan, as: 'lapangan', attributes: ['nama', 'harga_per_jam'] },
      ],
      order: [['tanggal', 'ASC'], ['jam_mulai', 'ASC']],
    });

    const totalPendapatan = bookings
      .filter((b) => b.status_pembayaran === 'sudah_bayar')
      .reduce((sum, b) => sum + b.total_harga, 0);

    const totalBooking = bookings.length;
    const byStatus = {
      pending: bookings.filter((b) => b.status === 'pending').length,
      dikonfirmasi: bookings.filter((b) => b.status === 'dikonfirmasi').length,
      selesai: bookings.filter((b) => b.status === 'selesai').length,
      dibatalkan: bookings.filter((b) => b.status === 'dibatalkan').length,
    };

    return res.json({ bulan: prefix, totalBooking, totalPendapatan, byStatus, bookings });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
