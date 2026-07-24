import {
  deltaEOk,
  formatColor,
  gamutMapChroma,
  isInGamut,
  nearestToken,
  oklchToSrgb,
  parseColor,
  srgbToOklch,
  type ColorToken,
  type Oklch,
} from './color-core';

describe('color-core', () => {
  describe('oklchToSrgb anchors', () => {
    it('white', () => {
      const { r, g, b } = oklchToSrgb({ l: 1, c: 0, h: 0, alpha: 1 });
      expect(r).toBeCloseTo(1, 2);
      expect(g).toBeCloseTo(1, 2);
      expect(b).toBeCloseTo(1, 2);
    });
    it('black', () => {
      const { r, g, b } = oklchToSrgb({ l: 0, c: 0, h: 0, alpha: 1 });
      expect(r).toBeCloseTo(0, 2);
      expect(g).toBeCloseTo(0, 2);
      expect(b).toBeCloseTo(0, 2);
    });
  });

  describe('round-trip hex <-> oklch', () => {
    it.each(['#000000', '#ffffff', '#3366cc', '#ff8800', '#12ab56'])('preserves %s', (hex) => {
      const ok = parseColor(hex);
      expect(ok).not.toBeNull();
      expect(formatColor(ok as Oklch, 'hex')).toBe(hex);
    });
  });

  describe('isInGamut', () => {
    it('a muted color is in gamut', () => {
      expect(isInGamut({ l: 0.5, c: 0.1, h: 250, alpha: 1 })).toBe(true);
    });
    it('a very high-chroma color is out of gamut', () => {
      expect(isInGamut({ l: 0.9, c: 0.4, h: 250, alpha: 1 })).toBe(false);
    });
  });

  describe('gamutMapChroma', () => {
    it('returns an in-gamut color with L and H preserved and chroma reduced', () => {
      const input: Oklch = { l: 0.9, c: 0.4, h: 250, alpha: 1 };
      const mapped = gamutMapChroma(input);
      expect(mapped.l).toBe(0.9);
      expect(mapped.h).toBe(250);
      expect(mapped.c).toBeLessThan(0.4);
      expect(isInGamut(mapped)).toBe(true);
    });
    it('leaves an already in-gamut color essentially unchanged', () => {
      const input: Oklch = { l: 0.5, c: 0.1, h: 250, alpha: 1 };
      expect(gamutMapChroma(input).c).toBeCloseTo(0.1, 3);
    });
  });

  describe('parseColor', () => {
    it('parses rgb()', () => {
      const ok = parseColor('rgb(255, 0, 0)');
      expect(formatColor(ok as Oklch, 'hex')).toBe('#ff0000');
    });
    it('parses oklch() with fractional L', () => {
      const ok = parseColor('oklch(0.7 0.1 200)');
      expect(ok?.l).toBeCloseTo(0.7, 3);
      expect(ok?.c).toBeCloseTo(0.1, 3);
      expect(ok?.h).toBeCloseTo(200, 3);
    });
    it('parses oklch() with percentage L', () => {
      expect(parseColor('oklch(70% 0.1 200)')?.l).toBeCloseTo(0.7, 3);
    });
    it('parses 8-digit hex alpha', () => {
      expect(parseColor('#ff000080')?.alpha).toBeCloseTo(128 / 255, 2);
    });
    it('returns null on junk', () => {
      expect(parseColor('not-a-color')).toBeNull();
    });
  });

  describe('formatColor', () => {
    it('omits alpha when opaque (rgb)', () => {
      expect(formatColor({ l: 0, c: 0, h: 0, alpha: 1 }, 'rgb')).toBe('rgb(0, 0, 0)');
    });
    it('includes alpha when translucent (rgb)', () => {
      expect(formatColor(parseColor('#00000080') as Oklch, 'rgb')).toMatch(/^rgba\(0, 0, 0, 0\.50\)$/);
    });
    it('emits oklch with / alpha when translucent', () => {
      expect(formatColor({ l: 0.5, c: 0.1, h: 200, alpha: 0.5 }, 'oklch')).toMatch(/\/ 0\.5\)$/);
    });
  });

  describe('deltaEOk / nearestToken', () => {
    const toks: ColorToken[] = [
      { name: '--color-a', value: 'oklch(0.5 0.1 250)', oklch: { l: 0.5, c: 0.1, h: 250, alpha: 1 } },
      { name: '--color-b', value: 'oklch(0.9 0.05 100)', oklch: { l: 0.9, c: 0.05, h: 100, alpha: 1 } },
    ];
    it('distance to self is zero', () => {
      expect(deltaEOk(toks[0]!.oklch, toks[0]!.oklch)).toBeCloseTo(0, 6);
    });
    it('picks the nearest token', () => {
      expect(nearestToken({ l: 0.52, c: 0.11, h: 248, alpha: 1 }, toks)?.name).toBe('--color-a');
    });
    it('returns null for an empty token list', () => {
      expect(nearestToken({ l: 0.5, c: 0.1, h: 250, alpha: 1 }, [])).toBeNull();
    });
  });
});
