// O'RQ-547 "Shaxsiy ma'lumotlar to'g'risida" O'zbekiston Respublikasi qonuni (2019)
// Shaxsiy ma'lumotlarni himoya qilish middleware

const { maskPinfl, maskPhone, maskPassport } = require('../utils/encryption');

// Javob jo'natishdan oldin maxfiy maydonlarni yashirish
function maskSensitiveData(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    if (req.user && ['DORMITORY_STAFF', 'STUDENT'].includes(req.user.role)) {
      data = maskDataRecursive(data);
    }
    return originalJson(data);
  };

  next();
}

function maskDataRecursive(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(maskDataRecursive);
  }

  const masked = { ...obj };

  if (masked.pinfl) masked.pinfl = maskPinfl(masked.pinfl);
  if (masked.phone) masked.phone = maskPhone(masked.phone);
  if (masked.passportSeries || masked.passportNumber) {
    masked.passport = maskPassport(masked.passportSeries, masked.passportNumber);
    delete masked.passportSeries;
    delete masked.passportNumber;
  }
  if (masked.ownerPinfl) masked.ownerPinfl = maskPinfl(masked.ownerPinfl);

  for (const key of Object.keys(masked)) {
    if (masked[key] && typeof masked[key] === 'object') {
      masked[key] = maskDataRecursive(masked[key]);
    }
  }

  return masked;
}

// Ma'lumot eksport limitini tekshirish
function checkExportLimit(req, res, next) {
  const EXPORT_LIMIT = 1000;
  if (req.query.limit && parseInt(req.query.limit) > EXPORT_LIMIT) {
    req.query.limit = EXPORT_LIMIT;
  }
  next();
}

module.exports = { maskSensitiveData, checkExportLimit };
