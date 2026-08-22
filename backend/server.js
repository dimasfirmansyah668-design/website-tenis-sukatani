require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const { sequelize } = require('./models');
const { Booking, User, Lapangan } = require('./models');
const { sendWhatsApp, notifReminderH1 } = require('./services/whatsappService');
const { Op } = require('sequelize');

const app = express();

// Middleware
app.use(cors({
  origin: true, // Izinkan dari port manapun (5173, 5174, dll)
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/lapangan', require('./routes/lapanganRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/report', require('./routes/reportRoutes'));
app.use('/api/jadwal', require('./routes/jadwalRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server berjalan dengan baik 🎾', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.', error: err.message });
});

// Cron: H-1 Reminder (runs daily at 8:00 AM)
cron.schedule('0 8 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const bookings = await Booking.findAll({
      where: { tanggal: tomorrowStr, status: 'dikonfirmasi' },
      include: [
        { model: User, as: 'user' },
        { model: Lapangan, as: 'lapangan' },
      ],
    });

    for (const booking of bookings) {
      const msg = notifReminderH1(booking.user, booking.lapangan, booking);
      await sendWhatsApp(booking.user.no_hp, msg);
      console.log(`📱 Reminder H-1 sent to ${booking.user.nama}`);
    }
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false }).then(() => {
  console.log('Database connected');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('Database connection error:', err);
});
