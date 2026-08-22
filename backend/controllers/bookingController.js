const { Booking, Lapangan, User, SlotBlokir } = require('../models');
const { Op } = require('sequelize');
const {
  sendWhatsApp,
  notifBookingPending,
  notifBookingDikonfirmasi,
  notifBookingDibatalkan,
  notifAdminNewBooking,
} = require('../services/whatsappService');

// POST /api/booking — User creates booking
exports.create = async (req, res) => {
  try {
    const { lapangan_id, tanggal, jam_mulai, jam_selesai, catatan } = req.body;
    const user = req.user;

    if (!lapangan_id || !tanggal || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    const lapangan = await Lapangan.findByPk(lapangan_id);
    if (!lapangan) return res.status(404).json({ message: 'Lapangan tidak ditemukan.' });
    if (lapangan.status === 'nonaktif') return res.status(400).json({ message: 'Lapangan sedang tidak aktif.' });

    // Check time validity
    const start = parseInt(jam_mulai.split(':')[0]);
    const end = parseInt(jam_selesai.split(':')[0]);
    if (end <= start) return res.status(400).json({ message: 'Jam selesai harus lebih besar dari jam mulai.' });

    // Validate booking is in the future
    const now = new Date();
    const bookingDateTime = new Date(`${tanggal}T${jam_mulai}:00+07:00`);
    if (bookingDateTime <= now) {
      return res.status(400).json({ message: 'Tidak bisa booking waktu yang sudah lewat atau sedang berlangsung.' });
    }

    // Check existing bookings (conflict)
    const conflict = await Booking.findOne({
      where: {
        lapangan_id,
        tanggal,
        status: { [Op.in]: ['pending', 'dikonfirmasi'] },
        [Op.or]: [
          { jam_mulai: { [Op.lt]: jam_selesai }, jam_selesai: { [Op.gt]: jam_mulai } },
        ],
      },
    });
    if (conflict) return res.status(400).json({ message: 'Slot waktu sudah terisi. Pilih jam lain.' });

    // Check blocked slots
    const blocked = await SlotBlokir.findOne({
      where: {
        lapangan_id,
        tanggal,
        [Op.or]: [
          { jam_mulai: { [Op.lt]: jam_selesai }, jam_selesai: { [Op.gt]: jam_mulai } },
        ],
      },
    });
    if (blocked) return res.status(400).json({ message: 'Slot waktu diblokir untuk maintenance.' });

    const durasi = end - start;
    const total_harga = durasi * lapangan.harga_per_jam;

    const booking = await Booking.create({
      user_id: user.id,
      lapangan_id,
      tanggal,
      jam_mulai,
      jam_selesai,
      durasi,
      total_harga,
      catatan: catatan || '',
    });

    // Send WhatsApp notification to user (Disabled - using manual WA)
    // const msg = notifBookingPending(user, lapangan, booking);
    // await sendWhatsApp(user.no_hp, msg);
    
    // Send WhatsApp notification to admin (Disabled - using manual WA)
    // const admin = await User.findOne({ where: { role: 'admin' } });
    // if (admin && admin.no_hp) {
    //   const msgAdmin = notifAdminNewBooking(user, lapangan, booking);
    //   await sendWhatsApp(admin.no_hp, msgAdmin);
    // }

    await booking.update({ whatsapp_sent: true });

    return res.status(201).json({ message: 'Booking berhasil dibuat! Menunggu konfirmasi admin.', booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/booking/my — User's own bookings
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [{ model: Lapangan, as: 'lapangan' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({ total: count, page: parseInt(page), bookings: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/booking/:id — User cancel
exports.cancelByUser = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Lapangan, as: 'lapangan' }],
    });

    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' });
    if (!['pending', 'dikonfirmasi'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking tidak bisa dibatalkan.' });
    }

    // Check 12 hours rule
    const bookingDateTime = new Date(`${booking.tanggal}T${booking.jam_mulai}:00`);
    const diffMs = bookingDateTime - new Date();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 12) {
      return res.status(400).json({
        message: 'Pembatalan hanya bisa dilakukan minimal 12 jam sebelum jadwal.',
      });
    }

    await booking.update({ status: 'dibatalkan', alasan_batal: 'Dibatalkan oleh user' });

    const msg = notifBookingDibatalkan(req.user, booking.lapangan, booking, 'Dibatalkan oleh pengguna');
    await sendWhatsApp(req.user.no_hp, msg);

    return res.json({ message: 'Booking berhasil dibatalkan.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/booking/:id — User edits booking
exports.updateByUser = async (req, res) => {
  try {
    const { lapangan_id, tanggal, jam_mulai, jam_selesai, catatan } = req.body;
    const user = req.user;

    const booking = await Booking.findOne({
      where: { id: req.params.id, user_id: user.id },
      include: [{ model: Lapangan, as: 'lapangan' }],
    });

    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' });
    if (!['pending', 'dikonfirmasi'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking tidak bisa diedit karena status sudah berubah.' });
    }

    // Check 12 hours rule
    const currentBookingDateTime = new Date(`${booking.tanggal}T${booking.jam_mulai}:00`);
    const diffMs = currentBookingDateTime - new Date();
    if (diffMs / (1000 * 60 * 60) < 12) {
      return res.status(400).json({ message: 'Edit hanya bisa dilakukan minimal 12 jam sebelum jadwal asli Anda.' });
    }

    if (!lapangan_id || !tanggal || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    const lapangan = await Lapangan.findByPk(lapangan_id);
    if (!lapangan) return res.status(404).json({ message: 'Lapangan tidak ditemukan.' });
    if (lapangan.status === 'nonaktif') return res.status(400).json({ message: 'Lapangan sedang tidak aktif.' });

    // Check time validity
    const start = parseInt(jam_mulai.split(':')[0]);
    const end = parseInt(jam_selesai.split(':')[0]);
    if (end <= start) return res.status(400).json({ message: 'Jam selesai harus lebih besar dari jam mulai.' });

    // Validate booking is in the future
    const now = new Date();
    const bookingDateTime = new Date(`${tanggal}T${jam_mulai}:00+07:00`);
    if (bookingDateTime <= now) {
      return res.status(400).json({ message: 'Tidak bisa booking waktu yang sudah lewat atau sedang berlangsung.' });
    }

    // Check existing bookings (conflict), excluding THIS booking
    const conflict = await Booking.findOne({
      where: {
        id: { [Op.ne]: booking.id },
        lapangan_id,
        tanggal,
        status: { [Op.in]: ['pending', 'dikonfirmasi'] },
        [Op.or]: [
          { jam_mulai: { [Op.lt]: jam_selesai }, jam_selesai: { [Op.gt]: jam_mulai } },
        ],
      },
    });
    if (conflict) return res.status(400).json({ message: 'Slot waktu tersebut sudah terisi. Pilih jam lain.' });

    // Check blocked slots
    const blocked = await SlotBlokir.findOne({
      where: {
        lapangan_id,
        tanggal,
        [Op.or]: [
          { jam_mulai: { [Op.lt]: jam_selesai }, jam_selesai: { [Op.gt]: jam_mulai } },
        ],
      },
    });
    if (blocked) return res.status(400).json({ message: 'Slot waktu diblokir untuk maintenance.' });

    const durasi = end - start;
    const total_harga = durasi * lapangan.harga_per_jam;

    await booking.update({
      lapangan_id,
      tanggal,
      jam_mulai,
      jam_selesai,
      durasi,
      total_harga,
      catatan: catatan || '',
    });

    return res.json({ message: 'Booking berhasil diperbarui.', booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/booking — Admin: all bookings
exports.getAllAdmin = async (req, res) => {
  try {
    const { status, lapangan_id, tanggal, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (lapangan_id) where.lapangan_id = lapangan_id;
    if (tanggal) where.tanggal = tanggal;

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'nama', 'email', 'no_hp'], where: Object.keys(userWhere).length ? userWhere : undefined },
        { model: Lapangan, as: 'lapangan' },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({ total: count, page: parseInt(page), bookings: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/booking/:id/status — Admin: approve/reject
exports.updateStatus = async (req, res) => {
  try {
    const { status, alasan_batal } = req.body;
    const validStatuses = ['dikonfirmasi', 'dibatalkan', 'selesai'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid.' });
    }

    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: Lapangan, as: 'lapangan' },
      ],
    });

    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' });

    await booking.update({ status, alasan_batal: alasan_batal || null });

    // Send WhatsApp based on status
    if (status === 'dikonfirmasi') {
      const msg = notifBookingDikonfirmasi(booking.user, booking.lapangan, booking);
      await sendWhatsApp(booking.user.no_hp, msg);
    } else if (status === 'dibatalkan') {
      const msg = notifBookingDibatalkan(booking.user, booking.lapangan, booking, alasan_batal);
      await sendWhatsApp(booking.user.no_hp, msg);
    }

    return res.json({ message: `Status booking berhasil diubah ke ${status}.`, booking });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/booking/:id/bayar — Admin: mark as paid
exports.updatePembayaran = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' });

    await booking.update({
      status_pembayaran: 'sudah_bayar',
      status: 'selesai',
    });

    return res.json({ message: 'Pembayaran berhasil dicatat. Status booking: Selesai.', booking });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/booking/:id
exports.getOne = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'nama', 'email', 'no_hp'] },
        { model: Lapangan, as: 'lapangan' },
      ],
    });
    if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan.' });

    // Check authorization: only admin or owner can read
    if (req.user.role !== 'admin' && req.user.id !== booking.user_id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    return res.json({ booking });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
