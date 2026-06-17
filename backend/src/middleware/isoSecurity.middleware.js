/**
 * ISO/IEC 27001, 27002, 27003, 27005, 27008, 27014 talablariga muvofiq
 * Axborot xavfsizligini boshqarish tizimi middleware
 */

const crypto = require('crypto');
const logger = require('../config/logger');

// ================================================================
// ISO 27001 A.9 — Kirish nazorati (Access Control)
// ================================================================

const ACCESS_ATTEMPTS = new Map(); // IP → { count, firstAt }
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const bruteForceProtection = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const record = ACCESS_ATTEMPTS.get(ip);

  if (record) {
    const elapsed = (now - record.firstAt) / 60000;
    if (elapsed > LOCKOUT_MINUTES) {
      ACCESS_ATTEMPTS.delete(ip);
    } else if (record.count >= MAX_ATTEMPTS) {
      const remaining = Math.ceil(LOCKOUT_MINUTES - elapsed);
      logger.warn('Brute-force urinish bloklandi', { ip, attempts: record.count });
      return res.status(429).json({
        success: false,
        message: `Juda ko'p urinish. ${remaining} daqiqadan keyin urinib ko'ring.`,
        retryAfter: remaining * 60,
      });
    }
  }
  next();
};

const recordFailedLogin = (ip) => {
  const now = Date.now();
  const record = ACCESS_ATTEMPTS.get(ip) || { count: 0, firstAt: now };
  record.count += 1;
  ACCESS_ATTEMPTS.set(ip, record);
};

const clearLoginAttempts = (ip) => {
  ACCESS_ATTEMPTS.delete(ip);
};

// ================================================================
// ISO 27001 A.12.4 — Audit va monitoring (Logging and Monitoring)
// ================================================================

const ISO_SENSITIVE_PATHS = ['/auth', '/users', '/students', '/profile'];

const auditTrail = (req, res, next) => {
  const start = Date.now();
  const isSensitive = ISO_SENSITIVE_PATHS.some(p => req.path.startsWith(p));

  if (!isSensitive) return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      duration: `${duration}ms`,
      success: body?.success,
    };

    if (res.statusCode >= 400) {
      logger.warn('ISO-27001 Audit: Muvaffaqiyatsiz so\'rov', logEntry);
    } else if (req.method !== 'GET') {
      logger.info('ISO-27001 Audit: O\'zgartirish amali', logEntry);
    }

    return originalJson(body);
  };

  next();
};

// ================================================================
// ISO 27001 A.10 — Kriptografiya (Cryptography)
// ================================================================

const SESSION_INTEGRITY_FIELD = 'x-session-integrity';

const sessionIntegrity = (req, res, next) => {
  if (!req.user) return next();

  // Session yaxlitligini tekshirish uchun imzo
  const sessionData = `${req.user.id}:${req.user.role}:${req.user.email}`;
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
    .update(sessionData)
    .digest('hex')
    .slice(0, 16);

  res.setHeader(SESSION_INTEGRITY_FIELD, signature);
  next();
};

// ================================================================
// ISO 27001 A.18.1 — Muvofiqlik (Compliance)
// ================================================================

const complianceHeaders = (req, res, next) => {
  // O'RQ-547 va ISO 27001 muvofiqlik sarlavhalari
  res.setHeader('X-Data-Classification', 'CONFIDENTIAL');
  res.setHeader('X-Privacy-Policy', "O'RQ-547-2019");
  res.setHeader('X-Security-Standard', 'ISO-IEC-27001');
  res.setHeader('X-Audit-Trail', 'enabled');
  next();
};

// ================================================================
// ISO 27005 — Risk boshqaruvi: Shaxsiy ma'lumotlarga kirish logga yozish
// ================================================================

const PERSONAL_DATA_PATHS = ['/students', '/users', '/profile'];

const personalDataAccessLog = (req, res, next) => {
  const isPersonalDataAccess = req.method === 'GET' && PERSONAL_DATA_PATHS.some(p => req.path.includes(p));
  if (isPersonalDataAccess && req.user) {
    logger.info('ISO-27005 Risk: Shaxsiy ma\'lumotlarga kirish', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// ================================================================
// ISO 27014 — Boshqaruv: Sessiya nazorati
// ================================================================

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 soat

const sessionTimeout = (req, res, next) => {
  if (!req.user) return next();

  // JWT ning exp field si token middleware da tekshiriladi
  // Bu yerda qo'shimcha server-side tekshiruv
  const tokenIat = req.user.iat; // JWT issued at
  if (tokenIat && Date.now() - tokenIat * 1000 > SESSION_TIMEOUT_MS) {
    return res.status(401).json({
      success: false,
      message: 'Sessiya muddati tugadi. Qayta kiring.',
    });
  }
  next();
};

// ================================================================
// Parol murakkablik tekshiruvi (ISO 27002 A.9.4)
// ================================================================

const PASSWORD_POLICY = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < PASSWORD_POLICY.minLength) errors.push(`Kamida ${PASSWORD_POLICY.minLength} belgi`);
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) errors.push('Kamida 1 ta katta harf');
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) errors.push('Kamida 1 ta kichik harf');
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) errors.push('Kamida 1 ta raqam');
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Kamida 1 ta maxsus belgi (!@#$%^&* va h.k.)');
  }
  return errors;
};

const passwordStrengthMiddleware = (req, res, next) => {
  const { newPassword, password } = req.body;
  const pwd = newPassword || password;
  if (!pwd) return next();

  const errors = validatePasswordStrength(pwd);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Parol xavfsizlik talablariga javob bermaydi',
      errors,
    });
  }
  next();
};

module.exports = {
  bruteForceProtection,
  recordFailedLogin,
  clearLoginAttempts,
  auditTrail,
  sessionIntegrity,
  complianceHeaders,
  personalDataAccessLog,
  sessionTimeout,
  validatePasswordStrength,
  passwordStrengthMiddleware,
};
