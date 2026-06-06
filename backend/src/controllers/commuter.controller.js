const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');

// Qatnab o'qishni ro'yxatga olish
exports.createCommuter = async (req, res) => {
  const {
    studentId, region, district, address,
    distanceKm, travelTimeMin, transportType,
  } = req.body;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return error(res, 'Talaba topilmadi', 404);

  const existing = await prisma.commuterRegistration.findUnique({ where: { studentId } });
  if (existing) return error(res, 'Talaba allaqachon qatnab o\'qish ro\'yxatida', 409);

  // 70 km dan ko'p bo\'lsa imtiyozga haqli
  const isEligible = parseFloat(distanceKm) >= 70;

  const commuter = await prisma.commuterRegistration.create({
    data: {
      studentId, region, district, address,
      distanceKm: parseFloat(distanceKm),
      travelTimeMin: parseInt(travelTimeMin),
      transportType,
      isEligibleForBenefit: isEligible,
    },
  });

  await prisma.student.update({
    where: { id: studentId },
    data: { housingType: 'COMMUTER' },
  });

  await logAudit(req.user.id, 'CREATE', 'CommuterRegistration', commuter.id, {
    newValues: { studentId, region, district, distanceKm },
    description: 'Qatnab o\'qish ro\'yxatga olindi',
  });

  return success(res, commuter, 'Qatnab o\'qish manzili ro\'yxatga olindi', 201);
};

// Qatnab o'quvchilar ro'yxati
exports.getAllCommuters = async (req, res) => {
  const { page = 1, limit = 20, region, eligible } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(region && { region: { contains: region, mode: 'insensitive' } }),
    ...(eligible !== undefined && { isEligibleForBenefit: eligible === 'true' }),
  };

  const [commuters, total] = await Promise.all([
    prisma.commuterRegistration.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
      skip, take: parseInt(limit),
      orderBy: { confirmedAt: 'desc' },
    }),
    prisma.commuterRegistration.count({ where }),
  ]);

  return paginated(res, commuters, total, page, limit);
};

// Qatnab o'qish statistikasi
exports.getCommuterStats = async (req, res) => {
  const [total, byRegion, eligible, avgDistance] = await Promise.all([
    prisma.commuterRegistration.count(),
    prisma.commuterRegistration.groupBy({
      by: ['region'],
      _count: { _all: true },
      orderBy: { _count: { region: 'desc' } },
      take: 10,
    }),
    prisma.commuterRegistration.count({ where: { isEligibleForBenefit: true } }),
    prisma.commuterRegistration.aggregate({ _avg: { distanceKm: true } }),
  ]);

  return success(res, {
    total,
    eligible,
    averageDistanceKm: avgDistance._avg.distanceKm,
    byRegion: byRegion.map(r => ({ region: r.region, count: r._count._all })),
  });
};
