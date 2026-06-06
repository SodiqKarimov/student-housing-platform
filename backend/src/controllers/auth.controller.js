const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const oneIdService = require('../services/oneid.service');
const hemisService = require('../services/hemis.service');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error } = require('../utils/response');
const logger = require('../config/logger');

function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

// OneID orqali kirish URL'ini qaytarish
exports.getOneIdUrl = (req, res) => {
  const state = uuidv4();
  // State ni session yoki Redis'da saqlash kerak
  const url = oneIdService.getAuthorizationUrl(state);
  return success(res, { url, state }, 'OneID URL tayyor');
};

// OneID callback - foydalanuvchi OneID'dan qaytganda
exports.oneIdCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return error(res, 'OneID kodi topilmadi', 400);
  }

  try {
    // 1. Access token olish
    const tokenData = await oneIdService.getAccessToken(code);

    // 2. Foydalanuvchi ma'lumotlarini olish
    const oneIdUser = await oneIdService.getUserInfo(tokenData.access_token);

    // 3. HEMIS'dan talaba ma'lumotlarini olish
    const hemisStudent = await hemisService.getStudentByPinfl(oneIdUser.pinfl);

    // 4. Foydalanuvchini topish yoki yaratish
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { oneIdSub: oneIdUser.sub },
          { pinfl: oneIdUser.pinfl },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          oneIdSub: oneIdUser.sub,
          pinfl: oneIdUser.pinfl,
          firstName: oneIdUser.firstName,
          lastName: oneIdUser.lastName,
          middleName: oneIdUser.middleName,
          email: oneIdUser.email || `${oneIdUser.pinfl}@temp.uz`,
          phone: oneIdUser.phone,
          role: hemisStudent ? 'STUDENT' : 'STUDENT',
          status: 'ACTIVE',
          hemisStudentId: hemisStudent?.hemisId,
          student: hemisStudent ? {
            create: {
              hemisId: hemisStudent.hemisId,
              studentIdNumber: hemisStudent.studentIdNumber || uuidv4().slice(0, 12),
              dateOfBirth: new Date(oneIdUser.dateOfBirth || hemisStudent.dateOfBirth),
              gender: oneIdUser.gender || hemisStudent.gender || 'MALE',
              pinfl: oneIdUser.pinfl,
              faculty: hemisStudent.faculty || 'Noma\'lum',
              department: hemisStudent.department || 'Noma\'lum',
              specialty: hemisStudent.specialty || 'Noma\'lum',
              courseYear: hemisStudent.courseYear || 1,
              educationForm: hemisStudent.educationForm || 'Kunduzgi',
              educationBasis: hemisStudent.educationBasis || 'Grant',
              housingType: 'COMMUTER',
              homeRegion: oneIdUser.address?.region || hemisStudent.homeRegion || 'Noma\'lum',
              homeDistrict: oneIdUser.address?.district || hemisStudent.homeDistrict || 'Noma\'lum',
              homeAddress: oneIdUser.address?.fullAddress || hemisStudent.homeAddress || 'Noma\'lum',
            },
          } : undefined,
        },
      });
    } else {
      // Mavjud foydalanuvchini yangilash
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: req.ip,
        },
      });
    }

    // 5. Tokenlar yaratish
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // 6. Refresh token'ni saqlash
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 7. Audit log
    await logAudit(user.id, 'LOGIN', 'User', user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'OneID orqali kirish',
    });

    return success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    }, 'Muvaffaqiyatli kirildi');

  } catch (err) {
    logger.error('OneID login xato', { error: err.message });
    return error(res, 'Kirish jarayonida xato yuz berdi', 500);
  }
};

// Token yangilash
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return error(res, 'Refresh token topilmadi', 400);

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return error(res, 'Sessiya tugagan', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      session.user.id,
      session.user.role
    );

    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return success(res, { accessToken, refreshToken: newRefreshToken }, 'Token yangilandi');
  } catch {
    return error(res, 'Noto\'g\'ri refresh token', 401);
  }
};

// Chiqish
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await prisma.userSession.deleteMany({ where: { refreshToken } }).catch(() => {});
  }

  await logAudit(req.user.id, 'LOGOUT', 'User', req.user.id, {
    ipAddress: req.ip,
    description: 'Tizimdan chiqish',
  });

  return success(res, null, 'Muvaffaqiyatli chiqildi');
};

// Joriy foydalanuvchi ma'lumotlari
exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      student: {
        include: {
          dormitoryBookings: {
            where: { status: 'ACTIVE' },
            include: { dormitory: true, room: true },
            take: 1,
          },
          rentalRegistration: true,
          commuterRegistration: true,
        },
      },
    },
  });

  return success(res, user, 'Foydalanuvchi ma\'lumotlari');
};
