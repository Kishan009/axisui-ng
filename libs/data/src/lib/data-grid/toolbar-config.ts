import { type Density } from './grid-core';

/**
 * Toolbar affordances the grid can render. Each is an independent visibility
 * gate; the component ANDs these with the matching feature input (e.g. `search`
 * here AND `searchable()`), so a feature shows only when both allow it.
 *
 * - `overflow` is a display strategy, not a feature: when true, secondary
 *   actions collapse into a `⋯` menu instead of sitting inline.
 */
export interface GridToolbarConfig {
  sort: boolean;
  filters: boolean;
  group: boolean;
  columns: boolean;
  search: boolean;
  export: boolean;
  print: boolean;
  import: boolean;
  paste: boolean;
  /** Show the density segmented control. */
  density: boolean;
  /** Collapse secondary actions into a `⋯` overflow menu. */
  overflow: boolean;
}

/**
 * Named starting points for {@link resolveToolbar}:
 * - `full`     — every affordance on (back-compat default; matches prior behavior).
 * - `minimal`  — sort + search + density only.
 * - `readonly` — view features (sort/filter/group/columns/search/export/print), no row mutation.
 * - `none`     — nothing; the toolbar row is hidden entirely.
 */
export type GridToolbarPreset = 'full' | 'minimal' | 'readonly' | 'none';

const ALL_OFF: GridToolbarConfig = {
  sort: false,
  filters: false,
  group: false,
  columns: false,
  search: false,
  export: false,
  print: false,
  import: false,
  paste: false,
  density: false,
  overflow: false,
};

const PRESETS: Record<GridToolbarPreset, GridToolbarConfig> = {
  full: {
    sort: true, filters: true, group: true, columns: true, search: true,
    export: true, print: true, import: true, paste: true,
    // Opt-in extras — off by default so existing toolbars are unchanged.
    // `density` is a new control; `overflow` changes the inline layout.
    density: false,
    overflow: false,
  },
  minimal: {
    ...ALL_OFF, sort: true, search: true, density: true, overflow: true,
  },
  readonly: {
    ...ALL_OFF,
    sort: true, filters: true, group: true, columns: true, search: true,
    export: true, print: true, density: true, overflow: true,
  },
  none: { ...ALL_OFF },
};

/**
 * Resolve the effective toolbar config: start from the preset baseline, then
 * apply any defined overrides on top (`undefined` keys fall through to the
 * preset). Pure — never mutates the shared preset objects.
 */
export function resolveToolbar(
  preset: GridToolbarPreset,
  overrides?: Partial<GridToolbarConfig>,
): GridToolbarConfig {
  const base = PRESETS[preset];
  if (!overrides) return { ...base };
  const out = { ...base };
  for (const key of Object.keys(base) as (keyof GridToolbarConfig)[]) {
    const v = overrides[key];
    if (v !== undefined) out[key] = v;
  }
  return out;
}

/** Density tiers, tightest → loosest. Drives the density control's button order. */
export const DENSITY_ORDER: readonly Density[] = ['dense', 'compact', 'comfortable', 'spacious'];

const DENSITY_ROW_HEIGHT: Record<Density, number> = {
  dense: 28,
  compact: 32,
  comfortable: 56,
  spacious: 64,
};

/**
 * Row height in px for a density tier. Must stay in sync with the
 * `--height-row` values in `libs/themes/src/tokens.css` so virtual-scroll row
 * math matches the rendered CSS height.
 */
export function densityRowHeight(density: Density): number {
  return DENSITY_ROW_HEIGHT[density];
}
