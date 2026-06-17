const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { auditPersonalDataAccess } = require('../middleware/audit.middleware');
const { studentValidation, paginationValidation } = require('../middleware/validate.middleware');
const { cacheMiddleware, TTL } = require('../config/cache');

const storage = multer.diskStorage({
  destination: 'uploads/students',
  filename: (req, file, cb) => cb(null, `student_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Faqat JPG, PNG yoki WEBP rasm yuklanishi mumkin'));
    cb(null, true);
  },
});

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), paginationValidation, cacheMiddleware(TTL.SHORT), studentController.getAllStudents);
router.get('/stats/housing', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), cacheMiddleware(TTL.STATS), studentController.getHousingStats);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), upload.single('photo'), studentValidation.create, studentController.createStudent);
router.get('/:id', auditPersonalDataAccess('Student'), studentController.getStudentById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), studentValidation.update, studentController.updateStudent);
router.post('/:id/sync-hemis', authorize('SUPER_ADMIN', 'ADMIN'), studentController.syncFromHemis);
router.patch('/:id/housing-type', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), studentValidation.updateHousingType, studentController.updateHousingType);

module.exports = router;
