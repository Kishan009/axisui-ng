const { defaults: ngPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...ngPreset,
  displayName: 'charts',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/charts/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/libs/charts/src/test-setup.ts'],
  transform: {
    ...ngPreset.transform,
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/libs/charts/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' },
    ],
  },
  moduleNameMapper: {
    '^@axisui-ng/angular$': '<rootDir>/libs/ui/src/index.ts',
    '^@axisui-ng/angular/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@axisui-ng/charts$': '<rootDir>/libs/charts/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.nx/cache/', '<rootDir>/.claude/'],
  coverageDirectory: '<rootDir>/coverage/libs/charts',
};
