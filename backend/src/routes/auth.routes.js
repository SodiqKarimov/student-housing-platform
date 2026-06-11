const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/oneid/url', authController.getOneIdUrl);
router.get('/oneid/callback', authController.oneIdCallback);
router.post('/login', authController.loginWithPassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
