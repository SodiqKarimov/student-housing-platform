const { prisma } = require('../config/database');
const { success, error, paginated } = require('../utils/response');

// Barcha hodisalar ro'yxati
exports.getEvents = async (req, res) => {
  const { dormitoryId, studentId, date, page = 1, limit = 30 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(dormitoryId && { dormitoryId }),
    ...(studentId && { studentId }),
    ...(date && { eventTime: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } }),
  };

  const [events, total] = await Promise.all([
    prisma.faceIdEvent.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        dormitory: { select: { name: true } },
      },
      skip, take: parseInt(limit),
      orderBy: { eventTime: 'desc' },
    }),
    prisma.faceIdEvent.count({ where }),
  ]);

  return paginated(res, events, total, page, limit);
};

// Qo'lda hodisa qo'shish (mock yoki xodim tomonidan)
exports.addEvent = async (req, res) => {
  const { studentId, dormitoryId, eventType, cameraId, note } = req.body;
  if (!['CHECKIN', 'CHECKOUT', 'UNRECOGNIZED'].includes(eventType)) {
    return error(res, 'Noto\'g\'ri hodisa turi', 400);
  }

  const event = await prisma.faceIdEvent.create({
    data: {
      studentId: studentId || null,
      dormitoryId, eventType,
      cameraId: cameraId || 'MANUAL',
      confidence: studentId ? 0.99 : 0,
      isManual: true,
      note,
    },
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  // Kirish/chiqish logiga ham qo'shish
  if (studentId && ['CHECKIN', 'CHECKOUT'].includes(eventType)) {
    await prisma.greenModeLog.create({
      data: { studentId, dormitoryId, eventType, recordedBy: 'FACEID', note: 'Face ID orqali' },
    }).catch(() => {});
  }

  return success(res, event, 'Hodisa qayd etildi', 201);
};

// 24 soat ko'rinmagan talabalar
exports.getAbsentStudents = async (req, res) => {
  const { dormitoryId } = req.query;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Faol bronli talabalar
  const activeBookings = await prisma.dormitoryBooking.findMany({
    where: {
      status: 'ACTIVE',
      ...(dormitoryId && { dormitoryId }),
    },
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      dormitory: { select: { name: true } },
    },
  });

  // Har biri uchun oxirgi face ID hodisasini topamiz
  const absent = [];
  for (const booking of activeBookings) {
    const lastEvent = await prisma.faceIdEvent.findFirst({
      where: { studentId: booking.studentId, eventTime: { gte: cutoff } },
      orderBy: { eventTime: 'desc' },
    });
    if (!lastEvent) {
      absent.push({
        student: booking.student,
        dormitory: booking.dormitory,
        bookingId: booking.id,
        lastSeen: null,
      });
    }
  }

  return success(res, absent, `${absent.length} ta talaba 24 soatdan ko'p vaqtdan beri ko'rinmagan`);
};

// Statistika
exports.getStats = async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [total, todayIn, todayOut, unrecognized] = await Promise.all([
    prisma.faceIdEvent.count(),
    prisma.faceIdEvent.count({ where: { eventType: 'CHECKIN', eventTime: { gte: today } } }),
    prisma.faceIdEvent.count({ where: { eventType: 'CHECKOUT', eventTime: { gte: today } } }),
    prisma.faceIdEvent.count({ where: { eventType: 'UNRECOGNIZED', eventTime: { gte: today } } }),
  ]);

  return success(res, { total, todayIn, todayOut, unrecognized });
};
