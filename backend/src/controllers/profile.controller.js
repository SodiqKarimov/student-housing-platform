const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error } = require('../utils/response');

exports.getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, firstName: true, lastName: true, middleName: true,
      email: true, phone: true, role: true, status: true,
      photoUrl: true, lastLoginAt: true, createdAt: true,
      student: {
        select: {
          faculty: true, specialty: true, courseYear: true,
          studentIdNumber: true, housingType: true,
        },
      },
    },
  });
  return success(res, user);
};

exports.updateProfile = async (req, res) => {
  const { firstName, lastName, middleName, phone } = req.body;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(middleName !== undefined && { middleName }),
      ...(phone !== undefined && { phone }),
    },
    select: { id: true, firstName: true, lastName: true, middleName: true, phone: true, email: true, role: true },
  });

  await logAudit(req.user.id, 'UPDATE', 'User', req.user.id, { description: 'Profil yangilandi' });
  return success(res, updated, 'Profil yangilandi');
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return error(res, 'Joriy va yangi parol talab etiladi', 400);
  }
  if (newPassword.length < 8) {
    return error(res, 'Yangi parol kamida 8 belgidan iborat bo\'lishi kerak', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.passwordHash) return error(res, 'Parol o\'rnatilmagan (OneID orqali kirgan bo\'lishingiz mumkin)', 400);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return error(res, 'Joriy parol noto\'g\'ri', 400);

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: newHash } });
  await prisma.userSession.deleteMany({ where: { userId: req.user.id } });

  await logAudit(req.user.id, 'UPDATE', 'User', req.user.id, { description: 'Parol o\'zgartirildi, barcha sessiyalar o\'chirildi' });
  return success(res, null, 'Parol muvaffaqiyatli o\'zgartirildi. Qayta kiring.');
};
