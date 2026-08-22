const router = require('express').Router();
const ctrl = require('../controllers/jadwalController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/blokir', auth, isAdmin, ctrl.getBlokir);
router.post('/blokir', auth, isAdmin, ctrl.createBlokir);
router.delete('/blokir/:id', auth, isAdmin, ctrl.deleteBlokir);

module.exports = router;
