/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  moduleFileExtensions: ['js', 'json'],
  roots: ['<rootDir>/dist/test'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
}
