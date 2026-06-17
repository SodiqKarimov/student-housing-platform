const { prisma } = require('../config/database');
const { logAudit } = require('../middleware/audit.middleware');
const { success, error, paginated } = require('../utils/response');
const { notify } = require('../services/telegram.service');

// Yotoqxonalar ro'yxati
exports.getAllDormitories = async (req, res) => {
  const { page = 1, limit = 10, region, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(region && { region: { contains: region } }),
    ...(status && { status }),
    ...(req.user.role === 'ADMIN' && { managerId: req.user.id }),
    ...(req.user.role === 'DORMITORY_STAFF' && req.user.staffDormitoryId && { id: req.user.staffDormitoryId }),
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

  notify.newBooking({
    studentName: `${booking.student.user.lastName} ${booking.student.user.firstName}`,
    dormitoryName: booking.dormitory.name,
  }).catch(() => {});

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

  // Telegram bildirishnoma
  const bookingFull = await prisma.dormitoryBooking.findUnique({
    where: { id },
    include: { student: { include: { user: true } }, dormitory: true, room: true },
  });
  if (bookingFull) {
    const studentName = `${bookingFull.student.user.lastName} ${bookingFull.student.user.firstName}`;
    const approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
    if (action === 'APPROVED') {
      notify.bookingApproved({ studentName, dormitoryName: bookingFull.dormitory.name, roomNumber: bookingFull.room?.roomNumber, approvedBy: approverName }).catch(() => {});
    } else {
      notify.bookingRejected({ studentName, dormitoryName: bookingFull.dormitory.name, reason: rejectionReason }).catch(() => {});
    }
  }

  return success(res, updated, `Ariza ${action === 'APPROVED' ? 'tasdiqlandi' : 'rad etildi'}`);
};

// Xonadagi talabalar
exports.getRoomStudents = async (req, res) => {
  const { roomId } = req.params;
  const students = await prisma.student.findMany({
    where: {
      dormitoryBookings: { some: { roomId, status: 'ACTIVE' } },
    },
    include: {
      user: { select: { firstName: true, lastName: true, middleName: true, phone: true, photoUrl: true } },
    },
  });
  return success(res, students);
};

// Yotoqxona yangilash
exports.updateDormitory = async (req, res) => {
  const { id } = req.params;
  const { name, address, region, totalRooms, totalCapacity, genderRestriction, phoneNumber, floors } = req.body;

  const existing = await prisma.dormitory.findUnique({ where: { id } });
  if (!existing) return error(res, 'Yotoqxona topilmadi', 404);

  const updated = await prisma.dormitory.update({
    where: { id },
    data: { name, address, region, totalRooms, totalCapacity, genderRestriction, phoneNumber, floors },
  });

  await logAudit(req.user.id, 'UPDATE', 'Dormitory', id, {
    description: 'Yotoqxona yangilandi',
  });

  return success(res, updated, 'Yotoqxona yangilandi');
};

// Yotoqxona o'chirish
exports.deleteDormitory = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.dormitory.findUnique({ where: { id } });
  if (!existing) return error(res, 'Yotoqxona topilmadi', 404);

  const activeBookings = await prisma.dormitoryBooking.count({ where: { dormitoryId: id, status: 'ACTIVE' } });
  if (activeBookings > 0) {
    return error(res, `Bu yotoqxonada ${activeBookings} ta faol talaba bor. Avval ularni chiqaring.`, 400);
  }

  // Cascade delete: bog'liq barcha yozuvlarni navbat bilan o'chirish
  await prisma.$transaction([
    prisma.dormitoryBooking.deleteMany({ where: { dormitoryId: id } }),
    prisma.greenModeLog.deleteMany({ where: { dormitoryId: id } }),
    prisma.greenModeViolation.deleteMany({ where: { dormitoryId: id } }),
    prisma.greenModeException.deleteMany({ where: { dormitoryId: id } }),
    prisma.faceIdEvent.deleteMany({ where: { dormitoryId: id } }),
    prisma.ichkiAriza.deleteMany({ where: { dormitoryId: id } }),
    prisma.paymentRecord.deleteMany({ where: { dormitoryId: id } }),
    prisma.studentArchive.deleteMany({ where: { dormitoryId: id } }),
    prisma.room.deleteMany({ where: { dormitoryId: id } }),
    prisma.dormitory.delete({ where: { id } }),
  ]);

  await logAudit(req.user.id, 'DELETE', 'Dormitory', id, {
    description: "Yotoqxona o'chirildi",
  });

  return success(res, null, "Yotoqxona o'chirildi");
};

// Yotoqxona hisoboti (DORMITORY_STAFF faqat o'z yotoqxonasini ko'ra oladi)
exports.getDormitoryReport = async (req, res) => {
  const { dormId } = req.params;

  if (req.user.role === 'DORMITORY_STAFF' && req.user.staffDormitoryId !== dormId) {
    return error(res, "Ruxsat yo'q", 403);
  }

  const dormitory = await prisma.dormitory.findUnique({
    where: { id: dormId },
    include: {
      rooms: {
        include: {
          bookings: {
            where: { status: 'ACTIVE' },
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, middleName: true, phone: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!dormitory) return error(res, 'Yotoqxona topilmadi', 404);
  return success(res, dormitory);
};

// Arxivlash
exports.archiveDormitory = async (req, res) => {
  const { dormId } = req.params;
  const { academicYear } = req.body;

  if (!academicYear) return error(res, "Akademik yil talab qilinadi (masalan: 2024-2025)", 400);

  const dormitory = await prisma.dormitory.findUnique({ where: { id: dormId } });
  if (!dormitory) return error(res, 'Yotoqxona topilmadi', 404);

  const bookings = await prisma.dormitoryBooking.findMany({
    where: { dormitoryId: dormId },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, middleName: true, phone: true, email: true } },
        },
      },
      room: { select: { roomNumber: true, floor: true, type: true } },
    },
  });

  const archiveData = JSON.stringify(bookings);
  const archive = await prisma.studentArchive.create({
    data: {
      dormitoryId: dormId,
      academicYear,
      archivedBy: req.user.id,
      data: archiveData,
      totalStudents: bookings.length,
    },
  });

  await logAudit(req.user.id, 'CREATE', 'StudentArchive', archive.id, {
    description: `${academicYear} yili arxivlandi`,
  });

  return success(res, { archiveId: archive.id, totalStudents: bookings.length, academicYear }, 'Arxivlash muvaffaqiyatli');
};

// Arxivlar ro'yxati
exports.getArchives = async (req, res) => {
  const { dormId } = req.params;
  const archives = await prisma.studentArchive.findMany({
    where: { dormitoryId: dormId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, academicYear: true, archivedAt: true, totalStudents: true, archivedBy: true, createdAt: true },
  });
  return success(res, archives);
};

// Arxiv tafsiloti
exports.getArchiveDetail = async (req, res) => {
  const { archiveId } = req.params;
  const archive = await prisma.studentArchive.findUnique({ where: { id: archiveId } });
  if (!archive) return error(res, 'Arxiv topilmadi', 404);
  return success(res, { ...archive, data: JSON.parse(archive.data) });
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
