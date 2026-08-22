const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/', auth, isAdmin, ctrl.getAll);
router.patch('/:id/toggle', auth, isAdmin, ctrl.toggleActive);
router.delete('/:id', auth, isAdmin, ctrl.remove);

module.exports = router;
