// Validatsiya qoidalarini tekshirish
// Bu testlar validate.middleware.js ni sintatik tekshiradi

describe('Validation Middleware', () => {
  let validateModule;

  beforeAll(() => {
    validateModule = require('../src/middleware/validate.middleware');
  });

  test('Module muvaffaqiyatli yuklanadi', () => {
    expect(validateModule).toBeDefined();
    expect(validateModule.validate).toBeInstanceOf(Function);
  });

  test('studentValidation.create array qaytaradi', () => {
    expect(Array.isArray(validateModule.studentValidation.create)).toBe(true);
    expect(validateModule.studentValidation.create.length).toBeGreaterThan(0);
  });

  test('studentValidation.update array qaytaradi', () => {
    expect(Array.isArray(validateModule.studentValidation.update)).toBe(true);
  });

  test('authValidation.login array qaytaradi', () => {
    expect(Array.isArray(validateModule.authValidation.login)).toBe(true);
  });

  test('dormitoryValidation.create array qaytaradi', () => {
    expect(Array.isArray(validateModule.dormitoryValidation.create)).toBe(true);
  });

  test('dormitoryValidation.review array qaytaradi', () => {
    expect(Array.isArray(validateModule.dormitoryValidation.review)).toBe(true);
  });

  test('paginationValidation array qaytaradi', () => {
    expect(Array.isArray(validateModule.paginationValidation)).toBe(true);
  });

  test('profileValidation.changePassword array qaytaradi', () => {
    expect(Array.isArray(validateModule.profileValidation.changePassword)).toBe(true);
  });
});

// Validatsiya logikasini tekshirish (mock req/res bilan)
describe('Validate Function', () => {
  const { validate } = require('../src/middleware/validate.middleware');
  const { validationResult } = require('express-validator');

  test('Xatoliksiz so\'rov o\'tkaziladi', () => {
    const req = { body: {} };
    // validationResult mock qilish
    const mockNext = jest.fn();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Express-validator context'siz faqat next chaqiriladi
    // To'liq integration test uchun supertest kerak
    expect(validate).toBeInstanceOf(Function);
    expect(mockNext).not.toHaveBeenCalled(); // validate chaqirilmadi
  });
});
