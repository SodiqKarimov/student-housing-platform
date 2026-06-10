const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/face-id.controller');

router.use(authenticate);

router.get('/events', ctrl.getEvents);
router.post('/events', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), ctrl.addEvent);
router.get('/absent', ctrl.getAbsentStudents);
router.get('/stats', ctrl.getStats);

module.exports = router;
