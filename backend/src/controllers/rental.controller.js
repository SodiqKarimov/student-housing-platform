const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');
const { encrypt } = require('../utils/encryption');
const { notify } = require('../services/telegram.service');

// Ijara ro'yxatga olish
exports.createRental = async (req, res) => {
  const {
    studentId, region, district, address,
    latitude, longitude,
    ownerFullName, ownerPhone, ownerPinfl,
    contractNumber, contractDate, monthlyRent,
    mahallahName,
  } = req.body;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return error(res, 'Talaba topilmadi', 404);

  const existing = await prisma.rentalRegistration.findUnique({ where: { studentId } });
  if (existing) {
    return error(res, 'Talaba allaqachon ijara ro\'yxatida', 409);
  }

  const rental = await prisma.rentalRegistration.create({
    data: {
      studentId,
      region,
      district,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      ownerFullName,
      ownerPhone,
      ownerPinfl: ownerPinfl ? encrypt(ownerPinfl) : null,
      contractNumber,
      contractDate: contractDate ? new Date(contractDate) : null,
      monthlyRent: monthlyRent ? parseFloat(monthlyRent) : null,
      mahallahName,
      verificationStatus: 'ACTIVE',
    },
  });

  await prisma.student.update({
    where: { id: studentId },
    data: { housingType: 'RENTAL' },
  });

  await logAudit(req.user.id, 'CREATE', 'RentalRegistration', rental.id, {
    newValues: { studentId, region, district },
    description: 'Ijara ro\'yxatga olindi',
  });

  // Telegram bildirishnoma (xatolik chiqsa ham jarayon to'xtamasin)
  const studentData = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
  notify.newRental({
    studentName: studentData ? `${studentData.user.lastName} ${studentData.user.firstName}` : studentId,
    studentId: studentData?.studentIdNumber,
    region, district,
    hostName: ownerFullName,
    monthlyRent,
  }).catch(() => {});

  return success(res, rental, 'Ijara manzili ro\'yxatga olindi', 201);
};

// Ijara ro'yxati
exports.getAllRentals = async (req, res) => {
  const { page = 1, limit = 20, verificationStatus, region, district } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(verificationStatus && { verificationStatus }),
    ...(region && { region: { contains: region } }),
    ...(district && { district: { contains: district } }),
  };

  const [rentals, total] = await Promise.all([
    prisma.rentalRegistration.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
      skip, take: parseInt(limit),
      orderBy: { registeredAt: 'desc' },
    }),
    prisma.rentalRegistration.count({ where }),
  ]);

  return paginated(res, rentals, total, page, limit);
};

// Ijara ma'lumotini ko'rish
exports.getRentalById = async (req, res) => {
  const rental = await prisma.rentalRegistration.findUnique({
    where: { id: req.params.id },
    include: {
      student: { include: { user: true } },
      documents: true,
    },
  });

  if (!rental) return error(res, 'Ijara ro\'yxati topilmadi', 404);

  await logAudit(req.user.id, 'VIEW_PERSONAL_DATA', 'RentalRegistration', rental.id, {
    ipAddress: req.ip,
  });

  return success(res, rental);
};

// Ijara manzilini tasdiqlash (Admin/Dekanat)
exports.verifyRental = async (req, res) => {
  const { id } = req.params;
  const { action, note, mahallahConfirmed } = req.body;

  if (!['VERIFIED', 'REJECTED'].includes(action)) {
    return error(res, 'Noto\'g\'ri harakat', 400);
  }

  const rental = await prisma.rentalRegistration.findUnique({ where: { id } });
  if (!rental) return error(res, 'Topilmadi', 404);

  const updated = await prisma.rentalRegistration.update({
    where: { id },
    data: {
      verificationStatus: action,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      verificationNote: note,
      mahallahConfirmed: mahallahConfirmed || false,
      mahallahConfirmedAt: mahallahConfirmed ? new Date() : null,
    },
  });

  await logAudit(req.user.id, action === 'VERIFIED' ? 'APPROVE' : 'REJECT', 'RentalRegistration', id, {
    description: `Ijara manzili ${action === 'VERIFIED' ? 'tasdiqlandi' : 'rad etildi'}`,
  });

  // Telegram bildirishnoma
  const rentalFull = await prisma.rentalRegistration.findUnique({ where: { id }, include: { student: { include: { user: true } } } });
  const studentName = rentalFull ? `${rentalFull.student.user.lastName} ${rentalFull.student.user.firstName}` : '';
  const approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();

  if (action === 'VERIFIED') {
    notify.rentalApproved({ studentName, region: rental.region, district: rental.district, approvedBy: approverName }).catch(() => {});
  } else {
    notify.rentalRejected({ studentName, region: rental.region, district: rental.district, reason: note }).catch(() => {});
  }

  return success(res, updated, `Ijara manzili ${action === 'VERIFIED' ? 'tasdiqlandi' : 'rad etildi'}`);
};

// Ijara yangilash
exports.updateRental = async (req, res) => {
  const { id } = req.params;
  const { region, district, address, ownerFullName, ownerPhone, ownerPinfl, contractNumber, contractDate, monthlyRent, mahallahName } = req.body;

  const rental = await prisma.rentalRegistration.findUnique({ where: { id } });
  if (!rental) return error(res, 'Ijara topilmadi', 404);

  const updated = await prisma.rentalRegistration.update({
    where: { id },
    data: {
      region, district, address, ownerFullName, ownerPhone,
      ownerPinfl: ownerPinfl || null,
      contractNumber,
      contractDate: contractDate ? new Date(contractDate) : null,
      monthlyRent: monthlyRent ? parseFloat(monthlyRent) : null,
      mahallahName,
    },
  });

  return success(res, updated, 'Ijara yangilandi');
};

// Ijara statistikasi
exports.getRentalStats = async (req, res) => {
  const [total, byStatus, byRegion] = await Promise.all([
    prisma.rentalRegistration.count(),
    prisma.rentalRegistration.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
    prisma.rentalRegistration.groupBy({
      by: ['region'],
      _count: { _all: true },
      orderBy: { _count: { region: 'desc' } },
      take: 10,
    }),
  ]);

  return success(res, { total, byStatus, byRegion: byRegion.map(r => ({ region: r.region, count: r._count._all })) });
};
