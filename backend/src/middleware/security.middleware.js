const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// ================================================================
// XSS HIMOYASI — barcha string inputlarni tozalash
// ================================================================

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return escapeHtml(obj.trim());
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      const cleanKey = escapeHtml(key);
      sanitized[cleanKey] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

const xssSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

// ================================================================
// SQL INJECTION HIMOYASI — xavfli belgilarni tekshirish
// ================================================================

const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|--|;|\bOR\b\s+\d+\s*=\s*\d+)/gi;

const sqlInjectionCheck = (req, res, next) => {
  const checkValue = (val) => {
    if (typeof val === 'string' && SQL_INJECTION_PATTERN.test(val)) {
      return true;
    }
    return false;
  };

  const checkObj = (obj) => {
    if (!obj) return false;
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && checkValue(val)) return true;
      if (typeof val === 'object') return checkObj(val);
    }
    return false;
  };

  if (checkObj(req.body) || checkObj(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'Noto\'g\'ri so\'rov formati',
    });
  }
  next();
};

// ================================================================
// CSRF TOKEN (Double Submit Cookie pattern)
// ================================================================

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';
const CSRF_SKIP_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_SKIP_PATHS = ['/api/v1/public', '/api/v1/auth/oneid', '/health'];

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const csrfMiddleware = (req, res, next) => {
  if (CSRF_SKIP_METHODS.includes(req.method)) {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = generateCsrfToken();
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 3600000,
      });
    }
    return next();
  }

  const isSkipped = CSRF_SKIP_PATHS.some(p => req.path.startsWith(p));
  if (isSkipped) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF tekshiruvi muvaffaqiyatsiz',
    });
  }
  next();
};

// ================================================================
// FOYDALANUVCHI BAZALI RATE LIMITING
// ================================================================

const userRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Juda ko\'p so\'rov. Biroz kutib turing.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ommaviy ariza uchun qat'iy cheklash (spam oldini olish)
const publicArizaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 3,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: 'Bir soatda maksimal 3 ta ariza yuborish mumkin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================================
// XAVFSIZLIK SARLAVHALARI (Helmet qo'shimcha)
// ================================================================

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// ================================================================
// PINFL MASKALASH (log va responseda)
// ================================================================

const maskPinfl = (pinfl) => {
  if (!pinfl || pinfl.length < 8) return '***';
  return pinfl.slice(0, 4) + '****' + pinfl.slice(-2);
};

module.exports = {
  xssSanitize,
  sqlInjectionCheck,
  csrfMiddleware,
  userRateLimiter,
  publicArizaLimiter,
  securityHeaders,
  maskPinfl,
  generateCsrfToken,
};
