const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "Talabalar Turar Joyi Boshqaruv Tizimi API",
      version: '1.0.0',
      description: `
O'zbekiston davlat standartlariga (O'RQ-547) muvofiq talabalar turar joyini boshqarish tizimi.

**Autentifikatsiya:**
- \`Bearer {accessToken}\` — JWT token orqali
- OneID (egov.uz) OAuth 2.0 orqali

**Rollar:**
- \`SUPER_ADMIN\` — Barcha huquqlar
- \`ADMIN\` — Yotoqxona boshqaruvi
- \`DEAN_OFFICE\` — Dekanat
- \`DORMITORY_STAFF\` — Yotoqxona xodimi
- \`TUTOR\` — Tarbiyachi
- \`STUDENT\` — Talaba (faqat o'z ma'lumotlari)
      `,
      contact: { name: 'Tizim Administrator', email: 'admin@university.uz' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: '/api/v1', description: 'Ishlab chiqish serveri' },
      { url: 'https://your-backend.onrender.com/api/v1', description: 'Production serveri' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token',
        },
      },
      schemas: {
        // Umumiy javob
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Muvaffaqiyatli' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Xato yuz berdi' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },

        // Talaba
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentIdNumber: { type: 'string', example: 'STD-2024-001' },
            firstName: { type: 'string', example: 'Sardor' },
            lastName: { type: 'string', example: 'Aliyev' },
            faculty: { type: 'string', example: 'Dasturiy injiniring' },
            courseYear: { type: 'integer', example: 2 },
            housingType: { type: 'string', enum: ['DORMITORY', 'RENTAL', 'COMMUTER'] },
            gender: { type: 'string', enum: ['MALE', 'FEMALE'] },
          },
        },
        CreateStudent: {
          type: 'object',
          required: ['firstName', 'lastName', 'pinfl', 'faculty', 'dateOfBirth'],
          properties: {
            firstName: { type: 'string', minLength: 2, maxLength: 50 },
            lastName: { type: 'string', minLength: 2, maxLength: 50 },
            middleName: { type: 'string' },
            pinfl: { type: 'string', minLength: 14, maxLength: 14, example: '12345678901234' },
            dateOfBirth: { type: 'string', format: 'date', example: '2002-05-15' },
            gender: { type: 'string', enum: ['MALE', 'FEMALE'], default: 'MALE' },
            faculty: { type: 'string' },
            courseYear: { type: 'integer', minimum: 1, maximum: 6 },
            phone: { type: 'string', pattern: '^\\+998[0-9]{9}$', example: '+998901234567' },
            housingType: { type: 'string', enum: ['DORMITORY', 'RENTAL', 'COMMUTER'] },
          },
        },

        // Yotoqxona
        Dormitory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: '1-yotoqxona' },
            gender: { type: 'string', enum: ['MALE', 'FEMALE', 'MIXED'] },
            totalCapacity: { type: 'integer' },
            currentOccupancy: { type: 'integer' },
            floors: { type: 'integer' },
            status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'CLOSED'] },
          },
        },

        // Bron
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            dormitoryId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CHECKED_OUT'] },
          },
        },

        // Login
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@university.uz' },
            password: { type: 'string', minLength: 6, example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                user: { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'DEAN_OFFICE', 'DORMITORY_STAFF', 'TUTOR', 'STUDENT'] },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autentifikatsiya va avtorizatsiya' },
      { name: 'Students', description: 'Talabalar boshqaruvi' },
      { name: 'Dormitories', description: 'Yotoqxonalar va bronlash' },
      { name: 'Rentals', description: 'Ijara ro\'yxatga olish' },
      { name: 'Commuters', description: 'Uyidan qatnab keluvchilar' },
      { name: 'GreenMode', description: 'Kirish/chiqish vaqt nazorati' },
      { name: 'FaceID', description: 'Yuz tanish tizimi' },
      { name: 'Recommendations', description: 'Talabalar tavsiyanomasi' },
      { name: 'Reports', description: 'Excel hisobotlar' },
      { name: 'Profile', description: 'Foydalanuvchi profili' },
      { name: 'Users', description: 'Foydalanuvchilar boshqaruvi (Super Admin)' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
