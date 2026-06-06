// TEST REJIMI UCHUN - Haqiqiy HEMIS o'rniga

const MOCK_STUDENTS = {
  '30309950000001': {
    hemisId: 'HEMIS-2021-001',
    studentIdNumber: 'TT-21-001',
    firstName: 'Jasur', lastName: 'Toshmatov', middleName: 'Aliyevich',
    pinfl: '30309950000001',
    dateOfBirth: '2003-09-30',
    gender: 'MALE',
    faculty: 'Kompyuter muhandisligi',
    department: 'Dasturiy injiniring',
    specialty: 'Dasturiy ta\'minot muhandisligi',
    courseYear: 3,
    educationForm: 'Kunduzgi',
    educationBasis: 'Grant',
    status: 'STUDYING',
    homeRegion: 'Samarqand', homeDistrict: 'Urgut',
    homeAddress: 'Bog\'iston mahallasi 12',
    isOrphan: false, isDisabled: false,
  },
  '30309950000002': {
    hemisId: 'HEMIS-2022-002',
    studentIdNumber: 'TT-22-002',
    firstName: 'Malika', lastName: 'Yusupova', middleName: 'Hamidovna',
    pinfl: '30309950000002',
    dateOfBirth: '2004-05-12',
    gender: 'FEMALE',
    faculty: 'Iqtisodiyot',
    department: 'Moliya',
    specialty: 'Moliya va kredit',
    courseYear: 2,
    educationForm: 'Kunduzgi',
    educationBasis: 'To\'lov-kontrakt',
    status: 'STUDYING',
    homeRegion: 'Farg\'ona', homeDistrict: 'Marg\'ilon',
    homeAddress: 'Navoi ko\'chasi 7',
    isOrphan: false, isDisabled: false,
  },
  '30309950000003': {
    hemisId: 'HEMIS-2023-003',
    studentIdNumber: 'TT-23-003',
    firstName: 'Bobur', lastName: 'Mirzayev', middleName: 'Ulugbekovich',
    pinfl: '30309950000003',
    dateOfBirth: '2005-01-20',
    gender: 'MALE',
    faculty: 'Kompyuter muhandisligi',
    department: 'Axborot tizimlari',
    specialty: 'Axborot tizimlari va texnologiyalari',
    courseYear: 1,
    educationForm: 'Kunduzgi',
    educationBasis: 'Grant',
    status: 'STUDYING',
    homeRegion: 'Qashqadaryo', homeDistrict: 'Qarshi',
    homeAddress: 'Amir Temur ko\'chasi 45',
    isOrphan: true, isDisabled: false,
  },
};

class HemisMockService {
  async getStudentByPinfl(pinfl) {
    return MOCK_STUDENTS[pinfl] || null;
  }

  async getStudentById(hemisId) {
    return Object.values(MOCK_STUDENTS).find(s => s.hemisId === hemisId) || null;
  }

  async syncStudentData(hemisId) {
    return Object.values(MOCK_STUDENTS).find(s => s.hemisId === hemisId) || null;
  }

  async getAllStudents(page = 1, limit = 100) {
    const students = Object.values(MOCK_STUDENTS);
    return { students, total: students.length, page };
  }

  async updateHousingStatus(hemisId, housingType) {
    console.log(`[HEMIS Mock] Housing updated: ${hemisId} -> ${housingType}`);
  }
}

module.exports = new HemisMockService();
