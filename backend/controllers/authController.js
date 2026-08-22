const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nama, email, no_hp, password } = req.body;

    if (!nama || !email || !no_hp || !password) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ nama, email, no_hp, password: hashed });

    const token = generateToken(user);
    return res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: { id: user.id, nama: user.nama, email: user.email, no_hp: user.no_hp, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Akun Anda dinonaktifkan. Hubungi admin.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const token = generateToken(user);
    return res.json({
      message: 'Login berhasil!',
      token,
      user: { id: user.id, nama: user.nama, email: user.email, no_hp: user.no_hp, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = req.user;
  return res.json({
    id: user.id,
    nama: user.nama,
    email: user.email,
    no_hp: user.no_hp,
    role: user.role,
  });
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { nama, no_hp, password } = req.body;
    const user = req.user;

    if (nama) user.nama = nama;
    if (no_hp) user.no_hp = no_hp;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    return res.json({ message: 'Profil berhasil diperbarui.', user: { id: user.id, nama: user.nama, email: user.email, no_hp: user.no_hp } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
