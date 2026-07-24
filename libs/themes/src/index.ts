/**
 * @axisui-ng/themes — Design tokens, presets, dark mode.
 * The single source of truth for the design system is libs/themes/src/tokens.css.
 *
 * Consumers either:
 *   - @import "@axisui-ng/angular/styles.css"           (pre-compiled, zero-config)
 *   - @import "@axisui-ng/angular/preset.css"           (extenders, with their own Tailwind)
 *   - @import "@axisui-ng/themes/presets/<name>.css"    (per-preset token overrides)
 */

export * from './lib/apply-theme';
export * from './lib/tokens';
