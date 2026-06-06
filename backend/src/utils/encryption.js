// O'RQ-547 "Shaxsiy ma'lumotlar to'g'risida" qonuniga muvofiq
// Maxfiy ma'lumotlarni (pasport, PINFL) shifrlash

const CryptoJS = require('crypto-js');

const KEY = process.env.ENCRYPTION_KEY;
const IV = process.env.ENCRYPTION_IV;

function encrypt(text) {
  if (!text) return null;
  const key = CryptoJS.enc.Utf8.parse(KEY);
  const iv = CryptoJS.enc.Utf8.parse(IV);
  const encrypted = CryptoJS.AES.encrypt(text.toString(), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

function decrypt(cipherText) {
  if (!cipherText) return null;
  const key = CryptoJS.enc.Utf8.parse(KEY);
  const iv = CryptoJS.enc.Utf8.parse(IV);
  const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function maskPinfl(pinfl) {
  if (!pinfl || pinfl.length < 8) return '***';
  return pinfl.slice(0, 4) + '***' + pinfl.slice(-2);
}

function maskPhone(phone) {
  if (!phone || phone.length < 9) return '***';
  return phone.slice(0, 4) + '***' + phone.slice(-2);
}

function maskPassport(series, number) {
  return `${series || '**'}****${(number || '').slice(-2)}`;
}

module.exports = { encrypt, decrypt, maskPinfl, maskPhone, maskPassport };
