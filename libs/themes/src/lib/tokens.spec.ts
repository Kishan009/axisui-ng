/**
 * Smoke test for the themes lib's public API.
 * The CSS tokens themselves are tested by rendering a Button in apps/demo
 * (Phase 1). Here we just verify the TypeScript surface is consistent.
 */

import {
  TOKEN_NAMES,
  PRESET_NAMES,
  INDUSTRY_NAMES,
  type TokenName,
  type PresetName,
  type IndustryName,
  type DensityMode,
  type TrustTier,
} from './tokens';

describe('tokens', () => {
  it('exports a non-empty list of token names', () => {
    expect(TOKEN_NAMES.length).toBeGreaterThan(0);
    expect(TOKEN_NAMES.every((n) => n.startsWith('--'))).toBe(true);
  });

  it('exposes the motion easing + duration tokens', () => {
    for (const name of [
      '--ease-out-expo',
      '--ease-out-quart',
      '--ease-in-quart',
      '--duration-fast',
      '--duration',
      '--duration-slow',
    ] as const) {
      expect(TOKEN_NAMES).toContain(name);
    }
  });

  it('exports 11 presets (6 consumer + 5 industry)', () => {
    expect(PRESET_NAMES).toHaveLength(11);
  });

  it('exports 5 industry presets', () => {
    expect(INDUSTRY_NAMES).toHaveLength(5);
    const expected: IndustryName[] = ['banking', 'healthcare', 'automotive', 'logistics', 'government'];
    expect(INDUSTRY_NAMES).toEqual(expected);
  });

  it('industry presets are a subset of all presets', () => {
    for (const industry of INDUSTRY_NAMES) {
      expect(PRESET_NAMES).toContain(industry);
    }
  });

  it('types compile correctly', () => {
    // Compile-time check that the type aliases are usable.
    const token: TokenName = '--color-primary';
    const preset: PresetName = 'banking';
    const industry: IndustryName = 'healthcare';
    const density: DensityMode = 'compact';
    const trust: TrustTier = 'regulated';
    expect(token).toBe('--color-primary');
    expect(preset).toBe('banking');
    expect(industry).toBe('healthcare');
    expect(density).toBe('compact');
    expect(trust).toBe('regulated');
  });
});
