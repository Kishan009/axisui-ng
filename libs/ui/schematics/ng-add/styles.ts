/**
 * Pure, devkit-free helpers for the AxisUI `ng-add` schematic.
 *
 * Kept separate from index.ts (which pulls in @angular-devkit/schematics) so the
 * transform logic can be unit-tested without the schematics runtime.
 */

/** Marker that tells us AxisUI styles are already wired (idempotency guard). */
export const AXISUI_STYLES_MARKER = "@axisui-ng/themes/tokens.css";

/**
 * Lines prepended to a consumer's global stylesheet. `tokens.css` itself
 * `@import`s Tailwind v4 and declares the `@theme` block; the `@source` rule
 * opts Tailwind into scanning the compiled AxisUI templates in node_modules so
 * the utility classes they use are generated.
 */
export const AXISUI_STYLES_HEADER = [
  "/* AxisUI — Tailwind v4 + design tokens (added by `ng add @axisui-ng/angular`) */",
  "@import '@axisui-ng/themes/tokens.css';",
  "@source '../node_modules/@axisui-ng/**/*.mjs';",
  "",
].join("\n");

/** The PostCSS config that runs the Tailwind v4 plugin. */
export const POSTCSS_CONFIG = {
  plugins: { "@tailwindcss/postcss": {} },
};

/**
 * Prepend the AxisUI styles header to a global stylesheet, idempotently.
 * Returns the input unchanged if AxisUI is already wired.
 */
export function withAxisUiStyles(content: string): string {
  if (content.includes(AXISUI_STYLES_MARKER)) return content;
  const body = content.trim().length ? "\n" + content : "";
  return AXISUI_STYLES_HEADER + body;
}

/** A single entry in an Angular build target's `styles[]`. */
type StyleEntry = string | { input?: string };

/**
 * Pick the first `.css`/`.scss` entry from an Angular build target's `styles[]`.
 * Returns undefined when there is no usable global stylesheet.
 */
export function pickStylePath(styles: unknown): string | undefined {
  if (!Array.isArray(styles)) return undefined;
  for (const entry of styles as StyleEntry[]) {
    const path =
      typeof entry === "string"
        ? entry
        : entry && typeof entry === "object"
          ? entry.input
          : undefined;
    if (path && /\.(css|scss)$/.test(path)) return path;
  }
  return undefined;
}
