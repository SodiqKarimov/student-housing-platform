const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: "Yotoqxona boshlig'i",
  DEAN_OFFICE: 'Dekanat xodimi',
  DORMITORY_STAFF: 'Yotoqxona xodimi',
  STUDENT: 'Talaba',
};

// Barcha foydalanuvchilar (SUPER_ADMIN uchun)
exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search, role, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ],
    }),
    ...(role && { role }),
    ...(status && { status }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, middleName: true,
        email: true, phone: true, role: true, status: true,
        createdAt: true, lastLoginAt: true,
      },
      skip,
      take: parseInt(limit),
      orderBy: { lastName: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(res, users, total, page, limit);
};

// Yangi xodim/admin yaratish (SUPER_ADMIN uchun)
exports.createUser = async (req, res) => {
  const { firstName, lastName, middleName, email, phone, role, pinfl, dormitoryId } = req.body;

  if (!firstName || !lastName || !email || !role) {
    return error(res, "Ism, familiya, email va rol majburiy", 400);
  }

  const allowedRoles = ['ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF'];
  if (!allowedRoles.includes(role)) {
    return error(res, "Noto'g'ri rol. ADMIN, DEAN_OFFICE yoki DORMITORY_STAFF bo'lishi kerak", 400);
  }

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) return error(res, 'Bu email allaqachon mavjud', 409);

  const tempPassword = `Ttj_${uuidv4().slice(0, 8)}`;
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      firstName, lastName, middleName,
      email, phone, role,
      pinfl: pinfl || null,
      status: 'ACTIVE',
      passwordHash,
    },
    select: {
      id: true, firstName: true, lastName: true,
      email: true, phone: true, role: true, status: true, createdAt: true,
    },
  });

  if (role === 'ADMIN' && dormitoryId) {
    await prisma.dormitory.update({
      where: { id: dormitoryId },
      data: { managerId: user.id },
    });
  }

  await logAudit(req.user.id, 'CREATE', 'User', user.id, {
    newValues: { email, role },
    description: `Yangi ${ROLE_LABELS[role]} yaratildi`,
  });

  return success(res, { ...user, tempPassword }, `${ROLE_LABELS[role]} muvaffaqiyatli yaratildi`, 201);
};

// Foydalanuvchi ma'lumotlarini yangilash
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, middleName, phone, role } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);

  if (user.role === 'SUPER_ADMIN') {
    return error(res, "Super admin ma'lumotlarini o'zgartirib bo'lmaydi", 403);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { firstName, lastName, middleName, phone, role },
    select: {
      id: true, firstName: true, lastName: true,
      email: true, phone: true, role: true, status: true,
    },
  });

  await logAudit(req.user.id, 'UPDATE', 'User', id, {
    description: "Foydalanuvchi ma'lumotlari yangilandi",
  });

  return success(res, updated, "Ma'lumotlar yangilandi");
};

// Parolni tiklash (Super Admin uchun)
exports.resetPassword = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);
  if (user.role === 'SUPER_ADMIN') return error(res, "Super admin parolini bu usulda tiklash mumkin emas", 403);

  const newPassword = `Ttj_${uuidv4().slice(0, 8)}`;
  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({ where: { id }, data: { passwordHash } });
  await prisma.userSession.deleteMany({ where: { userId: id } });

  await logAudit(req.user.id, 'UPDATE', 'User', id, {
    description: `Foydalanuvchi paroli tiklandi: ${user.email}`,
  });

  return success(res, { tempPassword: newPassword, email: user.email }, 'Parol muvaffaqiyatli tiklandi');
};

// Foydalanuvchi statusini o'zgartirish (faollashtirish/bloklash)
exports.toggleStatus = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);
  if (user.role === 'SUPER_ADMIN') return error(res, "Super adminni bloklash mumkin emas", 403);

  const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  await prisma.user.update({ where: { id }, data: { status: newStatus } });

  await logAudit(req.user.id, 'UPDATE', 'User', id, {
    oldValues: { status: user.status },
    newValues: { status: newStatus },
    description: `Foydalanuvchi ${newStatus === 'ACTIVE' ? 'faollashtirildi' : 'bloklandi'}`,
  });

  return success(res, { status: newStatus }, `Foydalanuvchi ${newStatus === 'ACTIVE' ? 'faollashtirildi' : 'bloklandi'}`);
};
