const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
};

module.exports = isAdmin;
