const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Program = sequelize.define('Program', {
  program_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_program: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  durasi: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  tingkat: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  kelas: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  harga: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'program',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Program;
