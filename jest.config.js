// https://jestjs.io/docs/configuration
// https://kulshekhar.github.io/ts-jest/docs/

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '(.+)\\.js': '$1',
  },
};

export default jestConfig;
