const { SlotBlokir, Lapangan } = require('../models');

// GET /api/jadwal/blokir?lapangan_id=&tanggal=
exports.getBlokir = async (req, res) => {
  try {
    const { lapangan_id, tanggal } = req.query;
    const where = {};
    if (lapangan_id) where.lapangan_id = lapangan_id;
    if (tanggal) where.tanggal = tanggal;

    const slots = await SlotBlokir.findAll({
      where,
      include: [{ model: Lapangan, as: 'lapangan', attributes: ['nama'] }],
      order: [['tanggal', 'ASC'], ['jam_mulai', 'ASC']],
    });
    return res.json(slots);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/jadwal/blokir
exports.createBlokir = async (req, res) => {
  try {
    const { lapangan_id, tanggal, jam_mulai, jam_selesai, alasan } = req.body;
    if (!lapangan_id || !tanggal || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    const lapangan = await Lapangan.findByPk(lapangan_id);
    if (!lapangan) return res.status(404).json({ message: 'Lapangan tidak ditemukan.' });

    const slot = await SlotBlokir.create({ lapangan_id, tanggal, jam_mulai, jam_selesai, alasan: alasan || 'Maintenance' });
    return res.status(201).json({ message: 'Slot berhasil diblokir.', slot });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/jadwal/blokir/:id
exports.deleteBlokir = async (req, res) => {
  try {
    const slot = await SlotBlokir.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot blokir tidak ditemukan.' });
    await slot.destroy();
    return res.json({ message: 'Blokir slot berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
