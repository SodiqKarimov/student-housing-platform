const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');

// Yashil rejim sozlamalarini olish
exports.getSettings = async (req, res) => {
  const { dormitoryId } = req.params;
  let settings = await prisma.greenModeSettings.findUnique({ where: { dormitoryId } });
  if (!settings) {
    settings = await prisma.greenModeSettings.create({
      data: { dormitoryId, entryDeadline: '22:00', exitDeadline: '05:00' },
    });
  }
  return success(res, settings);
};

// Vaqt sozlamalarini yangilash (Super Admin)
exports.updateSettings = async (req, res) => {
  const { dormitoryId } = req.params;
  const { entryDeadline, exitDeadline, isActive } = req.body;
  if (!req.body.reason) return error(res, 'O\'zgarish sababi majburiy', 400);

  const settings = await prisma.greenModeSettings.upsert({
    where: { dormitoryId },
    update: { entryDeadline, exitDeadline, isActive, updatedBy: req.user.id },
    create: { dormitoryId, entryDeadline: entryDeadline || '22:00', exitDeadline: exitDeadline || '05:00', isActive: isActive !== false, updatedBy: req.user.id },
  });

  await logAudit(req.user.id, 'UPDATE', 'GreenModeSettings', settings.id, {
    newValues: { entryDeadline, exitDeadline },
    description: `Yashil rejim yangilandi: ${req.body.reason}`,
  });

  return success(res, settings, 'Sozlamalar yangilandi');
};

// Kirish/chiqish hodisasi qo'shish
exports.addLog = async (req, res) => {
  const { studentId, dormitoryId, eventType, note } = req.body;
  if (!['CHECKIN', 'CHECKOUT'].includes(eventType)) return error(res, 'Noto\'g\'ri hodisa turi', 400);

  const settings = await prisma.greenModeSettings.findUnique({ where: { dormitoryId } });
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let isViolation = false;
  if (settings) {
    if (eventType === 'CHECKIN' && timeStr > settings.entryDeadline) isViolation = true;
    if (eventType === 'CHECKOUT' && timeStr < settings.exitDeadline) isViolation = true;
  }

  const log = await prisma.greenModeLog.create({
    data: { studentId, dormitoryId, eventType, isViolation, note, recordedBy: req.user.id },
  });

  if (isViolation) {
    await prisma.greenModeViolation.create({
      data: {
        studentId, dormitoryId,
        violationType: eventType === 'CHECKIN' ? 'LATE_ENTRY' : 'EARLY_EXIT',
        violationTime: now,
        note: `Avtomatik: ${eventType === 'CHECKIN' ? 'Kech kirish' : 'Erta chiqish'} ${timeStr}`,
      },
    });
  }

  return success(res, log, isViolation ? 'Hodisa qayd etildi (qoidabuzarlik!)' : 'Hodisa qayd etildi', 201);
};

// Kirish/chiqish tarixi
exports.getLogs = async (req, res) => {
  const { dormitoryId, studentId, date, page = 1, limit = 30 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(dormitoryId && { dormitoryId }),
    ...(studentId && { studentId }),
    ...(date && { eventTime: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } }),
  };

  const [logs, total] = await Promise.all([
    prisma.greenModeLog.findMany({
      where,
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
      skip, take: parseInt(limit),
      orderBy: { eventTime: 'desc' },
    }),
    prisma.greenModeLog.count({ where }),
  ]);

  return paginated(res, logs, total, page, limit);
};

// Qoidabuzarliklar ro'yxati
exports.getViolations = async (req, res) => {
  const { dormitoryId, resolved, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(dormitoryId && { dormitoryId }),
    ...(resolved === 'true' ? { resolvedAt: { not: null } } : resolved === 'false' ? { resolvedAt: null } : {}),
  };

  const [violations, total] = await Promise.all([
    prisma.greenModeViolation.findMany({
      where,
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
      skip, take: parseInt(limit),
      orderBy: { violationTime: 'desc' },
    }),
    prisma.greenModeViolation.count({ where }),
  ]);

  return paginated(res, violations, total, page, limit);
};

// Qoidabuzarlikni hal qilish
exports.resolveViolation = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const updated = await prisma.greenModeViolation.update({
    where: { id },
    data: { resolvedAt: new Date(), resolvedBy: req.user.id, note },
  });

  return success(res, updated, 'Qoidabuzarlik hal qilindi');
};

// Istisnoli ruxsat berish (Super Admin)
exports.grantException = async (req, res) => {
  const { studentId, dormitoryId, reason, allowedFrom, allowedUntil } = req.body;
  if (!reason) return error(res, 'Sabab majburiy', 400);

  const exc = await prisma.greenModeException.create({
    data: {
      studentId, dormitoryId, reason,
      allowedFrom: new Date(allowedFrom),
      allowedUntil: new Date(allowedUntil),
      grantedBy: req.user.id,
    },
  });

  await logAudit(req.user.id, 'CREATE', 'GreenModeException', exc.id, {
    newValues: { studentId, reason },
    description: `Istisnoli ruxsat berildi: ${reason}`,
  });

  return success(res, exc, 'Istisnoli ruxsat berildi', 201);
};

// Istisnoli ruxsatlar ro'yxati
exports.getExceptions = async (req, res) => {
  const exceptions = await prisma.greenModeException.findMany({
    where: { isActive: true },
    include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, exceptions);
};

// Statistika
exports.getStats = async (req, res) => {
  const { dormitoryId } = req.query;
  const where = dormitoryId ? { dormitoryId } : {};

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [totalLogs, violations, todayLogs, activeExceptions] = await Promise.all([
    prisma.greenModeLog.count({ where }),
    prisma.greenModeViolation.count({ where: { ...where, resolvedAt: null } }),
    prisma.greenModeLog.count({ where: { ...where, eventTime: { gte: today } } }),
    prisma.greenModeException.count({ where: { isActive: true } }),
  ]);

  return success(res, { totalLogs, violations, todayLogs, activeExceptions });
};
