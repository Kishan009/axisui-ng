const { defaults: ngPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...ngPreset,
  displayName: 'icons',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/icons/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/libs/icons/src/test-setup.ts'],
  transform: {
    ...ngPreset.transform,
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/libs/icons/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' },
    ],
  },
  moduleNameMapper: {
    '^@axisui-ng/angular$': '<rootDir>/libs/ui/src/index.ts',
    '^@axisui-ng/angular/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@axisui-ng/themes$': '<rootDir>/libs/themes/src/index.ts',
    '^@axisui-ng/icons$': '<rootDir>/libs/icons/src/index.ts',
    '^@axisui-ng/buttons$': '<rootDir>/libs/buttons/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: '<rootDir>/coverage/libs/icons',
};
