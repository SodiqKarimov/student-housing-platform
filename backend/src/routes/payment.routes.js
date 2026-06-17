const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

const STAFF = ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF'];

router.get('/', authorize(...STAFF), paymentController.getAllPayments);
router.get('/stats', authorize(...STAFF), paymentController.getPaymentStats);
router.post('/', authorize(...STAFF), paymentController.createPayment);
router.patch('/:id', authorize(...STAFF), paymentController.updatePayment);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), paymentController.deletePayment);

module.exports = router;
