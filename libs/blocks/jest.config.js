const { defaults: ngPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...ngPreset,
  displayName: 'blocks',
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/blocks/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/libs/blocks/src/test-setup.ts'],
  transform: {
    ...ngPreset.transform,
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/libs/blocks/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' },
    ],
  },
  moduleNameMapper: {
    '^@axisui-ng/angular$': '<rootDir>/libs/ui/src/index.ts',
    '^@axisui-ng/angular/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@axisui-ng/themes$': '<rootDir>/libs/themes/src/index.ts',
    '^@axisui-ng/icons$': '<rootDir>/libs/icons/src/index.ts',
    '^@axisui-ng/buttons$': '<rootDir>/libs/buttons/src/index.ts',
    '^@axisui-ng/feedback$': '<rootDir>/libs/feedback/src/index.ts',
    '^@axisui-ng/tree$': '<rootDir>/libs/tree/src/index.ts',
    '^@axisui-ng/cdk$': '<rootDir>/libs/cdk/src/index.ts',
    '^@axisui-ng/forms$': '<rootDir>/libs/forms/src/index.ts',
    '^@axisui-ng/data$': '<rootDir>/libs/data/src/index.ts',
    '^@axisui-ng/overlays$': '<rootDir>/libs/overlays/src/index.ts',
    '^@axisui-ng/overlays-core$': '<rootDir>/libs/overlays-core/src/index.ts',
    '^@axisui-ng/overlays/(.*)$': '<rootDir>/libs/overlays/src/lib/$1/index.ts',
    '^@axisui-ng/blocks$': '<rootDir>/libs/blocks/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.nx/cache/', '<rootDir>/.claude/'],
  coverageDirectory: '<rootDir>/coverage/libs/blocks',
};
