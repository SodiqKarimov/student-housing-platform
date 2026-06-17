const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

// Prisma xatolarini aniqlab, foydalanuvchiga qulay xabar qaytarish
function handlePrismaError(err) {
  switch (err.code) {
    case 'P2002':
      return { status: 409, message: `Bu ma'lumot allaqachon mavjud: ${err.meta?.target?.join(', ') || ''}` };
    case 'P2025':
      return { status: 404, message: 'Ma\'lumot topilmadi' };
    case 'P2003':
      return { status: 400, message: 'Bog\'liq ma\'lumot topilmadi (foreign key xatosi)' };
    case 'P2014':
      return { status: 400, message: 'Bog\'liq ma\'lumotlarni o\'chirib bo\'lmadi' };
    default:
      return { status: 500, message: 'Ma\'lumotlar bazasida xato' };
  }
}

// JWT xatolarini aniqlab, qulay xabar qaytarish
function handleJWTError(err) {
  if (err.name === 'TokenExpiredError') {
    return { status: 401, message: 'Sessiya muddati tugagan. Qayta kiring' };
  }
  if (err.name === 'JsonWebTokenError') {
    return { status: 401, message: "Noto'g'ri token" };
  }
  return { status: 401, message: 'Autentifikatsiya xatosi' };
}

// Multer xatolarini aniqlash
function handleMulterError(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return { status: 400, message: "Fayl hajmi 3MB dan oshmasligi kerak" };
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return { status: 400, message: "Noto'g'ri fayl maydoni" };
  }
  return { status: 400, message: err.message || 'Fayl yuklashda xato' };
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server xatosi';
  let errors = err.errors || null;

  // Prisma xatosi
  if (err.constructor?.name === 'PrismaClientKnownRequestError' || err.code?.startsWith('P')) {
    const prismaErr = handlePrismaError(err);
    statusCode = prismaErr.status;
    message = prismaErr.message;
  }

  // JWT xatosi
  else if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    const jwtErr = handleJWTError(err);
    statusCode = jwtErr.status;
    message = jwtErr.message;
  }

  // Multer xatosi
  else if (err.name === 'MulterError') {
    const multerErr = handleMulterError(err);
    statusCode = multerErr.status;
    message = multerErr.message;
  }

  // SyntaxError (JSON parse xatosi)
  else if (err instanceof SyntaxError && err.status === 400) {
    statusCode = 400;
    message = "JSON formati noto'g'ri";
  }

  // Kutilmagan xatolarni log qilish
  if (statusCode >= 500) {
    logger.error('Kutilmagan server xatosi', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.id,
    });
  } else if (statusCode >= 400) {
    logger.warn('Client xatosi', {
      status: statusCode,
      message,
      url: req.originalUrl,
      method: req.method,
      user: req.user?.id,
    });
  }

  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 ? 'Server xatosi yuz berdi' : message,
  };

  if (errors) response.errors = errors;

  // Development mode da stack trace ko'rsatish
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

// Async controller xatolarini ushlash (try-catch o'rniga)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
