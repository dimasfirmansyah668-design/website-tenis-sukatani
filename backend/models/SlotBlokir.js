const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SlotBlokir = sequelize.define('SlotBlokir', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  alasan: {
    type: DataTypes.STRING,
    defaultValue: 'Maintenance',
  },
}, {
  tableName: 'slot_blokir',
  timestamps: true,
});

module.exports = SlotBlokir;
