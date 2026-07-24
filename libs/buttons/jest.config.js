const { defaults: ngPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...ngPreset,
  displayName: 'buttons',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/buttons/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/libs/buttons/src/test-setup.ts'],
  // Override the tsconfig path from the preset (which points to <rootDir>/tsconfig.spec.json)
  transform: {
    ...ngPreset.transform,
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/libs/buttons/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' },
    ],
  },
  moduleNameMapper: {
    '^@axisui-ng/angular$': '<rootDir>/libs/ui/src/index.ts',
    '^@axisui-ng/angular/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@axisui-ng/themes$': '<rootDir>/libs/themes/src/index.ts',
    '^@axisui-ng/buttons$': '<rootDir>/libs/buttons/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: '<rootDir>/coverage/libs/buttons',
};
