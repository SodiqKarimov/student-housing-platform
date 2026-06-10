const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/reports.controller');

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'));

router.get('/students', ctrl.studentsReport);
router.get('/dormitories', ctrl.dormitoriesReport);
router.get('/rentals', ctrl.rentalsReport);
router.get('/violations', ctrl.violationsReport);
router.get('/audit', authorize('SUPER_ADMIN'), ctrl.auditReport);
router.get('/faceid', ctrl.faceIdReport);

module.exports = router;
