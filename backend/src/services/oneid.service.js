const axios = require('axios');
const logger = require('../config/logger');

if (process.env.NODE_ENV !== 'production' && process.env.USE_MOCK === 'true') {
  module.exports = require('./mock/oneid.mock');
  return;
}

// OneID - O'zbekiston Respublikasi yagona identifikatsiya tizimi
// https://id.egov.uz | OAuth 2.0 protokoli

class OneIDService {
  constructor() {
    this.authUrl = process.env.ONEID_AUTH_URL;
    this.tokenUrl = process.env.ONEID_TOKEN_URL;
    this.userInfoUrl = process.env.ONEID_USER_INFO_URL;
    this.clientId = process.env.ONEID_CLIENT_ID;
    this.clientSecret = process.env.ONEID_CLIENT_SECRET;
    this.redirectUri = process.env.ONEID_REDIRECT_URI;
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'one_code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'address contacts name passport_data',
      state,
    });
    return `${this.authUrl}?${params.toString()}`;
  }

  async getAccessToken(code) {
    try {
      const params = new URLSearchParams({
        grant_type: 'one_authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      });

      const response = await axios.post(this.tokenUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      logger.error('OneID token olishda xato', { error: error.message });
      throw new Error('OneID autentifikatsiyada xato yuz berdi');
    }
  }

  async getUserInfo(accessToken) {
    try {
      const params = new URLSearchParams({
        grant_type: 'one_access_token_identify',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        access_token: accessToken,
        scope: 'address contacts name passport_data',
      });

      const response = await axios.post(this.userInfoUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });

      return this._mapUserData(response.data);
    } catch (error) {
      logger.error('OneID foydalanuvchi ma\'lumotini olishda xato', { error: error.message });
      throw new Error('OneID foydalanuvchi ma\'lumotini olishda xato');
    }
  }

  _mapUserData(data) {
    return {
      sub: data.sub,
      pinfl: data.pinfl || data.inn,
      firstName: data.first_name || data.given_name,
      lastName: data.sur_name || data.family_name,
      middleName: data.mid_name || data.middle_name,
      birthDate: data.birth_date,
      gender: data.gender === '1' ? 'MALE' : 'FEMALE',
      passportSeries: data.passport_series,
      passportNumber: data.passport_number,
      email: data.email,
      phone: data.mobile_phone,
      address: {
        region: data.permanent_address?.region,
        district: data.permanent_address?.district,
        fullAddress: data.permanent_address?.address,
      },
    };
  }
}

module.exports = new OneIDService();
