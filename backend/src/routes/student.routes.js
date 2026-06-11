const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { auditPersonalDataAccess } = require('../middleware/audit.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/students',
  filename: (req, file, cb) => cb(null, `student_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), studentController.getAllStudents);
router.get('/stats/housing', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), studentController.getHousingStats);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), upload.single('photo'), studentController.createStudent);
router.get('/:id', auditPersonalDataAccess('Student'), studentController.getStudentById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), studentController.updateStudent);
router.post('/:id/sync-hemis', authorize('SUPER_ADMIN', 'ADMIN'), studentController.syncFromHemis);
router.patch('/:id/housing-type', authorize('SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE'), studentController.updateHousingType);

module.exports = router;
