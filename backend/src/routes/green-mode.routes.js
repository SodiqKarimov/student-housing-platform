const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/green-mode.controller');

router.use(authenticate);

router.get('/settings/:dormitoryId', ctrl.getSettings);
router.put('/settings/:dormitoryId', authorize('SUPER_ADMIN'), ctrl.updateSettings);

router.post('/logs', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), ctrl.addLog);
router.get('/logs', ctrl.getLogs);

router.get('/violations', ctrl.getViolations);
router.patch('/violations/:id/resolve', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.resolveViolation);

router.post('/exceptions', authorize('SUPER_ADMIN'), ctrl.grantException);
router.get('/exceptions', ctrl.getExceptions);

router.get('/stats', ctrl.getStats);

module.exports = router;
