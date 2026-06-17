const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

const prisma = new PrismaClient();

const generateArizaNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `IA-${year}-`;
  const last = await prisma.ichkiAriza.findFirst({
    where: { arizaNumber: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
  });
  let num = 1;
  if (last) {
    const lastNum = parseInt(last.arizaNumber.split('-')[2]) || 0;
    num = lastNum + 1;
  }
  return `${prefix}${String(num).padStart(6, '0')}`;
};

// POST /api/v1/ichki-ariza — Yangi ichki ariza (talabadan yoki xodimdan)
const createIchkiAriza = asyncHandler(async (req, res) => {
  const {
    studentId, studentName, dormitoryId, roomNumber,
    category, priority, title, description, isAnonymous,
  } = req.body;

  if (!title?.trim()) throw new ValidationError('Sarlavha kiritilishi shart');
  if (!description?.trim()) throw new ValidationError('Tavsif kiritilishi shart');
  if (!category) throw new ValidationError('Kategoriya tanlanishi shart');

  const validCategories = ['SHIKOYAT', 'TAKLIF', 'MUAMMO', 'BOSHQA'];
  if (!validCategories.includes(category)) throw new ValidationError('Noto\'g\'ri kategoriya');

  const arizaNumber = await generateArizaNumber();

  const ariza = await prisma.ichkiAriza.create({
    data: {
      arizaNumber,
      studentId: studentId || null,
      studentName: isAnonymous ? 'Anonim' : (studentName || req.user?.firstName || 'Noma\'lum'),
      dormitoryId: dormitoryId || null,
      roomNumber: roomNumber?.trim(),
      category,
      priority: priority || 'ODDIY',
      title: title.trim(),
      description: description.trim(),
      isAnonymous: !!isAnonymous,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Ariza muvaffaqiyatli yuborildi',
    data: { arizaNumber: ariza.arizaNumber, status: ariza.status },
  });
});

// GET /api/v1/ichki-ariza — Barcha ichki arizalar
const getAllIchkiArizalar = asyncHandler(async (req, res) => {
  const { status, category, priority, dormitoryId, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (dormitoryId) where.dormitoryId = dormitoryId;

  // Oddiy xodimlar faqat o'z yotoqxona arizalarini ko'radi
  if (req.user?.role === 'DORMITORY_STAFF' && req.user?.staffDormitoryId) {
    where.dormitoryId = req.user.staffDormitoryId;
  }

  const [total, arizalar] = await Promise.all([
    prisma.ichkiAriza.count({ where }),
    prisma.ichkiAriza.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        dormitory: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: parseInt(limit),
    }),
  ]);

  res.json({
    success: true,
    data: arizalar,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// GET /api/v1/ichki-ariza/stats
const getIchkiArizaStats = asyncHandler(async (req, res) => {
  const where = {};
  if (req.user?.role === 'DORMITORY_STAFF' && req.user?.staffDormitoryId) {
    where.dormitoryId = req.user.staffDormitoryId;
  }

  const [total, yangi, jarayonda, bajarildi, byCategory] = await Promise.all([
    prisma.ichkiAriza.count({ where }),
    prisma.ichkiAriza.count({ where: { ...where, status: 'YANGI' } }),
    prisma.ichkiAriza.count({ where: { ...where, status: 'JARAYONDA' } }),
    prisma.ichkiAriza.count({ where: { ...where, status: 'BAJARILDI' } }),
    prisma.ichkiAriza.groupBy({
      by: ['category'],
      where,
      _count: { id: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      total, yangi, jarayonda, bajarildi,
      yopildi: total - yangi - jarayonda - bajarildi,
      byCategory: Object.fromEntries(byCategory.map(b => [b.category, b._count.id])),
    },
  });
});

// GET /api/v1/ichki-ariza/:id
const getIchkiArizaById = asyncHandler(async (req, res) => {
  const ariza = await prisma.ichkiAriza.findUnique({
    where: { id: req.params.id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, phone: true } },
      dormitory: { select: { id: true, name: true } },
    },
  });
  if (!ariza) throw new NotFoundError('Ariza topilmadi');
  res.json({ success: true, data: ariza });
});

// PATCH /api/v1/ichki-ariza/:id/status
const updateIchkiArizaStatus = asyncHandler(async (req, res) => {
  const { status, assignedTo, resolvedNote } = req.body;

  const validStatuses = ['YANGI', 'JARAYONDA', 'BAJARILDI', 'YOPILDI'];
  if (!validStatuses.includes(status)) throw new ValidationError('Noto\'g\'ri status');

  const ariza = await prisma.ichkiAriza.update({
    where: { id: req.params.id },
    data: {
      status,
      assignedTo: assignedTo || req.user.id,
      resolvedNote: resolvedNote?.trim(),
      resolvedAt: status === 'BAJARILDI' ? new Date() : undefined,
    },
  });

  logger.info('Ichki ariza yangilandi', { arizaNumber: ariza.arizaNumber, status });
  res.json({ success: true, data: ariza });
});

module.exports = {
  createIchkiAriza,
  getAllIchkiArizalar,
  getIchkiArizaStats,
  getIchkiArizaById,
  updateIchkiArizaStatus,
};
