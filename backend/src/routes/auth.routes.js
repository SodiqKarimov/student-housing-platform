const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authValidation } = require('../middleware/validate.middleware');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Email va parol bilan kirish
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli kirish
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validatsiya xatosi
 *       401:
 *         description: Email yoki parol noto'g'ri
 */
router.get('/oneid/url', authController.getOneIdUrl);
router.get('/oneid/callback', authController.oneIdCallback);
router.post('/login', authValidation.login, authController.loginWithPassword);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Access tokenni yangilash
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token yangilandi
 *       401:
 *         description: Refresh token yaroqsiz
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Tizimdan chiqish
 *     responses:
 *       200:
 *         description: Chiqildi
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Joriy foydalanuvchi ma'lumotlari
 *     responses:
 *       200:
 *         description: Foydalanuvchi ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Autentifikatsiya talab etiladi
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;
