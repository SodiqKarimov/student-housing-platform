const router = require('express').Router();
const commuterController = require('../controllers/commuter.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), commuterController.getAllCommuters);
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), commuterController.getCommuterStats);
router.post('/', commuterController.createCommuter);

module.exports = router;
