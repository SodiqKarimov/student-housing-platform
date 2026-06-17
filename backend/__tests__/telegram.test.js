// Telegram service testlari

describe('Telegram Service', () => {
  let telegramService;

  beforeEach(() => {
    // Har test oldidan environment tozalash
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    // Module cache tozalash
    jest.resetModules();
  });

  test('Token yo\'q bo\'lganda bot ishga tushmaydi', () => {
    telegramService = require('../src/services/telegram.service');
    expect(telegramService.isEnabled()).toBe(false);
  });

  test('initTelegramBot funksiyasi mavjud', () => {
    telegramService = require('../src/services/telegram.service');
    expect(telegramService.initTelegramBot).toBeInstanceOf(Function);
  });

  test('sendMessage funksiyasi mavjud', () => {
    telegramService = require('../src/services/telegram.service');
    expect(telegramService.sendMessage).toBeInstanceOf(Function);
  });

  test('notify obyekti mavjud va funksiyalar bor', () => {
    telegramService = require('../src/services/telegram.service');
    expect(telegramService.notify).toBeDefined();
    expect(telegramService.notify.newRental).toBeInstanceOf(Function);
    expect(telegramService.notify.rentalApproved).toBeInstanceOf(Function);
    expect(telegramService.notify.newBooking).toBeInstanceOf(Function);
    expect(telegramService.notify.bookingApproved).toBeInstanceOf(Function);
    expect(telegramService.notify.violation).toBeInstanceOf(Function);
    expect(telegramService.notify.absentAlert).toBeInstanceOf(Function);
  });

  test('Bot yo\'q bo\'lganda sendMessage false qaytaradi', async () => {
    telegramService = require('../src/services/telegram.service');
    const result = await telegramService.sendMessage('123', 'test');
    expect(result).toBe(false);
  });

  test('Bot yo\'q bo\'lganda notify.newRental xato chiqarmaydi', async () => {
    telegramService = require('../src/services/telegram.service');
    const result = await telegramService.notify.newRental({
      studentName: 'Sardor Aliyev',
      studentId: 'STD-001',
      region: 'Toshkent',
      district: 'Yunusobod',
    });
    expect(result).toBe(false);
  });
});
