module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/config/logger.js'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 15000,
  setupFilesAfterFramework: [],
};
