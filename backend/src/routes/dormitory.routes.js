const router = require('express').Router();
const ctrl = require('../controllers/dormitory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'TUTOR', 'DORMITORY_STAFF'), ctrl.getAllDormitories);
router.post('/', authorize('SUPER_ADMIN'), ctrl.createDormitory);
router.put('/:id', authorize('SUPER_ADMIN'), ctrl.updateDormitory);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.deleteDormitory);

router.get('/bookings', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), ctrl.getBookings);
router.get('/archives/:archiveId', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), ctrl.getArchiveDetail);

router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'TUTOR', 'DORMITORY_STAFF'), ctrl.getDormitoryById);
router.get('/rooms/:roomId/students', ctrl.getRoomStudents);
router.get('/:dormitoryId/rooms', ctrl.getRooms);
router.post('/:dormitoryId/rooms', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.createRoom);

router.post('/bookings', ctrl.createBooking);
router.patch('/bookings/:id/review', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), ctrl.reviewBooking);

router.get('/:dormId/report', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), ctrl.getDormitoryReport);
router.post('/:dormId/archive', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.archiveDormitory);
router.get('/:dormId/archives', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), ctrl.getArchives);

module.exports = router;
