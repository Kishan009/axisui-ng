import {
  DENSITY_ORDER,
  densityRowHeight,
  resolveToolbar,
  type GridToolbarConfig,
} from './toolbar-config';
import { type Density } from './grid-core';

describe('toolbar-config', () => {
  describe('resolveToolbar', () => {
    it('full preset enables the core affordances but not the opt-in extras', () => {
      const cfg = resolveToolbar('full');
      const affordances: (keyof GridToolbarConfig)[] = [
        'sort', 'filters', 'group', 'columns', 'search', 'export', 'print', 'import', 'paste',
      ];
      for (const key of affordances) expect(cfg[key]).toBe(true);
      // Opt-in extras stay off by default for back-compat:
      // density toggle and overflow are new UI, not shown unless asked for.
      expect(cfg.density).toBe(false);
      expect(cfg.overflow).toBe(false);
    });

    it('none preset disables every affordance', () => {
      const cfg = resolveToolbar('none');
      expect(Object.values(cfg).every((v) => v === false)).toBe(true);
    });

    it('minimal preset keeps only sort, search, density (+ overflow strategy)', () => {
      const cfg = resolveToolbar('minimal');
      expect(cfg.sort).toBe(true);
      expect(cfg.search).toBe(true);
      expect(cfg.density).toBe(true);
      expect(cfg.overflow).toBe(true);
      expect(cfg.filters).toBe(false);
      expect(cfg.group).toBe(false);
      expect(cfg.columns).toBe(false);
      expect(cfg.import).toBe(false);
      expect(cfg.paste).toBe(false);
    });

    it('readonly preset allows view features but no row mutation', () => {
      const cfg = resolveToolbar('readonly');
      expect(cfg.sort).toBe(true);
      expect(cfg.filters).toBe(true);
      expect(cfg.columns).toBe(true);
      expect(cfg.group).toBe(true);
      expect(cfg.search).toBe(true);
      // mutation stays off
      expect(cfg.import).toBe(false);
      expect(cfg.paste).toBe(false);
    });

    it('overrides win over the preset baseline', () => {
      const cfg = resolveToolbar('none', { search: true });
      expect(cfg.search).toBe(true);
      expect(cfg.sort).toBe(false);
    });

    it('undefined overrides fall back to the preset value', () => {
      const cfg = resolveToolbar('full', { sort: undefined });
      expect(cfg.sort).toBe(true);
    });

    it('does not mutate the preset baseline across calls', () => {
      resolveToolbar('full', { sort: false });
      expect(resolveToolbar('full').sort).toBe(true);
    });
  });

  describe('density scale', () => {
    it('DENSITY_ORDER runs tightest → loosest and covers every Density', () => {
      expect(DENSITY_ORDER).toEqual(['dense', 'compact', 'comfortable', 'spacious']);
    });

    it('densityRowHeight is strictly increasing across the order', () => {
      const heights = DENSITY_ORDER.map((d) => densityRowHeight(d));
      for (let i = 1; i < heights.length; i++) {
        expect(heights[i]).toBeGreaterThan(heights[i - 1]);
      }
    });

    it('densityRowHeight matches the tokens.css --height-row px values', () => {
      const expected: Record<Density, number> = {
        dense: 28,
        compact: 32,
        comfortable: 56,
        spacious: 64,
      };
      for (const d of DENSITY_ORDER) expect(densityRowHeight(d)).toBe(expected[d]);
    });
  });
});
