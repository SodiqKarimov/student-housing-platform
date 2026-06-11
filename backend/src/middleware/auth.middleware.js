const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { error } = require('../utils/response');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Autentifikatsiya talab etiladi', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        staffDormitoryId: true,
      },
    });

    if (!user) {
      return error(res, 'Foydalanuvchi topilmadi', 401);
    }

    if (user.status === 'BLOCKED') {
      return error(res, 'Hisobingiz bloklangan. Administrator bilan bog\'laning', 403);
    }

    if (user.status === 'INACTIVE') {
      return error(res, 'Hisobingiz faol emas', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Sessiya muddati tugagan. Qayta kiring', 401);
    }
    return error(res, 'Noto\'g\'ri token', 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, 'Bu amalni bajarish uchun ruxsatingiz yo\'q', 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
