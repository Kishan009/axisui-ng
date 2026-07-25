// @ts-check
/**
 * Root ESLint config (flat config, ESLint 9).
 *
 * Production TypeScript (`**\/*.ts`, excluding specs/stories) is linted with the
 * typescript-eslint **type-checked** recommended set + angular-eslint, using the
 * TS project service. Inline component templates are extracted via
 * `angular.processInlineTemplates` and linted with the template + a11y rule sets.
 * Specs and stories use the non-type-checked set (test code legitimately uses
 * `any` and DOM lookups that the typed `no-unsafe-*` rules would flood).
 *
 * The `tools/session/check-conventions.sh` PreToolUse hook remains the
 * write-time enforcer; this is the CI/commit-time gate (`nx run-many -t lint`).
 */
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.nx/**',
      '**/.angular/**',
      '**/storybook-static/**',
      'apps/docs/dist/**',
      'apps/docs/.astro/**',
      '**/node_modules/**',
      'tmp/**',
      // Codegen/build scripts that aren't part of any project's tsconfig.
      '**/scripts/**',
    ],
  },
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.stories.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // Underscore-prefixed identifiers are intentional throwaways.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'ax', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'ax', style: 'camelCase' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      // ratchet: the no-unsafe-* family floods on loosely-typed DOM access (host.nativeElement,
      // event.target, getComputedStyle → any). Re-enable per-rule after DOM access is fully typed
      // (ElementRef<HTMLElement>, typed casts). The other type-checked rules (floating/misused
      // promises, await-thenable, unnecessary assertions, …) stay on — those catch real bugs.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // ratchet: false-positives on the `Array.from(el.querySelectorAll(...)) as HTMLElement[]`
      // idiom because this codebase's ElementRef.nativeElement is effectively `any` — the casts are
      // useful, not redundant. Re-enable once DOM access is properly typed (paired with no-unsafe-*).
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // `select`/`change` etc. are deliberate, already-published output names — the few real
      // uses carry a justified inline eslint-disable.
      '@angular-eslint/no-output-native': 'error',
      // A few inputs alias to a name that collides with an interface getter (e.g. menu-item
      // `disabled`); those carry a justified inline eslint-disable.
      '@angular-eslint/no-input-rename': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // `ax-input` is our custom form control; a wrapping <label> is correctly associated with it.
      '@angular-eslint/template/label-has-associated-control': ['error', { controlComponents: ['ax-input'] }],
      // `x == null` (null OR undefined) is an intentional idiom.
      '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }],
      // These fire on inner clickable elements whose keyboard/focus is handled at the widget
      // container (roving tabindex / aria-activedescendant + host keydown); 3-mode jest-axe
      // covers the real a11y. The few genuine spots carry a justified inline eslint-disable.
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
    },
  },
  {
    // [axButtonGroup] is a component with an attribute selector (camelCase by convention).
    files: ['**/button-group/button-group.component.ts'],
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'attribute', prefix: 'ax', style: 'camelCase' }],
    },
  },
  {
    // The demo app uses the `demo` prefix (with `app` also allowed), not the library `ax` prefix.
    // Excludes specs/stories so it only layers onto the (plugin-registering) production block.
    files: ['apps/demo/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.stories.ts'],
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: ['demo', 'app'], style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: ['demo', 'app'], style: 'camelCase' }],
    },
  },
  {
    // Specs + stories: non-type-checked (test code uses `any` + loose DOM lookups by design).
    files: ['**/*.spec.ts', '**/*.stories.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
