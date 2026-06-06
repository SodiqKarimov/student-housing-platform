const router = require('express').Router();
const dormitoryController = require('../controllers/dormitory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', dormitoryController.getAllDormitories);
router.post('/', authorize('SUPER_ADMIN'), dormitoryController.createDormitory);
router.get('/bookings', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), dormitoryController.getBookings);
router.get('/:id', dormitoryController.getDormitoryById);
router.get('/:dormitoryId/rooms', dormitoryController.getRooms);
router.post('/:dormitoryId/rooms', authorize('SUPER_ADMIN', 'ADMIN'), dormitoryController.createRoom);

router.post('/bookings', dormitoryController.createBooking);
router.patch('/bookings/:id/review', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF'), dormitoryController.reviewBooking);

module.exports = router;
