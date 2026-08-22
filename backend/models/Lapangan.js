const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lapangan = sequelize.define('Lapangan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  harga_per_jam: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  foto_url: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  deskripsi: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  fasilitas: {
    type: DataTypes.TEXT,
    defaultValue: '',
    get() {
      const val = this.getDataValue('fasilitas');
      try { return val ? JSON.parse(val) : []; } catch { return []; }
    },
    set(val) {
      this.setDataValue('fasilitas', JSON.stringify(val));
    },
  },
  status: {
    type: DataTypes.ENUM('aktif', 'nonaktif'),
    defaultValue: 'aktif',
  },
  jam_buka: {
    type: DataTypes.STRING,
    defaultValue: '07:00',
  },
  jam_tutup: {
    type: DataTypes.STRING,
    defaultValue: '22:00',
  },
}, {
  tableName: 'lapangan',
  timestamps: true,
});

module.exports = Lapangan;
