const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/profile.controller');
const { prisma } = require('../config/database');
const { success } = require('../utils/response');

router.use(authenticate);

const storage = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: (req, file, cb) => cb(null, `${req.user.id}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', ctrl.getProfile);
router.put('/', ctrl.updateProfile);
router.post('/change-password', ctrl.changePassword);

router.get('/audit-logs', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const { prisma: db } = require('../config/database');
  const { success: ok } = require('../utils/response');
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip, take: parseInt(limit),
    }),
    db.auditLog.count({ where: { userId: req.user.id } }),
  ]);
  return ok(res, { items: logs, total, page: parseInt(page), limit: parseInt(limit) });
});

router.post('/avatar', upload.single('avatar'), async (req, res) => {
  const photoUrl = `/uploads/avatars/${req.file.filename}`;
  await prisma.user.update({ where: { id: req.user.id }, data: { photoUrl } });
  return success(res, { photoUrl }, 'Rasm yuklandi');
});

module.exports = router;
