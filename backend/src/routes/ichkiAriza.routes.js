const router = require('express').Router();
const ichkiArizaController = require('../controllers/ichkiAriza.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

const ALL_STAFF = ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF', 'TUTOR'];
const MANAGERS = ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF'];

router.post('/', ichkiArizaController.createIchkiAriza);
router.get('/', authorize(...MANAGERS), ichkiArizaController.getAllIchkiArizalar);
router.get('/stats', authorize(...MANAGERS), ichkiArizaController.getIchkiArizaStats);
router.get('/:id', authorize(...ALL_STAFF), ichkiArizaController.getIchkiArizaById);
router.patch('/:id/status', authorize(...MANAGERS), ichkiArizaController.updateIchkiArizaStatus);

module.exports = router;
