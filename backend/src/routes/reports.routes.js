const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/reports.controller');

router.use(authenticate);

const staff = 'DORMITORY_STAFF';
router.get('/students',    authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', staff), ctrl.studentsReport);
router.get('/dormitories', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', staff), ctrl.dormitoriesReport);
router.get('/rentals',     authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'),         ctrl.rentalsReport);
router.get('/violations',  authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', staff), ctrl.violationsReport);
router.get('/audit',       authorize('SUPER_ADMIN'),                                  ctrl.auditReport);
router.get('/faceid',      authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', staff), ctrl.faceIdReport);

module.exports = router;
