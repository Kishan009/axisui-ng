const { defaults: ngPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...ngPreset,
  displayName: 'data',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/data/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/libs/data/src/test-setup.ts'],
  transform: {
    ...ngPreset.transform,
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/libs/data/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' },
    ],
  },
  moduleNameMapper: {
    '^@axisui-ng/angular$': '<rootDir>/libs/ui/src/index.ts',
    '^@axisui-ng/angular/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@axisui-ng/themes$': '<rootDir>/libs/themes/src/index.ts',
    '^@axisui-ng/icons$': '<rootDir>/libs/icons/src/index.ts',
    '^@axisui-ng/cdk$': '<rootDir>/libs/cdk/src/index.ts',
    '^@axisui-ng/data$': '<rootDir>/libs/data/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.nx/cache/', '<rootDir>/.claude/'],
  coverageDirectory: '<rootDir>/coverage/libs/data',
};
