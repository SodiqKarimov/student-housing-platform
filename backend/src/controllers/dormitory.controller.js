const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');

// Yotoqxonalar ro'yxati
exports.getAllDormitories = async (req, res) => {
  const { page = 1, limit = 10, region, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(region && { region: { contains: region, mode: 'insensitive' } }),
    ...(status && { status }),
    ...(req.user.role === 'ADMIN' && { managerId: req.user.id }),
  };

  const [dormitories, total] = await Promise.all([
    prisma.dormitory.findMany({
      where,
      include: {
        _count: { select: { rooms: true, bookings: { where: { status: 'ACTIVE' } } } },
      },
      skip, take: parseInt(limit),
      orderBy: { name: 'asc' },
    }),
    prisma.dormitory.count({ where }),
  ]);

  return paginated(res, dormitories, total, page, limit);
};

// Bitta yotoqxona
exports.getDormitoryById = async (req, res) => {
  const dormitory = await prisma.dormitory.findUnique({
    where: { id: req.params.id },
    include: {
      rooms: {
        include: {
          _count: { select: { bookings: { where: { status: 'ACTIVE' } } } },
        },
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      },
    },
  });

  if (!dormitory) return error(res, 'Yotoqxona topilmadi', 404);
  return success(res, dormitory);
};

// Yotoqxona yaratish (Super Admin)
exports.createDormitory = async (req, res) => {
  const { name, address, region, totalRooms, totalCapacity, genderRestriction, amenities, phoneNumber, email, managerId } = req.body;

  const dormitory = await prisma.dormitory.create({
    data: { name, address, region, totalRooms, totalCapacity, genderRestriction, amenities: JSON.stringify(amenities || []), phoneNumber, email, managerId: managerId || null },
  });

  await logAudit(req.user.id, 'CREATE', 'Dormitory', dormitory.id, {
    newValues: { name, address },
    description: 'Yangi yotoqxona yaratildi',
  });

  return success(res, dormitory, 'Yotoqxona yaratildi', 201);
};

// Xona yaratish
exports.createRoom = async (req, res) => {
  const { dormitoryId } = req.params;
  const { roomNumber, floor, type, capacity, pricePerMonth, amenities } = req.body;

  const dormitory = await prisma.dormitory.findUnique({ where: { id: dormitoryId } });
  if (!dormitory) return error(res, 'Yotoqxona topilmadi', 404);

  const existing = await prisma.room.findUnique({ where: { dormitoryId_roomNumber: { dormitoryId, roomNumber } } });
  if (existing) return error(res, 'Bu xona raqami allaqachon mavjud', 409);

  const room = await prisma.room.create({
    data: { dormitoryId, roomNumber, floor, type, capacity, pricePerMonth, amenities: JSON.stringify(amenities || []) },
  });

  return success(res, room, 'Xona yaratildi', 201);
};

// Xonalar ro'yxati
exports.getRooms = async (req, res) => {
  const { dormitoryId } = req.params;
  const { type, status, floor } = req.query;

  const rooms = await prisma.room.findMany({
    where: {
      dormitoryId,
      ...(type && { type }),
      ...(status && { status }),
      ...(floor && { floor: parseInt(floor) }),
    },
    include: {
      bookings: {
        where: { status: 'ACTIVE' },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });

  return success(res, rooms);
};

// Joy bron qilish
exports.createBooking = async (req, res) => {
  const { studentId, dormitoryId, roomId, checkInDate, semester, academicYear, notes } = req.body;

  // Talabaning mavjud bron qilishini tekshirish
  const existingBooking = await prisma.dormitoryBooking.findFirst({
    where: { studentId, status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] } },
  });

  if (existingBooking) {
    return error(res, 'Talabaning faol yoki ko\'rib chiqilayotgan arizasi mavjud', 409);
  }

  // Xonada joy borligini tekshirish
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return error(res, 'Xona topilmadi', 404);
  if (room.currentCount >= room.capacity) return error(res, 'Xonada bo\'sh joy yo\'q', 409);
  if (room.status !== 'AVAILABLE') return error(res, 'Xona mavjud emas', 409);

  const booking = await prisma.dormitoryBooking.create({
    data: {
      studentId,
      dormitoryId,
      roomId,
      checkInDate: new Date(checkInDate),
      semester,
      academicYear,
      notes,
      status: 'PENDING',
    },
    include: {
      student: { include: { user: true } },
      dormitory: true,
      room: true,
    },
  });

  await logAudit(req.user.id, 'CREATE', 'DormitoryBooking', booking.id, {
    newValues: { studentId, dormitoryId, roomId },
    description: 'Yotoqxona bron qilindi',
  });

  return success(res, booking, 'Ariza topshirildi', 201);
};

// Bron ko'rib chiqish (Admin)
exports.reviewBooking = async (req, res) => {
  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(action)) {
    return error(res, 'Noto\'g\'ri harakat. APPROVED yoki REJECTED bo\'lishi kerak', 400);
  }

  const booking = await prisma.dormitoryBooking.findUnique({
    where: { id },
    include: { room: true, student: true },
  });

  if (!booking) return error(res, 'Ariza topilmadi', 404);
  if (booking.status !== 'PENDING') return error(res, 'Ariza allaqachon ko\'rib chiqilgan', 409);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.dormitoryBooking.update({
      where: { id },
      data: {
        status: action,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        rejectionReason: action === 'REJECTED' ? rejectionReason : null,
      },
    });

    // Tasdiqlanganda xona bandligini yangilash
    if (action === 'APPROVED') {
      await tx.room.update({
        where: { id: booking.roomId },
        data: {
          currentCount: { increment: 1 },
          status: booking.room.currentCount + 1 >= booking.room.capacity ? 'FULL' : 'AVAILABLE',
        },
      });

      await tx.dormitory.update({
        where: { id: booking.dormitoryId },
        data: { currentOccupancy: { increment: 1 } },
      });

      await tx.student.update({
        where: { id: booking.studentId },
        data: { housingType: 'DORMITORY' },
      });
    }

    return result;
  });

  await logAudit(req.user.id, action === 'APPROVED' ? 'APPROVE' : 'REJECT', 'DormitoryBooking', id, {
    newValues: { status: action },
    description: `Ariza ${action === 'APPROVED' ? 'tasdiqlandi' : 'rad etildi'}`,
  });

  return success(res, updated, `Ariza ${action === 'APPROVED' ? 'tasdiqlandi' : 'rad etildi'}`);
};

// Bronlar ro'yxati
exports.getBookings = async (req, res) => {
  const { page = 1, limit = 20, status, dormitoryId, academicYear } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(dormitoryId && { dormitoryId }),
    ...(academicYear && { academicYear }),
  };

  const [bookings, total] = await Promise.all([
    prisma.dormitoryBooking.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        dormitory: { select: { name: true } },
        room: { select: { roomNumber: true, floor: true, type: true } },
      },
      skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dormitoryBooking.count({ where }),
  ]);

  return paginated(res, bookings, total, page, limit);
};
