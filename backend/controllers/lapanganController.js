const { Lapangan, Booking, SlotBlokir } = require('../models');
const { Op } = require('sequelize');

// Helper: generate time slots
const generateSlots = (jamBuka, jamTutup) => {
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

// GET /api/lapangan
exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const lapangan = await Lapangan.findAll({ where, order: [['id', 'ASC']] });
    return res.json(lapangan);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/lapangan/:id
exports.getOne = async (req, res) => {
  try {
    const lapangan = await Lapangan.findByPk(req.params.id);
    if (!lapangan) return res.status(404).json({ message: 'Lapangan tidak ditemukan.' });
    return res.json(lapangan);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/lapangan/:id/slots?tanggal=YYYY-MM-DD
exports.getSlots = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const { id } = req.params;

    if (!tanggal) return res.status(400).json({ message: 'Parameter tanggal wajib diisi.' });

    const lapangan = await Lapangan.findByPk(id);
    if (!lapangan) return res.status(404).json({ message: 'Lapangan tidak ditemukan.' });

    const allSlots = generateSlots(lapangan.jam_buka, lapangan.jam_tutup);

    // Check existing bookings
    const { exclude_booking_id } = req.query;
    const bookingWhere = {
      lapangan_id: id,
      tanggal,
      status: { [Op.in]: ['pending', 'dikonfirmasi'] },
    };
    if (exclude_booking_id) {
      bookingWhere.id = { [Op.ne]: exclude_booking_id };
    }

    const bookings = await Booking.findAll({ where: bookingWhere });

    // Get blocked slots
    const blocked = await SlotBlokir.findAll({
      where: { lapangan_id: id, tanggal },
    });

    // Determine current time in WIB (UTC+7)
    const now = new Date();
    const nowWIB = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const todayStr = nowWIB.toISOString().split('T')[0];
    const currentHour = nowWIB.getUTCHours();
    const isToday = tanggal === todayStr;

    const slotsWithStatus = allSlots.map((slot) => {
      const slotHour = parseInt(slot.jam_mulai.split(':')[0]);

      const isBooked = bookings.some(
        (b) => b.jam_mulai <= slot.jam_mulai && b.jam_selesai > slot.jam_mulai
      );
      const isBlocked = blocked.some(
        (b) => b.jam_mulai <= slot.jam_mulai && b.jam_selesai > slot.jam_mulai
      );
      // Slot sudah lewat: jika hari ini dan jam slot <= jam sekarang
      const isPast = isToday && slotHour <= currentHour;

      let statusSlot = 'tersedia';
      if (isPast) statusSlot = 'terlewat';
      if (isBooked) statusSlot = 'terisi';
      if (isBlocked) statusSlot = 'diblokir';

      return { ...slot, status: statusSlot };
    });

    return res.json({ lapangan, tanggal, slots: slotsWithStatus });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// POST /api/lapangan (admin)
exports.create = async (req, res) => {
  try {
    const { nama, harga_per_jam, deskripsi, fasilitas, status, jam_buka, jam_tutup, foto_url } = req.body;
    if (!nama || !harga_per_jam) {
      return res.status(400).json({ message: 'Nama dan harga wajib diisi.' });
    }
    const lapangan = await Lapangan.create({
      nama, harga_per_jam, deskripsi, fasilitas: fasilitas || [],
      status: status || 'aktif', jam_buka, jam_tutup, foto_url,
    });
    return res.status(201).json({ message: 'Lapangan berhasil ditambahkan.', lapangan });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/lapangan/:id (admin)
exports.update = async (req, res) => {
  try {
    const lapangan = await Lapangan.findByPk(req.params.id);
    if (!lapangan) return res.status(404).json({ message: 'Lapangan tidak ditemukan.' });

    const { nama, harga_per_jam, deskripsi, fasilitas, status, jam_buka, jam_tutup, foto_url } = req.body;
    await lapangan.update({ nama, harga_per_jam, deskripsi, fasilitas, status, jam_buka, jam_tutup, foto_url });
    return res.json({ message: 'Lapangan berhasil diperbarui.', lapangan });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/lapangan/:id (admin)
exports.remove = async (req, res) => {
  try {
    const lapangan = await Lapangan.findByPk(req.params.id);
    if (!lapangan) return res.status(404).json({ message: 'Lapangan tidak ditemukan.' });
    await lapangan.destroy();
    return res.json({ message: 'Lapangan berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
