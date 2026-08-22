const { User } = require('../models');

// GET /api/users (admin)
exports.getAll = async (req, res) => {
  try {
    const { search, role } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { no_hp: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'nama', 'email', 'no_hp', 'role', 'is_active', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/users/:id/toggle (admin)
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Tidak bisa menonaktifkan admin.' });

    await user.update({ is_active: !user.is_active });
    return res.json({ message: `User berhasil ${user.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`, user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/users/:id (admin)
exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Tidak bisa menghapus admin.' });
    await user.destroy();
    return res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
