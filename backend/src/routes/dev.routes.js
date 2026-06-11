// FAQAT DEVELOPMENT REJIMI UCHUN
// Production'da bu route avtomatik o'chiriladi

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const oneIdMock = require('../services/mock/oneid.mock');
const hemisMock = require('../services/mock/hemis.mock');
const { success, error } = require('../utils/response');

const SUPER_ADMIN_DEFAULT_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin@TTJ2024';

// Mock foydalanuvchilar ro'yxatini ko'rsatuvchi HTML sahifa
router.get('/mock-login', (req, res) => {
  const users = oneIdMock.getMockUsers();
  const html = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Login - Talabalar Turar Joyi</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 16px; padding: 40px; width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
    .badge { background: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 20px; }
    h2 { color: #1a3a6b; font-size: 22px; margin-bottom: 8px; }
    p { color: #666; font-size: 14px; margin-bottom: 24px; }
    .user-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; margin-bottom: 10px; border: 2px solid #e8edf4; border-radius: 10px; background: #fff; cursor: pointer; text-align: left; transition: all 0.2s; }
    .user-btn:hover { border-color: #1a3a6b; background: #f0f4ff; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #1a3a6b; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .user-info { flex: 1; }
    .user-name { font-weight: 600; color: #1a3a6b; font-size: 15px; }
    .user-role { font-size: 12px; color: #888; margin-top: 2px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .note { font-size: 11px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🧪 Test Rejimi</div>
    <h2>Foydalanuvchi tanlang</h2>
    <p>Bu sahifa faqat ishlab chiqish rejimida ko'rinadi. OneID o'rniga test foydalanuvchisi tanlang:</p>
    ${users.map(u => `
      <button class="user-btn" onclick="login('${u.sub}')">
        <div class="avatar">${u.name[0]}</div>
        <div class="user-info">
          <div class="user-name">${u.name}</div>
          <div class="user-role">${getRoleLabel(u.role)}</div>
        </div>
      </button>
    `).join('')}
    <hr class="divider">
    <p class="note">Production'da bu sahifa OneID ga yo'naltiradi</p>
  </div>
  <script>
    function getRoleLabel(role) {
      const labels = { SUPER_ADMIN: 'Super Administrator', ADMIN: 'Yotoqxona boshlig\'i', DEAN_OFFICE: 'Dekanat xodimi', STUDENT: 'Talaba' };
      return labels[role] || role;
    }
    async function login(sub) {
      const res = await fetch('/api/v1/dev/mock-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        window.location.href = '/dashboard';
      } else {
        alert('Xato: ' + data.message);
      }
    }
  </script>
</body>
</html>`;
  res.send(html);
});

function getRoleLabel(role) {
  const labels = { SUPER_ADMIN: 'Super Administrator', ADMIN: 'Yotoqxona boshlig\'i', DEAN_OFFICE: 'Dekanat xodimi', DORMITORY_STAFF: 'Yotoqxona xodimi', TUTOR: 'Tyutor', STUDENT: 'Talaba' };
  return labels[role] || role;
}

// Mock autentifikatsiya — foydalanuvchini yaratadi/topadi
router.post('/mock-auth', async (req, res) => {
  const { sub } = req.body;
  if (!sub) return error(res, 'Sub talab qilinadi', 400);

  const mockUser = await oneIdMock.getUserBySub(sub);
  if (!mockUser) return error(res, 'Mock foydalanuvchi topilmadi', 404);

  const hemisStudent = await hemisMock.getStudentByPinfl(mockUser.pinfl);

  let user = await prisma.user.findFirst({
    where: { OR: [{ oneIdSub: sub }, { pinfl: mockUser.pinfl }], deletedAt: null },
  });

  if (!user) {
    const userData = {
      oneIdSub: sub,
      pinfl: mockUser.pinfl,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      middleName: mockUser.middleName,
      email: mockUser.email,
      phone: mockUser.phone,
      role: mockUser.role,
      status: 'ACTIVE',
    };

    if (hemisStudent && mockUser.role === 'STUDENT') {
      user = await prisma.user.create({
        data: {
          ...userData,
          hemisStudentId: hemisStudent.hemisId,
          student: {
            create: {
              hemisId: hemisStudent.hemisId,
              studentIdNumber: hemisStudent.studentIdNumber,
              dateOfBirth: new Date(hemisStudent.dateOfBirth),
              gender: hemisStudent.gender,
              pinfl: mockUser.pinfl,
              faculty: hemisStudent.faculty,
              department: hemisStudent.department,
              specialty: hemisStudent.specialty,
              courseYear: hemisStudent.courseYear,
              educationForm: hemisStudent.educationForm,
              educationBasis: hemisStudent.educationBasis,
              housingType: 'COMMUTER',
              homeRegion: hemisStudent.homeRegion,
              homeDistrict: hemisStudent.homeDistrict,
              homeAddress: hemisStudent.homeAddress,
              isOrphan: hemisStudent.isOrphan || false,
            },
          },
        },
      });
    } else {
      const passwordHash = await bcrypt.hash(SUPER_ADMIN_DEFAULT_PASSWORD, 10);
      user = await prisma.user.create({ data: { ...userData, passwordHash } });
    }
  } else if (!user.passwordHash) {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_DEFAULT_PASSWORD, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  }

  const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  await prisma.userSession.create({
    data: {
      userId: user.id, refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return success(res, {
    accessToken, refreshToken,
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
  }, 'Test kirish muvaffaqiyatli');
});

module.exports = router;
