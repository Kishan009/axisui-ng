const ngPreset = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...ngPreset,
  displayName: 'themes',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/themes/src/**/*.spec.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js|mjs|html)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/libs/themes/tsconfig.lib.json' },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@axisui-ng/angular$': '<rootDir>/libs/ui/src/index.ts',
    '^@axisui-ng/angular/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@axisui-ng/themes$': '<rootDir>/libs/themes/src/index.ts',
    '^@axisui-ng/buttons$': '<rootDir>/libs/buttons/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: '<rootDir>/coverage/libs/themes',
};
