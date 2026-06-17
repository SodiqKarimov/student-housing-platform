const TelegramBot = require('node-telegram-bot-api');
const logger = require('../config/logger');

let bot = null;
let isEnabled = false;

// Botni ishga tushirish
function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    logger.warn('Telegram bot: TOKEN yoki CHAT_ID sozlanmagan. Bildirishnomalar o\'chirilgan.');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: false });
    isEnabled = true;
    logger.info('Telegram bot muvaffaqiyatli ishga tushdi');
  } catch (err) {
    logger.error('Telegram bot ishga tushishda xato', { error: err.message });
  }
}

// Xabar yuborish (universal)
async function sendMessage(chatId, text, options = {}) {
  if (!isEnabled || !bot) return false;

  const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

  try {
    await bot.sendMessage(targetChatId, text, {
      parse_mode: 'HTML',
      ...options,
    });
    return true;
  } catch (err) {
    logger.error('Telegram xabar yuborishda xato', { error: err.message, chatId: targetChatId });
    return false;
  }
}

// Xabar shablonlari
const templates = {
  // Yangi ijara arizasi
  newRental: (data) => `
🏠 <b>Yangi Ijara Ro'yxatga Olish</b>

👤 Talaba: <b>${data.studentName}</b>
🆔 Talaba ID: ${data.studentId || '—'}
📍 Manzil: ${data.region}, ${data.district}
🏡 Xost: ${data.hostName || 'Noma\'lum'}
💰 Ijara: ${data.monthlyRent ? data.monthlyRent.toLocaleString() + " so'm/oy" : 'Ko\'rsatilmagan'}
📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}

⚠️ Tasdiqlash kutilmoqda!`,

  // Ijara tasdiqlandi
  rentalApproved: (data) => `
✅ <b>Ijara Tasdiqlandi</b>

👤 Talaba: <b>${data.studentName}</b>
📍 Manzil: ${data.region}, ${data.district}
✔️ Tasdiqlagan: ${data.approvedBy}`,

  // Ijara rad etildi
  rentalRejected: (data) => `
❌ <b>Ijara Rad Etildi</b>

👤 Talaba: <b>${data.studentName}</b>
📍 Manzil: ${data.region}, ${data.district}
💬 Sabab: ${data.reason || 'Ko\'rsatilmagan'}`,

  // Yangi bron arizasi
  newBooking: (data) => `
🛏 <b>Yangi Yotoqxona Arizasi</b>

👤 Talaba: <b>${data.studentName}</b>
🏠 Yotoqxona: ${data.dormitoryName}
📅 Ariza sanasi: ${new Date().toLocaleDateString('uz-UZ')}

⚠️ Ko'rib chiqish kutilmoqda!`,

  // Bron tasdiqlandi
  bookingApproved: (data) => `
✅ <b>Yotoqxona Arizasi Tasdiqlandi</b>

👤 Talaba: <b>${data.studentName}</b>
🏠 Yotoqxona: ${data.dormitoryName}
🚪 Xona: ${data.roomNumber || 'Tayinlanmagan'}
✔️ Tasdiqlagan: ${data.approvedBy}`,

  // Bron rad etildi
  bookingRejected: (data) => `
❌ <b>Yotoqxona Arizasi Rad Etildi</b>

👤 Talaba: <b>${data.studentName}</b>
🏠 Yotoqxona: ${data.dormitoryName}
💬 Sabab: ${data.reason || 'Ko\'rsatilmagan'}`,

  // Qoidabuzarlik
  violation: (data) => `
⚠️ <b>Qoidabuzarlik Qayd Etildi</b>

👤 Talaba: <b>${data.studentName}</b>
🏠 Yotoqxona: ${data.dormitoryName}
⏰ Vaqt: ${data.time}
📋 Turi: ${data.type === 'LATE_ENTRY' ? 'Kech kirish' : 'Vaqtsiz chiqish'}
📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}`,

  // 24 soat yo'q
  absentAlert: (data) => `
🔴 <b>24 Soat Qayd Etilmadi!</b>

👤 Talaba: <b>${data.studentName}</b>
🏠 Yotoqxona: ${data.dormitoryName}
🚪 Xona: ${data.roomNumber || '—'}
📞 Telefon: ${data.phone || '—'}
👨‍👩‍👧 Ota-ona: ${data.parentPhone || '—'}
⏰ Oxirgi qayd: ${data.lastSeen || 'Hech qachon'}`,

  // Yangi foydalanuvchi yaratildi
  newUser: (data) => `
👤 <b>Yangi Foydalanuvchi Qo'shildi</b>

Ism: <b>${data.firstName} ${data.lastName}</b>
Email: ${data.email}
Rol: ${data.role}
Parol: <code>${data.tempPassword}</code>

⚠️ Birinchi kirishda parolni o'zgartiring!`,

  // Tizim xatosi (admin uchun)
  systemError: (data) => `
🆘 <b>Tizim Xatosi!</b>

❌ Xato: ${data.error}
📍 Joyi: ${data.location}
📅 Vaqt: ${new Date().toLocaleString('uz-UZ')}`,
};

// Maxsus bildirishnoma funksiyalari
const notify = {
  newRental: (data) => sendMessage(null, templates.newRental(data)),
  rentalApproved: (data) => sendMessage(null, templates.rentalApproved(data)),
  rentalRejected: (data) => sendMessage(null, templates.rentalRejected(data)),

  newBooking: (data) => sendMessage(null, templates.newBooking(data)),
  bookingApproved: (data) => sendMessage(null, templates.bookingApproved(data)),
  bookingRejected: (data) => sendMessage(null, templates.bookingRejected(data)),

  violation: (data) => sendMessage(null, templates.violation(data)),
  absentAlert: (data) => sendMessage(null, templates.absentAlert(data)),

  newUser: (data, chatId) => sendMessage(chatId || null, templates.newUser(data)),
  systemError: (data) => sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID || null, templates.systemError(data)),

  // Ko'plab yo'q talabalar uchun summary
  absentSummary: async (students, dormitoryName) => {
    if (!students || students.length === 0) return;
    const text = `
🔴 <b>24 Soat Qayd Etilmaganlar — ${dormitoryName}</b>
Jami: <b>${students.length} ta talaba</b>
📅 ${new Date().toLocaleString('uz-UZ')}

${students.slice(0, 10).map((s, i) => `${i + 1}. ${s.name} (xona: ${s.room || '—'}) — tel: ${s.phone || '—'}`).join('\n')}
${students.length > 10 ? `\n... va yana ${students.length - 10} ta talaba` : ''}`;
    return sendMessage(null, text);
  },
};

module.exports = { initTelegramBot, sendMessage, notify, isEnabled: () => isEnabled };
