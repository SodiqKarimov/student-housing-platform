const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/recommendation.controller');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/student/:studentId', ctrl.getByStudent);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE'), ctrl.create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE'), ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DORMITORY_STAFF', 'DEAN_OFFICE'), ctrl.remove);

module.exports = router;
