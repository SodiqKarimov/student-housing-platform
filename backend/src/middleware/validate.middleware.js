const { validationResult, body, param, query } = require('express-validator');

// Validatsiya natijalarini tekshirish
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Ma'lumotlar noto'g'ri kiritilgan",
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// PINFL validatsiyasi (14 raqam)
const pinflRule = (field = 'pinfl') =>
  body(field)
    .notEmpty().withMessage('PINFL kiritilishi shart')
    .isLength({ min: 14, max: 14 }).withMessage("PINFL 14 ta raqamdan iborat bo'lishi kerak")
    .isNumeric().withMessage("PINFL faqat raqamlardan iborat bo'lishi kerak");

// Telefon validatsiyasi (+998XXXXXXXXX)
const phoneRule = (field = 'phone', required = false) => {
  const rule = body(field)
    .matches(/^\+998[0-9]{9}$/).withMessage("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
  return required ? rule.notEmpty().withMessage('Telefon raqami kiritilishi shart') : rule.optional({ checkFalsy: true });
};

// Talaba validatsiya qoidalari
const studentValidation = {
  create: [
    body('firstName').notEmpty().withMessage('Ism kiritilishi shart').isLength({ min: 2, max: 50 }).withMessage("Ism 2-50 ta belgidan iborat bo'lishi kerak").trim(),
    body('lastName').notEmpty().withMessage('Familiya kiritilishi shart').isLength({ min: 2, max: 50 }).withMessage("Familiya 2-50 ta belgidan iborat bo'lishi kerak").trim(),
    body('middleName').optional().isLength({ max: 50 }).withMessage("Otasining ismi 50 belgidan oshmasligi kerak").trim(),
    body('pinfl').optional({ checkFalsy: true }).isLength({ min: 14, max: 14 }).withMessage("PINFL 14 ta raqamdan iborat bo'lishi kerak").isNumeric().withMessage("PINFL faqat raqamlardan iborat bo'lishi kerak"),
    body('dateOfBirth').notEmpty().withMessage("Tug'ilgan sana kiritilishi shart").isISO8601().withMessage("Tug'ilgan sana YYYY-MM-DD formatida bo'lishi kerak"),
    body('gender').optional().isIn(['MALE', 'FEMALE']).withMessage("Jinsi MALE yoki FEMALE bo'lishi kerak"),
    body('faculty').notEmpty().withMessage('Fakultet kiritilishi shart').trim(),
    body('courseYear').optional().isInt({ min: 1, max: 6 }).withMessage("Kurs 1-6 orasida bo'lishi kerak"),
    body('housingType').optional().isIn(['DORMITORY', 'RENTAL', 'COMMUTER']).withMessage("Yashash turi noto'g'ri"),
    body('phone').optional({ checkFalsy: true }),
    body('parentPhone').optional({ checkFalsy: true }),
    validate,
  ],
  update: [
    body('firstName').optional().isLength({ min: 2, max: 50 }).withMessage("Ism 2-50 ta belgidan iborat bo'lishi kerak").trim(),
    body('lastName').optional().isLength({ min: 2, max: 50 }).withMessage("Familiya 2-50 ta belgidan iborat bo'lishi kerak").trim(),
    body('courseYear').optional().isInt({ min: 1, max: 6 }).withMessage("Kurs 1-6 orasida bo'lishi kerak"),
    phoneRule('phone'),
    validate,
  ],
  updateHousingType: [
    body('housingType').notEmpty().withMessage('Yashash turi kiritilishi shart').isIn(['DORMITORY', 'RENTAL', 'COMMUTER']).withMessage("Yashash turi noto'g'ri"),
    validate,
  ],
};

// Autentifikatsiya validatsiyasi
const authValidation = {
  login: [
    body('email').notEmpty().withMessage('Email kiritilishi shart').isEmail().withMessage("Email noto'g'ri formatda").normalizeEmail(),
    body('password').notEmpty().withMessage('Parol kiritilishi shart').isLength({ min: 6 }).withMessage("Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    validate,
  ],
};

// Foydalanuvchi validatsiyasi
const userValidation = {
  create: [
    body('firstName').notEmpty().withMessage('Ism kiritilishi shart').trim(),
    body('lastName').notEmpty().withMessage('Familiya kiritilishi shart').trim(),
    body('email').notEmpty().withMessage('Email kiritilishi shart').isEmail().withMessage("Email noto'g'ri formatda").normalizeEmail(),
    body('role').notEmpty().withMessage('Rol kiritilishi shart').isIn(['ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF', 'TUTOR']).withMessage("Rol noto'g'ri"),
    body('phone').optional({ checkFalsy: true }),
    validate,
  ],
};

// Ijara validatsiyasi
const rentalValidation = {
  create: [
    body('studentId').notEmpty().withMessage('Talaba ID kiritilishi shart'),
    body('region').notEmpty().withMessage('Viloyat kiritilishi shart').trim(),
    body('district').notEmpty().withMessage('Tuman kiritilishi shart').trim(),
    body('address').notEmpty().withMessage('Manzil kiritilishi shart').trim(),
    body('monthlyRent').optional().isFloat({ min: 0 }).withMessage("Ijara narxi musbat son bo'lishi kerak"),
    body('hostPinfl').optional().isLength({ min: 14, max: 14 }).isNumeric().withMessage("Uy egasining PINFL 14 raqamdan iborat bo'lishi kerak"),
    validate,
  ],
};

// Yotoqxona validatsiyasi
const dormitoryValidation = {
  create: [
    body('name').notEmpty().withMessage('Yotoqxona nomi kiritilishi shart').trim(),
    body('genderRestriction').optional().isIn(['MALE', 'FEMALE', 'MIXED']).withMessage("Jins noto'g'ri"),
    body('floors').optional().isInt({ min: 1, max: 20 }).withMessage("Qavatlar soni 1-20 orasida bo'lishi kerak"),
    validate,
  ],
  booking: [
    body('studentId').notEmpty().withMessage('Talaba ID kiritilishi shart'),
    body('dormitoryId').notEmpty().withMessage('Yotoqxona ID kiritilishi shart'),
    body('roomId').optional(),
    validate,
  ],
  review: [
    body('status').notEmpty().withMessage('Holat kiritilishi shart').isIn(['APPROVED', 'REJECTED']).withMessage("Holat APPROVED yoki REJECTED bo'lishi kerak"),
    body('note').optional().isLength({ max: 500 }).withMessage("Izoh 500 belgidan oshmasligi kerak"),
    validate,
  ],
};

// Green mode validatsiyasi
const greenModeValidation = {
  settings: [
    body('checkInTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Kirish vaqti HH:MM formatida bo'lishi kerak"),
    body('checkOutTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Chiqish vaqti HH:MM formatida bo'lishi kerak"),
    body('graceMinutes').optional().isInt({ min: 0, max: 60 }).withMessage("Muhlat 0-60 daqiqa orasida bo'lishi kerak"),
    validate,
  ],
  log: [
    body('studentId').notEmpty().withMessage('Talaba ID kiritilishi shart'),
    body('type').notEmpty().withMessage('Tur kiritilishi shart').isIn(['ENTRY', 'EXIT']).withMessage("Tur ENTRY yoki EXIT bo'lishi kerak"),
    body('dormitoryId').notEmpty().withMessage('Yotoqxona ID kiritilishi shart'),
    validate,
  ],
};

// Tavsiyanoma validatsiyasi
const recommendationValidation = {
  create: [
    body('studentId').notEmpty().withMessage('Talaba ID kiritilishi shart'),
    body('behavior').notEmpty().withMessage('Xulq-atvor kiritilishi shart').isIn(['EXCELLENT', 'GOOD', 'POOR']).withMessage("Xulq-atvor noto'g'ri"),
    body('activity').notEmpty().withMessage('Faollik kiritilishi shart').isIn(['VERY_ACTIVE', 'ACTIVE', 'PASSIVE']).withMessage("Faollik noto'g'ri"),
    body('discipline').notEmpty().withMessage('Intizom kiritilishi shart').isIn(['EXCELLENT', 'GOOD', 'POOR']).withMessage("Intizom noto'g'ri"),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage("Reyting 1-5 orasida bo'lishi kerak"),
    body('description').optional().isLength({ max: 1000 }).withMessage("Tavsif 1000 belgidan oshmasligi kerak"),
    validate,
  ],
};

// Profil validatsiyasi
const profileValidation = {
  changePassword: [
    body('currentPassword').notEmpty().withMessage("Joriy parol kiritilishi shart"),
    body('newPassword').notEmpty().withMessage('Yangi parol kiritilishi shart').isLength({ min: 8 }).withMessage("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak"),
    body('confirmPassword').notEmpty().withMessage('Parolni tasdiqlash kiritilishi shart').custom((val, { req }) => {
      if (val !== req.body.newPassword) throw new Error('Parollar mos kelmadi');
      return true;
    }),
    validate,
  ],
};

// Pagination validatsiyasi (query params)
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage("Sahifa raqami musbat son bo'lishi kerak"),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage("Limit 1-100 orasida bo'lishi kerak"),
  validate,
];

// ID validatsiyasi
const idValidation = [
  param('id').notEmpty().withMessage('ID kiritilishi shart').isUUID().withMessage("ID noto'g'ri formatda"),
  validate,
];

module.exports = {
  validate,
  studentValidation,
  authValidation,
  userValidation,
  rentalValidation,
  dormitoryValidation,
  greenModeValidation,
  recommendationValidation,
  profileValidation,
  paginationValidation,
  idValidation,
};
