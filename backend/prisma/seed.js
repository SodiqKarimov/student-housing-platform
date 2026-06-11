const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seed ma\'lumotlari qo\'shilmoqda...');

  // Super Admin yaratish (email/parol bilan kirish uchun)
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@university.uz';
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin@TTJ2024';
  const existing = await prisma.user.findFirst({ where: { email: SUPER_ADMIN_EMAIL } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        email: SUPER_ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        passwordHash,
      },
    });
    console.log(`✅ Super Admin yaratildi: ${SUPER_ADMIN_EMAIL}`);
  } else if (!existing.passwordHash) {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    console.log(`✅ Super Admin paroli yangilandi: ${SUPER_ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️  Super Admin allaqachon mavjud: ${SUPER_ADMIN_EMAIL}`);
  }

  // Yotoqxonalar
  const dorm1 = await prisma.dormitory.upsert({
    where: { id: 'dorm-0001-0001-0001-000000000001' },
    update: {},
    create: {
      id: 'dorm-0001-0001-0001-000000000001',
      name: '1-sonli Talabalar Turar Joyi',
      address: 'Universitet ko\'chasi, 1',
      region: 'Toshkent', totalRooms: 50, totalCapacity: 200,
      genderRestriction: 'MALE', status: 'ACTIVE',
      amenities: JSON.stringify(['Wi-Fi', 'Oshxona', 'Kir yuvish xonasi', 'O\'qish zali']),
      phoneNumber: '+998712345678', email: 'dorm1@university.uz',
    },
  });

  const dorm2 = await prisma.dormitory.upsert({
    where: { id: 'dorm-0002-0002-0002-000000000002' },
    update: {},
    create: {
      id: 'dorm-0002-0002-0002-000000000002',
      name: '2-sonli Talabalar Turar Joyi',
      address: 'Universitet ko\'chasi, 2',
      region: 'Toshkent', totalRooms: 40, totalCapacity: 160,
      genderRestriction: 'FEMALE', status: 'ACTIVE',
      amenities: JSON.stringify(['Wi-Fi', 'Oshxona', 'Sport zali', 'Tibbiy punkt']),
      phoneNumber: '+998712345679', email: 'dorm2@university.uz',
    },
  });

  // Xonalar (1-yotoqxona)
  const roomTypes = [
    { type: 'DOUBLE', capacity: 2, price: 150000 },
    { type: 'TRIPLE', capacity: 3, price: 120000 },
    { type: 'QUAD',   capacity: 4, price: 100000 },
  ];
  for (let floor = 1; floor <= 3; floor++) {
    for (let room = 1; room <= 6; room++) {
      const rt = roomTypes[(room - 1) % 3];
      const rn = `${floor}${String(room).padStart(2, '0')}`;
      await prisma.room.upsert({
        where: { dormitoryId_roomNumber: { dormitoryId: dorm1.id, roomNumber: rn } },
        update: {},
        create: {
          dormitoryId: dorm1.id, roomNumber: rn, floor,
          type: rt.type, capacity: rt.capacity, pricePerMonth: rt.price,
          status: 'AVAILABLE',
          amenities: JSON.stringify(['Yotoq', 'Shkaf', 'Stol']),
        },
      });
    }
  }

  // 2-yotoqxona xonalari
  for (let floor = 1; floor <= 3; floor++) {
    for (let room = 1; room <= 4; room++) {
      const rt = roomTypes[room % 3];
      const rn = `${floor}${String(room).padStart(2, '0')}`;
      await prisma.room.upsert({
        where: { dormitoryId_roomNumber: { dormitoryId: dorm2.id, roomNumber: rn } },
        update: {},
        create: {
          dormitoryId: dorm2.id, roomNumber: rn, floor,
          type: rt.type, capacity: rt.capacity, pricePerMonth: rt.price,
          status: 'AVAILABLE',
          amenities: JSON.stringify(['Yotoq', 'Shkaf', 'Stol']),
        },
      });
    }
  }

  console.log('✅ Seed muvaffaqiyatli yakunlandi!');
  console.log('');
  console.log('📌 Test foydalanuvchilari (dev/mock-login sahifasidan kiring):');
  console.log('   👤 Aziz Karimov       → Super Administrator');
  console.log('   👤 Jasur Toshmatov    → Talaba (Kompyuter muhandisligi, 3-kurs)');
  console.log('   👤 Malika Yusupova    → Talaba (Iqtisodiyot, 2-kurs)');
  console.log('   👤 Nodira Rahimova    → Dekanat xodimi');
  console.log('');
  console.log('🏢 Yaratilgan yotoqxonalar:');
  console.log(`   1-sonli TTJ (Erkaklar): ${dorm1.id}`);
  console.log(`   2-sonli TTJ (Ayollar):  ${dorm2.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
