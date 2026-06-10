const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');

// Tavsiyanomalar ro'yxati
exports.getAll = async (req, res) => {
  const { studentId, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { ...(studentId && { studentId }) };

  const [recs, total] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.recommendation.count({ where }),
  ]);

  const withAuthor = await Promise.all(recs.map(async r => {
    const author = await prisma.user.findUnique({
      where: { id: r.authorId },
      select: { firstName: true, lastName: true, role: true },
    });
    return { ...r, author };
  }));

  return paginated(res, withAuthor, total, page, limit);
};

// Bitta talaba uchun tavsiyanomalar
exports.getByStudent = async (req, res) => {
  const { studentId } = req.params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!student) return error(res, 'Talaba topilmadi', 404);

  const recs = await prisma.recommendation.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });

  const withAuthor = await Promise.all(recs.map(async r => {
    const author = await prisma.user.findUnique({
      where: { id: r.authorId },
      select: { firstName: true, lastName: true, role: true },
    });
    return { ...r, author };
  }));

  return success(res, { student, recommendations: withAuthor });
};

// Tavsiyanoma yaratish
exports.create = async (req, res) => {
  const { studentId, behavior, activity, discipline, comment, rating } = req.body;

  if (!studentId || !behavior || !activity || !discipline) {
    return error(res, 'Barcha asosiy maydonlar to\'ldirilishi shart', 400);
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return error(res, 'Talaba topilmadi', 404);

  const rec = await prisma.recommendation.create({
    data: {
      studentId,
      authorId: req.user.id,
      behavior,
      activity,
      discipline,
      comment,
      rating: parseInt(rating) || 3,
    },
  });

  await logAudit(req.user.id, 'CREATE', 'Recommendation', rec.id, {
    newValues: { studentId, rating },
    description: 'Tavsiyanoma yozildi',
  });

  return success(res, rec, 'Tavsiyanoma saqlandi', 201);
};

// Tavsiyanomani yangilash
exports.update = async (req, res) => {
  const { id } = req.params;
  const { behavior, activity, discipline, comment, rating } = req.body;

  const rec = await prisma.recommendation.findUnique({ where: { id } });
  if (!rec) return error(res, 'Topilmadi', 404);
  if (rec.authorId !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
    return error(res, 'Ruxsat yo\'q', 403);
  }

  const updated = await prisma.recommendation.update({
    where: { id },
    data: { behavior, activity, discipline, comment, rating: parseInt(rating) || rec.rating },
  });

  return success(res, updated, 'Tavsiyanoma yangilandi');
};

// O'chirish
exports.remove = async (req, res) => {
  const { id } = req.params;
  const rec = await prisma.recommendation.findUnique({ where: { id } });
  if (!rec) return error(res, 'Topilmadi', 404);
  if (rec.authorId !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
    return error(res, 'Ruxsat yo\'q', 403);
  }

  await prisma.recommendation.delete({ where: { id } });
  return success(res, null, 'Tavsiyanoma o\'chirildi');
};
