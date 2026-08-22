const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

// User routes
router.post('/', auth, ctrl.create);
router.get('/my', auth, ctrl.getMyBookings);
router.put('/:id', auth, ctrl.updateByUser);
router.delete('/:id', auth, ctrl.cancelByUser);

// Admin routes
router.get('/', auth, isAdmin, ctrl.getAllAdmin);
router.get('/:id', auth, ctrl.getOne);
router.patch('/:id/status', auth, isAdmin, ctrl.updateStatus);
router.patch('/:id/bayar', auth, isAdmin, ctrl.updatePembayaran);

module.exports = router;
