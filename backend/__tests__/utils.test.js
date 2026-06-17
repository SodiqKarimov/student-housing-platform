const { AppError, ValidationError, NotFoundError, ConflictError } = require('../src/utils/errors');
const { encrypt, decrypt } = require('../src/utils/encryption');

// ============================================
// Error klasslari testlari
// ============================================
describe('Custom Error Classes', () => {
  test('AppError to\'g\'ri yaratiladi', () => {
    const err = new AppError('Test xato', 400);
    expect(err.message).toBe('Test xato');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  test('ValidationError 400 status bilan yaratiladi', () => {
    const err = new ValidationError('Validatsiya xatosi');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('ValidationError');
  });

  test('NotFoundError 404 status bilan yaratiladi', () => {
    const err = new NotFoundError('Talaba');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Talaba topilmadi');
  });

  test('ConflictError 409 status bilan yaratiladi', () => {
    const err = new ConflictError('PINFL allaqachon mavjud');
    expect(err.statusCode).toBe(409);
  });

  test('AppError errors array saqlaydi', () => {
    const errors = [{ field: 'email', message: 'Noto\'g\'ri format' }];
    const err = new AppError('Xato', 400, errors);
    expect(err.errors).toEqual(errors);
  });
});

// ============================================
// Shifrlash testlari
// ============================================
describe('Encryption Utils', () => {
  const testPinfl = '12345678901234';

  test('PINFL muvaffaqiyatli shifrlanadi', () => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
    const encrypted = encrypt(testPinfl);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(testPinfl);
    expect(typeof encrypted).toBe('string');
  });

  test('Shifrlangan PINFL ochiladi', () => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
    const encrypted = encrypt(testPinfl);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(testPinfl);
  });

  test('Null qiymat shifrlanmaydi', () => {
    const result = encrypt(null);
    expect(result).toBeNull();
  });

  test('Undefined qiymat shifrlanmaydi', () => {
    const result = encrypt(undefined);
    expect(result).toBeNull();
  });
});
