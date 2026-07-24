const { defaults: ngPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...ngPreset,
  displayName: 'layout',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/layout/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/libs/layout/src/test-setup.ts'],
  transform: {
    ...ngPreset.transform,
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/libs/layout/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' },
    ],
  },
  moduleNameMapper: {
    '^@axisui-ng/angular$': '<rootDir>/libs/ui/src/index.ts',
    '^@axisui-ng/angular/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@axisui-ng/themes$': '<rootDir>/libs/themes/src/index.ts',
    '^@axisui-ng/icons$': '<rootDir>/libs/icons/src/index.ts',
    '^@axisui-ng/layout$': '<rootDir>/libs/layout/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.nx/cache/', '<rootDir>/.claude/'],
  coverageDirectory: '<rootDir>/coverage/libs/layout',
};
