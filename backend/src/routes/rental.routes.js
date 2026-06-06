const router = require('express').Router();
const rentalController = require('../controllers/rental.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), rentalController.getAllRentals);
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), rentalController.getRentalStats);
router.post('/', rentalController.createRental);
router.get('/:id', rentalController.getRentalById);
router.patch('/:id/verify', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), rentalController.verifyRental);

module.exports = router;
