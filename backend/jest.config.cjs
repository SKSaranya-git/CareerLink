/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  testPathIgnorePatterns: ["/node_modules/"],
  setupFiles: ["<rootDir>/src/tests/jest.setup.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/tests/**", "!**/node_modules/**"],
};
