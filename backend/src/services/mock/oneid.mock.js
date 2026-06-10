// TEST REJIMI UCHUN - Haqiqiy OneID o'rniga
// Ishlab chiqishda (NODE_ENV=development) ishlatiladi

const MOCK_USERS = [
  {
    sub: 'mock-admin-001',
    pinfl: '11111111111111',
    firstName: 'Aziz',
    lastName: 'Karimov',
    middleName: 'Baxtiyorovich',
    dateOfBirth: '1985-03-15',
    gender: 'MALE',
    email: 'admin@university.uz',
    phone: '+998901234567',
    address: { region: 'Toshkent', district: 'Yunusobod', fullAddress: 'Universitet ko\'chasi 4' },
    role: 'SUPER_ADMIN',
  },
];

class OneIDMockService {
  getAuthorizationUrl(state) {
    // Test sahifasiga yo'naltirish
    return `/api/v1/auth/mock-login?state=${state}`;
  }

  getMockUsers() {
    return MOCK_USERS.map(u => ({ sub: u.sub, name: `${u.lastName} ${u.firstName}`, role: u.role }));
  }

  async getUserBySub(sub) {
    return MOCK_USERS.find(u => u.sub === sub) || null;
  }

  async getAccessToken(code) {
    return { access_token: `mock_token_${code}`, token_type: 'Bearer' };
  }

  async getUserInfo(accessToken) {
    const sub = accessToken.replace('mock_token_', '');
    const user = MOCK_USERS.find(u => u.sub === sub);
    return user || MOCK_USERS[1];
  }
}

module.exports = new OneIDMockService();
