const XLSX = require('xlsx');
const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { error } = require('../utils/response');

function sendExcel(res, wb, filename) {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
}

// Talabalar ro'yxati
exports.studentsReport = async (req, res) => {
  const { housingType, faculty } = req.query;
  const where = {
    user: { deletedAt: null },
    ...(housingType && { housingType }),
    ...(faculty && { faculty: { contains: faculty, mode: 'insensitive' } }),
  };

  const students = await prisma.student.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true, middleName: true, email: true, phone: true } } },
    orderBy: { user: { lastName: 'asc' } },
  });

  const data = students.map((s, i) => ({
    '№': i + 1,
    'Familiya': s.user.lastName,
    'Ism': s.user.firstName,
    'Otasining ismi': s.user.middleName || '',
    'PINFL': s.pinfl,
    'Telefon': s.user.phone || '',
    'Email': s.user.email,
    'Fakultet': s.faculty,
    'Mutaxassislik': s.specialty,
    'Kurs': s.courseYear,
    "Ta'lim shakli": s.educationForm,
    "Ta'lim asosi": s.educationBasis,
    'Yashash holati': s.housingType === 'DORMITORY' ? 'Yotoqxona' : s.housingType === 'RENTAL' ? 'Ijara' : 'Uyidan qatnab',
    'Holat': s.status,
    "Ro'yxat sanasi": s.createdAt.toLocaleDateString('uz-UZ'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Talabalar');

  await logAudit(req.user.id, 'EXPORT', 'Student', null, { description: `Talabalar hisoboti yuklab olindi (${students.length} ta)` });
  sendExcel(res, wb, `talabalar_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// TTJ statistikasi
exports.dormitoriesReport = async (req, res) => {
  const dormitories = await prisma.dormitory.findMany({
    include: {
      _count: { select: { rooms: true, bookings: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  });

  const data = dormitories.map((d, i) => ({
    '№': i + 1,
    'Yotoqxona nomi': d.name,
    'Manzil': d.address,
    'Viloyat': d.region,
    'Jami xonalar': d.totalRooms,
    "Jami sig'im": d.totalCapacity,
    'Hozirgi band': d.currentOccupancy,
    "Bo'sh joylar": d.totalCapacity - d.currentOccupancy,
    'Bandlik %': `${((d.currentOccupancy / d.totalCapacity) * 100).toFixed(1)}%`,
    'Jinsi cheklovi': d.genderRestriction || 'Aralash',
    'Holat': d.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Yotoqxonalar');

  await logAudit(req.user.id, 'EXPORT', 'Dormitory', null, { description: 'Yotoqxonalar hisoboti yuklab olindi' });
  sendExcel(res, wb, `yotoqxonalar_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// Ijara hisoboti
exports.rentalsReport = async (req, res) => {
  const rentals = await prisma.rentalRegistration.findMany({
    include: { student: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } },
    orderBy: { registeredAt: 'desc' },
  });

  const data = rentals.map((r, i) => ({
    '№': i + 1,
    'Familiya': r.student.user.lastName,
    'Ism': r.student.user.firstName,
    'Telefon': r.student.user.phone || '',
    'Viloyat': r.region,
    'Tuman': r.district,
    'Manzil': r.address,
    'Uy egasi': r.ownerFullName,
    "Uy egasi telefoni": r.ownerPhone,
    'Shartnoma raqami': r.contractNumber || '',
    'Oylik ijara': r.monthlyRent || '',
    'Tasdiqlash holati': r.verificationStatus,
    "Ro'yxat sanasi": r.registeredAt.toLocaleDateString('uz-UZ'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ijara');

  await logAudit(req.user.id, 'EXPORT', 'Rental', null, { description: 'Ijara hisoboti yuklab olindi' });
  sendExcel(res, wb, `ijara_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// Yashil rejim qoidabuzarliklari
exports.violationsReport = async (req, res) => {
  const violations = await prisma.greenModeViolation.findMany({
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
      dormitory: { select: { name: true } },
    },
    orderBy: { violationTime: 'desc' },
  });

  const TYPE_LABELS = { LATE_ENTRY: 'Kech kirish', EARLY_EXIT: 'Erta chiqish', ABSENCE: 'Yo\'qlik' };

  const data = violations.map((v, i) => ({
    '№': i + 1,
    'Familiya': v.student.user.lastName,
    'Ism': v.student.user.firstName,
    'Yotoqxona': v.dormitory.name,
    'Qoidabuzarlik': TYPE_LABELS[v.violationType] || v.violationType,
    'Vaqt': v.violationTime.toLocaleString('uz-UZ'),
    'Holat': v.resolvedAt ? 'Hal qilingan' : 'Hal qilinmagan',
    'Izoh': v.note || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Qoidabuzarliklar');

  await logAudit(req.user.id, 'EXPORT', 'GreenModeViolation', null, { description: 'Qoidabuzarliklar hisoboti yuklab olindi' });
  sendExcel(res, wb, `qoidabuzarliklar_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// Amallar tarixi
exports.auditReport = async (req, res) => {
  const { from, to } = req.query;
  const where = {
    ...(from && { createdAt: { gte: new Date(from) } }),
    ...(to && { createdAt: { lte: new Date(to) } }),
  };

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const data = logs.map((l, i) => ({
    '№': i + 1,
    'Foydalanuvchi': l.user ? `${l.user.lastName} ${l.user.firstName}` : 'Tizim',
    'Rol': l.user?.role || '',
    'Amal': l.action,
    'Ob\'ekt': l.entity,
    'Tavsif': l.description || '',
    'IP manzil': l.ipAddress || '',
    'Sana': l.createdAt.toLocaleString('uz-UZ'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Amallar tarixi');

  sendExcel(res, wb, `audit_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// Face ID hisoboti
exports.faceIdReport = async (req, res) => {
  const { date } = req.query;
  const where = date ? { eventTime: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } } : {};

  const events = await prisma.faceIdEvent.findMany({
    where,
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
      dormitory: { select: { name: true } },
    },
    orderBy: { eventTime: 'desc' },
    take: 5000,
  });

  const data = events.map((e, i) => ({
    '№': i + 1,
    'Talaba': e.student ? `${e.student.user.lastName} ${e.student.user.firstName}` : 'Noma\'lum',
    'Yotoqxona': e.dormitory.name,
    'Hodisa': e.eventType === 'CHECKIN' ? 'Kirish' : e.eventType === 'CHECKOUT' ? 'Chiqish' : 'Aniqlanmadi',
    'Aniqlik': `${(e.confidence * 100).toFixed(0)}%`,
    'Kamera': e.cameraId || '',
    'Qo\'lda': e.isManual ? 'Ha' : 'Yo\'q',
    'Vaqt': e.eventTime.toLocaleString('uz-UZ'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Face ID');

  await logAudit(req.user.id, 'EXPORT', 'FaceIdEvent', null, { description: 'Face ID hisoboti yuklab olindi' });
  sendExcel(res, wb, `faceid_${new Date().toISOString().slice(0,10)}.xlsx`);
};
