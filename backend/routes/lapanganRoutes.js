const router = require('express').Router();
const ctrl = require('../controllers/lapanganController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.get('/:id/slots', ctrl.getSlots);

router.post('/', auth, isAdmin, ctrl.create);
router.put('/:id', auth, isAdmin, ctrl.update);
router.delete('/:id', auth, isAdmin, ctrl.remove);

module.exports = router;
