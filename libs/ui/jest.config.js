/** @type {import('jest').Config} */
module.exports = {
  displayName: 'ui',
  testEnvironment: 'node',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/ui/schematics/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: '<rootDir>/libs/ui/schematics/tsconfig.json', isolatedModules: true },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: '<rootDir>/coverage/libs/ui',
};
