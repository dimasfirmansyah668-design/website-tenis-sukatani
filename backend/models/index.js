const sequelize = require('../config/database');
const User = require('./User');
const Lapangan = require('./Lapangan');
const Booking = require('./Booking');
const SlotBlokir = require('./SlotBlokir');
const Program = require('./Program');

// Associations
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Lapangan.hasMany(Booking, { foreignKey: 'lapangan_id', as: 'bookings' });
Booking.belongsTo(Lapangan, { foreignKey: 'lapangan_id', as: 'lapangan' });

Lapangan.hasMany(SlotBlokir, { foreignKey: 'lapangan_id', as: 'slotBlokir' });
SlotBlokir.belongsTo(Lapangan, { foreignKey: 'lapangan_id', as: 'lapangan' });

module.exports = { sequelize, User, Lapangan, Booking, SlotBlokir, Program };

