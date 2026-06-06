const axios = require('axios');
const logger = require('../config/logger');

if (process.env.NODE_ENV !== 'production' && process.env.USE_MOCK === 'true') {
  module.exports = require('./mock/hemis.mock');
  return;
}

// HEMIS - Oliy ta'lim axborot boshqaruv tizimi
// https://hemis.uz | O'zbekiston OTMlari uchun rasmiy tizim

class HemisService {
  constructor() {
    this.baseUrl = process.env.HEMIS_API_URL;
    this.apiKey = process.env.HEMIS_API_KEY;
    this.universityId = process.env.HEMIS_UNIVERSITY_ID;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-University-ID': this.universityId,
      },
      timeout: 15000,
    });
  }

  async getStudentByPinfl(pinfl) {
    try {
      const response = await this.client.get(`/student/search`, {
        params: { pinfl },
      });
      return this._mapStudentData(response.data?.data);
    } catch (error) {
      logger.error('HEMIS: PINFL bo\'yicha talaba topilmadi', { pinfl, error: error.message });
      return null;
    }
  }

  async getStudentById(hemisId) {
    try {
      const response = await this.client.get(`/student/${hemisId}`);
      return this._mapStudentData(response.data?.data);
    } catch (error) {
      logger.error('HEMIS: Talaba topilmadi', { hemisId, error: error.message });
      return null;
    }
  }

  async syncStudentData(hemisId) {
    try {
      const response = await this.client.get(`/student/${hemisId}/details`);
      return this._mapStudentData(response.data?.data);
    } catch (error) {
      logger.error('HEMIS: Talaba ma\'lumotlarini yangilashda xato', { hemisId, error: error.message });
      throw error;
    }
  }

  async getAllStudents(page = 1, limit = 100) {
    try {
      const response = await this.client.get('/student/list', {
        params: { page, limit, university_id: this.universityId },
      });
      return {
        students: (response.data?.data || []).map(this._mapStudentData),
        total: response.data?.total,
        page,
      };
    } catch (error) {
      logger.error('HEMIS: Talabalar ro\'yxatini olishda xato', { error: error.message });
      throw error;
    }
  }

  async updateHousingStatus(hemisId, housingType) {
    try {
      await this.client.patch(`/student/${hemisId}/housing`, {
        housing_type: housingType,
        university_id: this.universityId,
      });
      logger.info('HEMIS: Yashash holati yangilandi', { hemisId, housingType });
    } catch (error) {
      logger.error('HEMIS: Yashash holati yangilashda xato', { hemisId, error: error.message });
    }
  }

  _mapStudentData(data) {
    if (!data) return null;
    return {
      hemisId: data.id || data.student_id,
      studentIdNumber: data.student_id_number,
      firstName: data.first_name,
      lastName: data.last_name,
      middleName: data.middle_name,
      pinfl: data.pinfl || data.inn,
      dateOfBirth: data.birth_date,
      gender: data.gender === 1 ? 'MALE' : 'FEMALE',
      faculty: data.faculty?.name,
      department: data.department?.name,
      specialty: data.specialty?.name,
      courseYear: data.course || data.year,
      educationForm: data.education_form?.name,
      educationBasis: data.payment_form?.name,
      status: this._mapStudentStatus(data.student_status),
      email: data.email,
      phone: data.phone,
      homeRegion: data.province?.name,
      homeDistrict: data.district?.name,
      homeAddress: data.address,
      isOrphan: data.is_orphan || false,
      isDisabled: data.is_disabled || false,
    };
  }

  _mapStudentStatus(status) {
    const statusMap = {
      1: 'STUDYING',
      2: 'ACADEMIC_LEAVE',
      3: 'EXPELLED',
      4: 'GRADUATED',
      5: 'TRANSFERRED',
    };
    return statusMap[status] || 'STUDYING';
  }
}

module.exports = new HemisService();
