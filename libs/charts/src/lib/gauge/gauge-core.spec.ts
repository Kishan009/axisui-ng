import { arcPath, clampValue, polar, valueToAngle } from './gauge-core';

describe('gauge-core', () => {
  describe('clampValue', () => {
    it('clamps to range', () => {
      expect(clampValue(150, 0, 100)).toBe(100);
      expect(clampValue(-5, 0, 100)).toBe(0);
      expect(clampValue(40, 0, 100)).toBe(40);
    });
  });

  describe('valueToAngle', () => {
    it('maps min/mid/max across the angle span', () => {
      expect(valueToAngle(0, 0, 100, 0, 180)).toBe(0);
      expect(valueToAngle(50, 0, 100, 0, 180)).toBe(90);
      expect(valueToAngle(100, 0, 100, 0, 180)).toBe(180);
    });
    it('clamps out-of-range values', () => {
      expect(valueToAngle(150, 0, 100, 0, 180)).toBe(180);
    });
    it('min===max → startAngle', () => {
      expect(valueToAngle(5, 5, 5, 30, 210)).toBe(30);
    });
  });

  describe('polar', () => {
    it('places points clockwise from 3 o-clock (SVG y-down)', () => {
      const [x0, y0] = polar(0, 0, 10, 0);
      expect(x0).toBeCloseTo(10);
      expect(y0).toBeCloseTo(0);
      const [x90, y90] = polar(0, 0, 10, 90);
      expect(x90).toBeCloseTo(0);
      expect(y90).toBeCloseTo(10);
    });
  });

  describe('arcPath', () => {
    it('starts with M and contains an A (arc) command', () => {
      const d = arcPath(60, 60, 48, 0, 180);
      expect(d.startsWith('M')).toBe(true);
      expect(d).toContain('A');
    });
    it('flags a large arc past 180 degrees', () => {
      expect(arcPath(60, 60, 48, 0, 270)).toMatch(/A [\d.]+ [\d.]+ 0 1 1/);
    });
  });
});
