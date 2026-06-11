const { prisma } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const hemisService = require('../services/hemis.service');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');
const { encrypt, decrypt } = require('../utils/encryption');

// Barcha talabalar ro'yxati (Admin uchun)
exports.getAllStudents = async (req, res) => {
  const {
    page = 1, limit = 20, search, housingType,
    faculty, courseYear, status,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    user: { deletedAt: null },
    ...(search && {
      OR: [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { studentIdNumber: { contains: search } },
        { pinfl: { contains: search } },
      ],
    }),
    ...(housingType && { housingType }),
    ...(faculty && { faculty: { contains: faculty } }),
    ...(courseYear && { courseYear: parseInt(courseYear) }),
    ...(status && { status }),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, middleName: true, email: true, phone: true, status: true } },
        dormitoryBookings: { where: { status: 'ACTIVE' }, include: { dormitory: true, room: true }, take: 1 },
        rentalRegistration: { select: { id: true, region: true, district: true, verificationStatus: true } },
        commuterRegistration: { select: { id: true, region: true, district: true } },
      },
      skip,
      take: parseInt(limit),
      orderBy: { user: { lastName: 'asc' } },
    }),
    prisma.student.count({ where }),
  ]);

  await logAudit(req.user.id, 'VIEW_PERSONAL_DATA', 'Student', null, {
    ipAddress: req.ip,
    description: `Talabalar ro'yxati ko'rildi (${total} ta)`,
  });

  return paginated(res, students, total, page, limit);
};

// Bitta talaba ma'lumotlari
exports.getStudentById = async (req, res) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      dormitoryBookings: {
        include: { dormitory: true, room: true },
        orderBy: { createdAt: 'desc' },
      },
      rentalRegistration: true,
      commuterRegistration: true,
      documents: { where: { isVerified: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!student) return error(res, 'Talaba topilmadi', 404);

  // Faqat o'z ma'lumotlarini ko'ra oladi yoki admin
  if (req.user.role === 'STUDENT' && student.userId !== req.user.id) {
    return error(res, 'Ruxsat yo\'q', 403);
  }

  await logAudit(req.user.id, 'VIEW_PERSONAL_DATA', 'Student', id, {
    ipAddress: req.ip,
    description: 'Talaba profili ko\'rildi',
  });

  return success(res, student);
};

// HEMIS'dan talaba ma'lumotlarini yangilash
exports.syncFromHemis = async (req, res) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return error(res, 'Talaba topilmadi', 404);
  if (!student.hemisId) return error(res, 'HEMIS ID mavjud emas', 400);

  const hemisData = await hemisService.syncStudentData(student.hemisId);
  if (!hemisData) return error(res, 'HEMIS\'dan ma\'lumot olishda xato', 502);

  const updated = await prisma.student.update({
    where: { id },
    data: {
      faculty: hemisData.faculty || student.faculty,
      department: hemisData.department || student.department,
      specialty: hemisData.specialty || student.specialty,
      courseYear: hemisData.courseYear || student.courseYear,
      educationForm: hemisData.educationForm || student.educationForm,
      educationBasis: hemisData.educationBasis || student.educationBasis,
      status: hemisData.status || student.status,
    },
  });

  await logAudit(req.user.id, 'UPDATE', 'Student', id, {
    description: 'HEMIS\'dan sinxronizatsiya qilindi',
  });

  return success(res, updated, 'HEMIS ma\'lumotlari yangilandi');
};

// Yashash holati statistikasi
exports.getHousingStats = async (req, res) => {
  const [total, byHousingType, byFaculty, byCourse] = await Promise.all([
    prisma.student.count({ where: { user: { deletedAt: null } } }),
    prisma.student.groupBy({
      by: ['housingType'],
      _count: { _all: true },
    }),
    prisma.student.groupBy({
      by: ['faculty', 'housingType'],
      _count: { _all: true },
      orderBy: { faculty: 'asc' },
    }),
    prisma.student.groupBy({
      by: ['courseYear', 'housingType'],
      _count: { _all: true },
      orderBy: { courseYear: 'asc' },
    }),
  ]);

  return success(res, {
    total,
    byHousingType: byHousingType.map(h => ({
      type: h.housingType,
      count: h._count._all,
      percentage: ((h._count._all / total) * 100).toFixed(1),
    })),
    byFaculty,
    byCourse,
  }, 'Yashash statistikasi');
};

// Yangi talaba qo'shish (Admin)
exports.createStudent = async (req, res) => {
  const {
    firstName, lastName, middleName, phone,
    pinfl, dateOfBirth, gender, nationality,
    faculty, department, specialty, courseYear,
    educationForm, educationBasis, housingType,
    homeRegion, homeDistrict, homeAddress,
    studentIdNumber, isOrphan, isDisabled, isMartialArt, isFromRural,
    parentPhone, direction,
  } = req.body;

  if (!firstName || !lastName || !pinfl || !faculty || !dateOfBirth) {
    return error(res, 'Ism, familiya, PINFL, fakultet va tug\'ilgan sana majburiy', 400);
  }

  const existingUser = await prisma.user.findFirst({ where: { pinfl } });
  if (existingUser) return error(res, 'Bu PINFL allaqachon tizimda mavjud', 409);

  const emailToUse = `${pinfl}@student.uz`;
  const existingEmail = await prisma.user.findFirst({ where: { email: emailToUse } });
  if (existingEmail) return error(res, 'Bu PINFL bilan email allaqachon mavjud', 409);

  const photoUrl = req.file ? `/uploads/students/${req.file.filename}` : null;

  const student = await prisma.user.create({
    data: {
      firstName, lastName, middleName,
      email: emailToUse,
      phone,
      role: 'STUDENT',
      status: 'ACTIVE',
      pinfl,
      student: {
        create: {
          studentIdNumber: studentIdNumber || uuidv4().slice(0, 12).toUpperCase(),
          dateOfBirth: new Date(dateOfBirth),
          gender: gender || 'MALE',
          pinfl,
          nationality: nationality || "O'zbekiston",
          faculty,
          department: department || faculty,
          specialty: specialty || faculty,
          courseYear: parseInt(courseYear) || 1,
          educationForm: educationForm || 'Kunduzgi',
          educationBasis: educationBasis || 'Grant',
          housingType: housingType || 'COMMUTER',
          homeRegion: homeRegion || "Noma'lum",
          homeDistrict: homeDistrict || "Noma'lum",
          homeAddress: homeAddress || "Noma'lum",
          isOrphan: !!isOrphan,
          isDisabled: !!isDisabled,
          isMartialArt: !!isMartialArt,
          isFromRural: !!isFromRural,
          parentPhone: parentPhone || null,
          direction: direction || null,
          photoUrl,
        },
      },
    },
    include: { student: true },
  });

  await logAudit(req.user.id, 'CREATE', 'Student', student.student.id, {
    newValues: { firstName, lastName, pinfl },
    description: "Yangi talaba qo'shildi",
  });

  return success(res, student, "Talaba muvaffaqiyatli qo'shildi", 201);
};

// Talaba ma'lumotlarini yangilash
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, middleName, phone, faculty, department, specialty, courseYear, educationForm, educationBasis, homeRegion, homeDistrict, homeAddress } = req.body;

  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) return error(res, 'Talaba topilmadi', 404);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: student.userId },
      data: { firstName, lastName, middleName, phone },
    }),
    prisma.student.update({
      where: { id },
      data: { faculty, department, specialty, courseYear: courseYear ? parseInt(courseYear) : undefined, educationForm, educationBasis, homeRegion, homeDistrict, homeAddress },
    }),
  ]);

  await logAudit(req.user.id, 'UPDATE', 'Student', id, {
    description: "Talaba ma'lumotlari yangilandi",
  });

  const updated = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  return success(res, updated, "Ma'lumotlar yangilandi");
};

// Talaba yashash holati o'zgartirish (Admin)
exports.updateHousingType = async (req, res) => {
  const { id } = req.params;
  const { housingType, reason } = req.body;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return error(res, 'Talaba topilmadi', 404);

  const updated = await prisma.student.update({
    where: { id },
    data: { housingType },
  });

  // HEMIS'ga ham yuborish
  if (student.hemisId) {
    await hemisService.updateHousingStatus(student.hemisId, housingType);
  }

  await logAudit(req.user.id, 'UPDATE', 'Student', id, {
    oldValues: { housingType: student.housingType },
    newValues: { housingType },
    description: reason || 'Yashash holati o\'zgartirildi',
  });

  return success(res, updated, 'Yashash holati yangilandi');
};
