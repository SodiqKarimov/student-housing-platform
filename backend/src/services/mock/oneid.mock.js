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
  {
    sub: 'mock-student-001',
    pinfl: '30309950000001',
    firstName: 'Jasur',
    lastName: 'Toshmatov',
    middleName: 'Aliyevich',
    dateOfBirth: '2003-09-30',
    gender: 'MALE',
    email: 'jasur@student.uz',
    phone: '+998901111111',
    address: { region: 'Samarqand', district: 'Urgut', fullAddress: 'Bog\'iston mahallasi 12' },
    role: 'STUDENT',
  },
  {
    sub: 'mock-student-002',
    pinfl: '30309950000002',
    firstName: 'Malika',
    lastName: 'Yusupova',
    middleName: 'Hamidovna',
    dateOfBirth: '2004-05-12',
    gender: 'FEMALE',
    email: 'malika@student.uz',
    phone: '+998902222222',
    address: { region: 'Farg\'ona', district: 'Marg\'ilon', fullAddress: 'Navoi ko\'chasi 7' },
    role: 'STUDENT',
  },
  {
    sub: 'mock-dean-001',
    pinfl: '22222222222222',
    firstName: 'Nodira',
    lastName: 'Rahimova',
    middleName: 'Salimovna',
    dateOfBirth: '1990-07-20',
    gender: 'FEMALE',
    email: 'dean@university.uz',
    phone: '+998903333333',
    address: { region: 'Toshkent', district: 'Mirzo Ulug\'bek', fullAddress: 'Fan ko\'chasi 2' },
    role: 'DEAN_OFFICE',
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
