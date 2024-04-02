/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}"
  ],
  coveragePathIgnorePatterns: [
    "node_modules",
    "vendor",
    "skillreactor",
    ".build",
    "coverage",
    "jest.config.js"
  ]
};