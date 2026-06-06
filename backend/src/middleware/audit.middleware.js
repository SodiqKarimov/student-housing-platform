// O'RQ-547 "Shaxsiy ma'lumotlar to'g'risida" qonuni:
// Barcha ma'lumotlarga kirish holatlari qayd etilishi shart

const { prisma } = require('../config/database');
const logger = require('../config/logger');

async function logAudit(userId, action, entity, entityId, details = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: details.oldValues || null,
        newValues: details.newValues || null,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        endpoint: details.endpoint,
        description: details.description,
      },
    });
  } catch (err) {
    logger.error('Audit log yozishda xato', { error: err.message });
  }
}

// Shaxsiy ma'lumotlarga kirishni avtomatik qayd etish
function auditPersonalDataAccess(entity) {
  return async (req, res, next) => {
    if (req.user) {
      await logAudit(
        req.user.id,
        'VIEW_PERSONAL_DATA',
        entity,
        req.params.id || null,
        {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          endpoint: `${req.method} ${req.originalUrl}`,
        }
      );
    }
    next();
  };
}

module.exports = { logAudit, auditPersonalDataAccess };
