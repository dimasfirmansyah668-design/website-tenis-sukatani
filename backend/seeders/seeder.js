require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Lapangan } = require('../models');

const seed = async () => {
  await sequelize.sync({ force: true });
  console.log('✅ Database synced');

  // Create admin
  const adminPass = await bcrypt.hash('admin123', 10);
  await User.create({
    nama: 'Administrator',
    email: 'admin@tenis.com',
    no_hp: '081234567890',
    password: adminPass,
    role: 'admin',
  });

  // Create sample user
  const userPass = await bcrypt.hash('user123', 10);
  await User.create({
    nama: 'Budi Santoso',
    email: 'user@tenis.com',
    no_hp: '081298765432',
    password: userPass,
    role: 'user',
  });

  // Create lapangan
  await Lapangan.bulkCreate([
    {
      nama: 'Lapangan Utama (Outdoor)',
      harga_per_jam: 75000,
      foto_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      deskripsi: 'Lapangan tenis outdoor dengan permukaan clay terbaik. Cocok untuk latihan dan pertandingan.',
      fasilitas: JSON.stringify(['Parkir Luas', 'Toilet & Shower', 'Tribun Penonton', 'Kantin']),
      status: 'aktif',
      jam_buka: '06:00',
      jam_tutup: '18:00',
    }
  ]);

  console.log('✅ Seed data berhasil ditambahkan!');
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('Admin  → admin@tenis.com   / admin123');
  console.log('User   → user@tenis.com    / user123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
