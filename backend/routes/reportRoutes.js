const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/summary', auth, isAdmin, ctrl.getSummary);
router.get('/booking', auth, isAdmin, ctrl.getBookingReport);

module.exports = router;
