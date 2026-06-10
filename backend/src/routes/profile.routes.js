const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/profile.controller');

router.use(authenticate);

router.get('/', ctrl.getProfile);
router.put('/', ctrl.updateProfile);
router.post('/change-password', ctrl.changePassword);

module.exports = router;
