const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lapangan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  jam_mulai: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jam_selesai: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  durasi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in hours',
  },
  total_harga: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'dikonfirmasi', 'selesai', 'dibatalkan'),
    defaultValue: 'pending',
  },
  status_pembayaran: {
    type: DataTypes.ENUM('belum_bayar', 'sudah_bayar'),
    defaultValue: 'belum_bayar',
  },
  catatan: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  alasan_batal: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  whatsapp_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'bookings',
  timestamps: true,
});

module.exports = Booking;
